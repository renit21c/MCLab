const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
  console.log(req.method, req.url);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.get("/health", (req, res) => {
  res.json(makeResponse({ status: "ok" }));
});

app.use(express.static(__dirname));

function makeResponse(data, success = true) {
  return { success, ...data };
}

function buildWavBuffer(pcmBuffer, sampleRate, channels, bitsPerSample) {
  const blockAlign = channels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmBuffer.length;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataSize, 40);
  pcmBuffer.copy(buffer, 44);
  return buffer;
}

function encodeAudioBuffer(inputBuffer) {
  const header = inputBuffer.subarray(0, 12).toString("ascii");
  if (
    header.startsWith("RIFF") &&
    inputBuffer.subarray(8, 12).toString("ascii") === "WAVE"
  ) {
    const sampleRate = inputBuffer.readUInt32LE(24);
    const channels = inputBuffer.readUInt16LE(22);
    const bitsPerSample = inputBuffer.readUInt16LE(34);
    const dataOffset = 44;
    const dataSize = inputBuffer.readUInt32LE(40);
    const pcmBytes = inputBuffer.subarray(dataOffset, dataOffset + dataSize);

    const samples = [];
    if (bitsPerSample === 16) {
      for (let i = 0; i < pcmBytes.length; i += 2) {
        samples.push(pcmBytes.readInt16LE(i));
      }
    } else if (bitsPerSample === 8) {
      for (let i = 0; i < pcmBytes.length; i++) {
        samples.push((pcmBytes[i] - 128) * 256);
      }
    } else {
      return buildWavBuffer(
        Buffer.from(pcmBytes),
        sampleRate,
        channels,
        bitsPerSample,
      );
    }

    const monoSamples = [];
    for (let i = 0; i < samples.length; i += channels) {
      let sum = 0;
      for (let c = 0; c < channels; c++) {
        sum += samples[i + c] || 0;
      }
      monoSamples.push(Math.round(sum / Math.max(1, channels)));
    }

    const downsampled = monoSamples.filter((_, idx) => idx % 2 === 0);
    const pcm8 = Buffer.alloc(downsampled.length);
    for (let i = 0; i < downsampled.length; i++) {
      const clamped = Math.max(-32768, Math.min(32767, downsampled[i]));
      pcm8[i] = Math.round((clamped / 32768 + 1) * 127.5);
    }
    return buildWavBuffer(
      pcm8,
      Math.max(8000, Math.round(sampleRate / 2)),
      1,
      8,
    );
  }

  const raw = inputBuffer.subarray(0, Math.min(inputBuffer.length, 16000));
  const pcm8 = Buffer.alloc(raw.length);
  raw.copy(pcm8);
  return buildWavBuffer(pcm8, 8000, 1, 8);
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "multimedia-codec-laboratory.html"));
});

app.post("/api/encode/image", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json(makeResponse({ error: "File image tidak ditemukan" }, false));
    }

    const format = (req.body.format || "jpeg").toLowerCase();
    const quality = Math.max(1, Math.min(100, Number(req.body.quality || 70)));
    const input = sharp(req.file.buffer);
    const metadata = await input.metadata();

    let outputBuffer;
    const mimeType =
      format === "png"
        ? "image/png"
        : format === "webp"
          ? "image/webp"
          : "image/jpeg";

    if (format === "png") {
      outputBuffer = await input
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toBuffer();
    } else if (format === "webp") {
      outputBuffer = await input.webp({ quality }).toBuffer();
    } else {
      outputBuffer = await input
        .jpeg({ quality, progressive: true })
        .toBuffer();
    }

    res.json(
      makeResponse({
        filename: `encoded-${Date.now()}.${format === "png" ? "png" : format === "webp" ? "webp" : "jpg"}`,
        mimeType,
        size: outputBuffer.length,
        width: metadata.width,
        height: metadata.height,
        buffer: outputBuffer.toString("base64"),
      }),
    );
  } catch (error) {
    res.status(500).json(makeResponse({ error: error.message }, false));
  }
});

app.post("/api/encode/audio", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json(makeResponse({ error: "File audio tidak ditemukan" }, false));
    }

    const outputBuffer = encodeAudioBuffer(req.file.buffer);
    res.json(
      makeResponse({
        filename: `encoded-${Date.now()}.wav`,
        mimeType: "audio/wav",
        size: outputBuffer.length,
        buffer: outputBuffer.toString("base64"),
      }),
    );
  } catch (error) {
    res.status(500).json(makeResponse({ error: error.message }, false));
  }
});

app.post("/api/encode/video", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json(makeResponse({ error: "File video tidak ditemukan" }, false));
    }

    const outputBuffer = Buffer.from(req.file.buffer);
    res.json(
      makeResponse({
        filename: `encoded-${Date.now()}.bin`,
        mimeType: "application/octet-stream",
        size: outputBuffer.length,
        buffer: outputBuffer.toString("base64"),
      }),
    );
  } catch (error) {
    res.status(500).json(makeResponse({ error: error.message }, false));
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
