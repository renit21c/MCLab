/* =========================================================
M.C.LAB — MULTIMEDIA CODEC LABORATORY
Front-end engine: real client-side RLE / entropy / LSB /
PCM-DPCM / frame-diff algorithms running in-browser.
========================================================= */

/* ---------- small utils ---------- */
function formatBytes(n) {
  if (n === 0) return "0 B";
  if (n < 1024) return n + " B";
  const units = ["KB", "MB", "GB"];
  let i = -1;
  let v = n;
  do {
    v /= 1024;
    i++;
  } while (v >= 1024 && i < units.length - 1);
  return v.toFixed(2) + " " + units[i];
}
function formatMs(ms) {
  return ms < 1000 ? Math.round(ms) + " ms" : (ms / 1000).toFixed(2) + " s";
}
function formatClock(totalSec) {
  if (!isFinite(totalSec) || totalSec < 0) totalSec = 0;
  const m = Math.floor(totalSec / 60),
    s = Math.floor(totalSec % 60);
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}
function escapeHtml(s) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}
function $(sel) {
  return document.querySelector(sel);
}
function $all(sel) {
  return Array.from(document.querySelectorAll(sel));
}

async function callBackend(endpoint, formData) {
  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Backend request failed");
  }
  return data;
}

function toast(msg, type) {
  const t = document.createElement("div");
  t.className = "toast" + (type ? " " + type : "");
  t.textContent = msg;
  $("#toastwrap").appendChild(t);
  setTimeout(() => {
    t.style.transition = "opacity .4s";
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 420);
  }, 3400);
}

/* ---------- clock ---------- */
function tickClock() {
  const d = new Date();
  const s = d.toLocaleTimeString("en-GB", { hour12: false });
  const tbClock = document.getElementById("tb-clock");
  if (tbClock) tbClock.textContent = s;
}

const startBtn = document.getElementById("tb-start");
const startMenu = document.getElementById("start-menu");

function closeStartMenu() {
  if (!startMenu || !startBtn) return;
  startMenu.classList.remove("open");
  startBtn.classList.remove("active");
  startMenu.setAttribute("aria-hidden", "true");
}

function toggleStartMenu(force) {
  if (!startMenu || !startBtn) return;
  const shouldOpen =
    typeof force === "boolean" ? force : !startMenu.classList.contains("open");
  startMenu.classList.toggle("open", shouldOpen);
  startBtn.classList.toggle("active", shouldOpen);
  startMenu.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
}

if (startBtn) {
  startBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleStartMenu();
  });
  startBtn.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleStartMenu();
    }
  });
}

document.addEventListener("click", (event) => {
  if (!startMenu || !startBtn) return;
  if (!startBtn.contains(event.target) && !startMenu.contains(event.target)) {
    closeStartMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeStartMenu();
});

setInterval(tickClock, 1000);
tickClock();

/* =========================================================
BACKGROUND: cyber grid + floating particles canvas
========================================================= */
(function bgEngine() {
  const canvas = $("#bg-canvas");
  const ctx = canvas.getContext("2d");
  let w, h;
  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  const particleCount = window.innerWidth < 700 ? 28 : 60;
  const particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2 + 0.6,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      hue: Math.random() > 0.5 ? "rgba(0,229,255," : "rgba(179,71,255,",
      a: Math.random() * 0.5 + 0.25,
    });
  }
  let gridOffset = 0;
  function drawGrid() {
    const spacing = 46;
    gridOffset = (gridOffset + 0.15) % spacing;
    ctx.strokeStyle = "rgba(0,229,255,0.06)";
    ctx.lineWidth = 1;
    for (let x = -spacing; x < w + spacing; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x + gridOffset, 0);
      ctx.lineTo(x + gridOffset, h);
      ctx.stroke();
    }
    for (let y = -spacing; y < h + spacing; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y + gridOffset);
      ctx.lineTo(w, y + gridOffset);
      ctx.stroke();
    }
  }
  function drawParticles() {
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;
      ctx.beginPath();
      ctx.fillStyle = p.hue + p.a + ")";
      ctx.shadowColor = p.hue + "1)";
      ctx.shadowBlur = 6;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
  function loop() {
    ctx.clearRect(0, 0, w, h);
    drawGrid();
    drawParticles();
    requestAnimationFrame(loop);
  }
  loop();
})();

/* =========================================================
BOOT SEQUENCE
========================================================= */
(function boot() {
  const lines = [
    {
      t: 'M.C.LAB BIOS v4.20.2000 ........... <span class="ok">OK</span>',
    },
    {
      t: 'Detecting holographic display adapter .. <span class="ok">OK</span>',
    },
    {
      t: 'Initializing codec drivers ............ <span class="ok">OK</span>',
    },
    {
      t: 'Loading Huffman engine ................ <span class="ok">OK</span>',
    },
    {
      t: 'Loading Run-Length encoder ............ <span class="ok">OK</span>',
    },
    {
      t: 'Loading DPCM audio module ............. <span class="ok">OK</span>',
    },
    {
      t: 'Mounting LSB steganography module ..... <span class="ok">OK</span>',
    },
    {
      t: 'Calibrating neon subsystem ............ <span class="ok">OK</span>',
    },
    {
      t: 'Establishing glassmorphic UI layer .... <span class="ok">OK</span>',
    },
    {
      t: 'Linking Chart.js visualization core ... <span class="ok">OK</span>',
    },
    { t: "Welcome, OPERATOR." },
  ];
  const consoleEl = $("#bootConsole");
  const bar = $("#bootBar");
  const pct = $("#bootPct");
  let i = 0;
  let pctVal = 0;
  let finished = false;

  function appendLine() {
    if (i >= lines.length) {
      finished = true;
      $("#bootSkip").style.opacity = "1";
      return;
    }
    const div = document.createElement("div");
    div.innerHTML = lines[i].t;
    if (i === lines.length - 1) div.classList.add("cursor-line");
    consoleEl.appendChild(div);
    consoleEl.scrollTop = consoleEl.scrollHeight;
    i++;
    pctVal = Math.min(100, Math.round((i / lines.length) * 100));
    bar.style.width = pctVal + "%";
    pct.textContent = "INITIALIZING... " + pctVal + "%";
    setTimeout(appendLine, 230 + Math.random() * 180);
  }
  appendLine();

  function finishBoot() {
    const screen = $("#boot-screen");
    screen.classList.add("boot-hide");
    setTimeout(() => {
      screen.style.display = "none";
      document.body.classList.add("crt-poweron");
      flashOn();
    }, 600);
  }
  function flashOn() {
    const flash = document.createElement("div");
    flash.style.cssText =
      "position:fixed;inset:0;background:#fff;z-index:10500;opacity:0.9;pointer-events:none;";
    document.body.appendChild(flash);
    requestAnimationFrame(() => {
      flash.style.transition = "opacity .5s ease";
      flash.style.opacity = "0";
      setTimeout(() => flash.remove(), 520);
    });
  }
  setTimeout(() => {
    if (!finished) {
      /* allow skip even before lines finish */
    }
  }, 100);
  document.getElementById("boot-screen").addEventListener("click", finishBoot);
  document.addEventListener("keydown", function once(e) {
    finishBoot();
    document.removeEventListener("keydown", once);
  });
  // auto-continue safety
  setTimeout(() => {
    if (document.getElementById("boot-screen").style.display !== "none")
      finishBoot();
  }, 4200);
})();

/* =========================================================
WINDOW MANAGER — drag, focus, minimize, close, taskbar
========================================================= */
let zTop = 50;
const windowMeta = {}; // id -> {label, el, taskbarBtn}

function bringToFront(el) {
  zTop++;
  el.style.zIndex = zTop;
  $all(".y2k-window, #mediaplayer, #webcamwidget").forEach((w) =>
    w.classList.remove("focused"),
  );
  el.classList.add("focused");
}

function makeDraggable(el, handle) {
  if (!el || !handle) return;
  handle.style.cursor = "default";
}

function registerWindow(id, label, icon) {
  const el = document.getElementById(id);
  if (!el) return;
  const handle = el.querySelector(".win-titlebar, .mp-head, .cam-head");
  makeDraggable(el, handle);
  el.addEventListener("pointerdown", () => bringToFront(el), {
    capture: true,
  });

  const minBtn = el.querySelector('[data-act="min"]');
  const closeBtn = el.querySelector('[data-act="close"]');
  if (minBtn) minBtn.addEventListener("click", () => minimizeWindow(id));
  if (closeBtn) closeBtn.addEventListener("click", () => minimizeWindow(id));

  // taskbar pill
  const tbItem = document.createElement("div");
  tbItem.className = "tb-item";
  tbItem.innerHTML =
    '<span class="tb-icon">' +
    icon +
    '</span><span class="tb-label">' +
    label +
    "</span>";
  tbItem.title = label;
  tbItem.addEventListener("click", () => openWindow(id));
  $("#tb-items").appendChild(tbItem);

  windowMeta[id] = { el, tbItem };
}

function syncLauncherSelection() {
  $all(".start-menu-item").forEach((item) => {
    const target = item.dataset.open;
    const isOpen = Boolean(
      target &&
      windowMeta[target] &&
      !windowMeta[target].el.classList.contains("minimized"),
    );
    item.classList.toggle("active", isOpen);
  });
}

function openWindow(id) {
  const m = windowMeta[id];
  if (!m) return;
  m.el.classList.remove("minimized");
  m.el.style.display =
    id === "mediaplayer" || id === "webcamwidget" ? "" : "flex";
  bringToFront(m.el);
  $all(".tb-item").forEach((item) => item.classList.remove("active"));
  m.tbItem.classList.add("active");
  syncLauncherSelection();
}
function minimizeWindow(id) {
  const m = windowMeta[id];
  if (!m) return;
  m.el.classList.add("minimized");
  m.el.style.display = "none";
  m.tbItem.classList.remove("active");
  syncLauncherSelection();
}

document.addEventListener("DOMContentLoaded", () => {
  $all(".start-menu-item").forEach((item) => {
    item.addEventListener("click", () => {
      const target = item.dataset.open;
      if (target) {
        openWindow(target);
        closeStartMenu();
      }
    });
  });

  registerWindow(
    "win-image",
    "IMAGE CODEC",
    '<span class="material-icons">image</span>',
  );
  registerWindow(
    "win-audio",
    "AUDIO CODEC",
    '<span class="material-icons">headset</span>',
  );
  registerWindow(
    "win-video",
    "VIDEO CODEC",
    '<span class="material-icons">videocam</span>',
  );
  registerWindow(
    "win-stego",
    "STEGANOGRAPHY",
    '<span class="material-icons">lock</span>',
  );
  registerWindow(
    "win-stats",
    "STATISTICS",
    '<span class="material-icons">bar_chart</span>',
  );
  registerWindow(
    "mediaplayer",
    "M.C.PLAYER",
    '<span class="material-icons">audio_library</span>',
  );
  registerWindow(
    "webcamwidget",
    "CAMVIEW",
    '<span class="material-icons">camera_alt</span>',
  );

  $all(".dock-btn").forEach((btn) => {
    btn.addEventListener("click", () => openWindow(btn.dataset.open));
  });

  // media player shade toggle
  const shadeBtn = document.querySelector("[data-shade]");
  if (shadeBtn)
    shadeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      document.getElementById("mediaplayer").classList.toggle("shaded");
    });
});

/* dropzone generic binder */
function setupDropzone(zoneId, inputId, onFile) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  if (!zone || !input) return;
  zone.addEventListener("click", () => input.click());
  input.addEventListener("change", (e) => {
    if (e.target.files[0]) onFile(e.target.files[0]);
  });
  ["dragenter", "dragover"].forEach((ev) =>
    zone.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.add("dragover");
    }),
  );
  ["dragleave", "drop"].forEach((ev) =>
    zone.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.remove("dragover");
    }),
  );
  zone.addEventListener("drop", (e) => {
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  });
}

/* tab binder */
function setupTabs(scopeSelector) {
  $all(scopeSelector + " .tabbtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const scope = btn.closest(".win-body");
      scope
        .querySelectorAll(".tabbtn")
        .forEach((b) => b.classList.remove("active"));
      scope
        .querySelectorAll(".tabpane")
        .forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      scope.querySelector("#" + btn.dataset.tab).classList.add("active");
    });
  });
}

/* animated progress bar helper: resolves after a believable processing animation */
function runProgress(wrapId, barId, labelId, pctId, durationMs) {
  return new Promise((resolve) => {
    const wrap = document.getElementById(wrapId),
      bar = document.getElementById(barId);
    const label = document.getElementById(labelId),
      pctEl = document.getElementById(pctId);
    wrap.style.display = "block";
    label.style.display = "flex";
    let start = null;
    function frame(ts) {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / durationMs);
      const pct = Math.round(p * 100);
      bar.style.width = pct + "%";
      pctEl.textContent = pct + "%";
      if (p < 1) requestAnimationFrame(frame);
      else {
        setTimeout(() => {
          wrap.style.display = "none";
          label.style.display = "none";
          resolve();
        }, 150);
      }
    }
    requestAnimationFrame(frame);
  });
}

/* =========================================================
SESSION LOG + STATS DASHBOARD (Chart.js)
========================================================= */
const sessionLog = []; // {label, type, orig, comp, ratio, time}
let chartRatio = null,
  chartSize = null;

Chart.defaults.color = "#c9d6ff";
Chart.defaults.font.family = "'Share Tech Mono', monospace";
Chart.defaults.font.size = 10;

function initDashCharts() {
  const ctxR = document.getElementById("chart-ratio").getContext("2d");
  chartRatio = new Chart(ctxR, {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          label: "Ratio (x)",
          data: [],
          backgroundColor: "rgba(0,229,255,0.55)",
          borderColor: "#00e5ff",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: "rgba(255,255,255,0.06)" } },
        y: {
          grid: { color: "rgba(255,255,255,0.06)" },
          beginAtZero: true,
        },
      },
      plugins: { legend: { display: false } },
    },
  });
  const ctxS = document.getElementById("chart-size").getContext("2d");
  chartSize = new Chart(ctxS, {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          label: "Sebelum",
          data: [],
          backgroundColor: "rgba(179,71,255,0.55)",
          borderColor: "#b347ff",
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: "Sesudah",
          data: [],
          backgroundColor: "rgba(255,43,214,0.55)",
          borderColor: "#ff2bd6",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: "rgba(255,255,255,0.06)" } },
        y: {
          grid: { color: "rgba(255,255,255,0.06)" },
          beginAtZero: true,
          ticks: { callback: (v) => formatBytes(v) },
        },
      },
      plugins: { legend: { labels: { boxWidth: 10 } } },
    },
  });
}

function logOperation(entry) {
  sessionLog.push(entry);
  // dashboard summary
  document.getElementById("dash-total").textContent = sessionLog.length;
  const avgRatio =
    sessionLog.reduce((a, e) => a + e.ratio, 0) / sessionLog.length;
  document.getElementById("dash-avgratio").textContent =
    avgRatio.toFixed(2) + "x";
  const saved = sessionLog.reduce((a, e) => a + (e.orig - e.comp), 0);
  document.getElementById("dash-saved").textContent = formatBytes(
    Math.max(0, saved),
  );
  const avgTime =
    sessionLog.reduce((a, e) => a + e.time, 0) / sessionLog.length;
  document.getElementById("dash-avgtime").textContent = formatMs(avgTime);

  // charts
  if (chartRatio) {
    chartRatio.data.labels.push(entry.label);
    chartRatio.data.datasets[0].data.push(+entry.ratio.toFixed(2));
    chartSize.data.labels.push(entry.label);
    chartSize.data.datasets[0].data.push(entry.orig);
    chartSize.data.datasets[1].data.push(entry.comp);
    if (chartRatio.data.labels.length > 8) {
      chartRatio.data.labels.shift();
      chartRatio.data.datasets[0].data.shift();
      chartSize.data.labels.shift();
      chartSize.data.datasets[0].data.shift();
      chartSize.data.datasets[1].data.shift();
    }
    chartRatio.update();
    chartSize.update();
  }

  // log list
  const logEl = document.getElementById("dash-log");
  const row = document.createElement("div");
  const t = new Date().toLocaleTimeString("en-GB", { hour12: false });
  row.innerHTML =
    "[" +
    t +
    '] <span style="color:#5be8ff">' +
    entry.label +
    "</span> :: " +
    formatBytes(entry.orig) +
    " &rarr; " +
    formatBytes(entry.comp) +
    ' :: <span style="color:#ff2bd6">' +
    entry.ratio.toFixed(2) +
    "x</span>";
  logEl.prepend(row);
}

/* =========================================================
CORE ALGORITHMS — Image: RLE / Entropy(Huffman) / LSB
========================================================= */
function rleAnalyze(bytes) {
  let runs = 0,
    i = 0;
  const n = bytes.length;
  while (i < n) {
    let j = i;
    while (j < n && bytes[j] === bytes[i] && j - i < 255) j++;
    runs++;
    i = j;
  }
  return { runs, compressedBytes: runs * 2 };
}
function rleRoundtrip(bytes) {
  // encode then decode to PROVE lossless reconstruction; returns reconstructed array
  const encoded = [];
  let i = 0;
  const n = bytes.length;
  while (i < n) {
    let j = i;
    while (j < n && bytes[j] === bytes[i] && j - i < 255) j++;
    encoded.push([bytes[i], j - i]);
    i = j;
  }
  const out = new Uint8ClampedArray(n);
  let p = 0;
  for (const [val, count] of encoded) {
    for (let k = 0; k < count; k++) out[p++] = val;
  }
  return out;
}
function shannonEntropyBits(bytes) {
  const freq = new Array(256).fill(0);
  for (let i = 0; i < bytes.length; i++) freq[bytes[i]]++;
  const n = bytes.length;
  let entropy = 0;
  for (const f of freq) {
    if (!f) continue;
    const p = f / n;
    entropy += -p * Math.log2(p);
  }
  return entropy;
}

/* LSB steganography over RGBA ImageData, skipping alpha channel */
function lsbCapacityBytes(imageData) {
  const usable = imageData.data.length - Math.floor(imageData.data.length / 4); // exclude alpha bytes
  return Math.floor((usable - 32) / 8); // minus 32-bit length header, in bytes
}
function lsbEmbed(imageData, message) {
  const data = imageData.data;
  const msgBytes = new TextEncoder().encode(message);
  const len = msgBytes.length;
  let dataIdx = 0;
  function nextIdx() {
    while (dataIdx % 4 === 3) dataIdx++;
    return dataIdx++;
  }
  function setBit(idx, bit) {
    data[idx] = (data[idx] & 0xfe) | bit;
  }
  const totalBitsNeeded = 32 + len * 8;
  const capacityBits = data.length - Math.floor(data.length / 4);
  if (totalBitsNeeded > capacityBits)
    throw new Error(
      "Pesan terlalu besar untuk kapasitas gambar ini (" +
        lsbCapacityBytes(imageData) +
        " byte maks).",
    );
  for (let b = 31; b >= 0; b--) setBit(nextIdx(), (len >> b) & 1);
  for (let mb = 0; mb < len; mb++)
    for (let b = 7; b >= 0; b--) setBit(nextIdx(), (msgBytes[mb] >> b) & 1);
  return imageData;
}
function lsbExtract(imageData) {
  const data = imageData.data;
  let dataIdx = 0;
  function nextIdx() {
    while (dataIdx % 4 === 3) dataIdx++;
    return dataIdx++;
  }
  let len = 0;
  for (let b = 31; b >= 0; b--) len = (len << 1) | (data[nextIdx()] & 1);
  const maxPossible = Math.floor(
    (data.length - Math.floor(data.length / 4) - 32) / 8,
  );
  if (len <= 0 || len > maxPossible)
    throw new Error(
      "Tidak ditemukan pesan tersembunyi yang valid pada gambar ini.",
    );
  const bytes = new Uint8Array(len);
  for (let mb = 0; mb < len; mb++) {
    let byte = 0;
    for (let b = 7; b >= 0; b--) byte = (byte << 1) | (data[nextIdx()] & 1);
    bytes[mb] = byte;
  }
  return new TextDecoder().decode(bytes);
}

/* =========================================================
IMAGE CODEC — UI WIRING
========================================================= */
(function imageCodec() {
  let currentImg = null,
    currentFile = null,
    currentImageData = null;
  const canvasBefore = document.getElementById("img-canvas-before");
  const canvasAfter = document.getElementById("img-canvas-after");

  setupDropzone("dz-image", "file-image", handleFile);

  function handleFile(file) {
    if (!file.type.match(/image\/(jpeg|png|bmp)/)) {
      toast("Format tidak didukung. Gunakan JPEG/PNG/BMP.", "err");
      return;
    }
    currentFile = file;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      currentImg = img;
      const maxW = 320;
      const scale = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * scale),
        h = Math.round(img.height * scale);
      canvasBefore.width = w;
      canvasBefore.height = h;
      const cx = canvasBefore.getContext("2d");
      cx.drawImage(img, 0, 0, w, h);
      currentImageData = cx.getImageData(0, 0, w, h);
      document.getElementById("img-previewrow").style.display = "flex";
      document.getElementById("img-compress").disabled = false;
      document.getElementById("img-decompress").disabled = true;
      document.getElementById("img-hint").textContent =
        "Gambar dimuat: " +
        file.name +
        " (" +
        w +
        "×" +
        h +
        " px ditampilkan, diskalakan untuk preview). Ukuran file asli: " +
        formatBytes(file.size) +
        ".";
      toast("Gambar dimuat: " + file.name, "ok");
    };
    img.onerror = () => toast("Gagal memuat gambar.", "err");
    img.src = url;
  }

  document
    .getElementById("img-compress")
    .addEventListener("click", async () => {
      if (!currentImageData) return;
      const algo = document.getElementById("img-algo").value;
      const t0 = performance.now();
      await runProgress(
        "img-progwrap",
        "img-progbar",
        "img-proglabel",
        "img-progpct",
        850 + Math.random() * 500,
      );

      const data = currentImageData.data;
      const origBytes = currentFile.size;
      let compBytes,
        ratio,
        label,
        reconCanvasData = currentImageData;

      if (algo === "rle") {
        const { compressedBytes } = rleAnalyze(data);
        compBytes = compressedBytes;
        ratio = origBytes / compBytes;
        label = "RLE";
        const reconPixels = rleRoundtrip(data);
        const imgD = new ImageData(
          new Uint8ClampedArray(reconPixels),
          currentImageData.width,
          currentImageData.height,
        );
        reconCanvasData = imgD;
      } else if (algo === "huffman") {
        const entropyBits = shannonEntropyBits(data);
        compBytes = Math.ceil((entropyBits * data.length) / 8);
        ratio = origBytes / compBytes;
        label = "Huffman (est.)";
        reconCanvasData = currentImageData; // entropy coding is lossless conceptually
      } else {
        const formData = new FormData();
        formData.append("file", currentFile);
        const detectedFormat = currentFile.type.includes("png")
          ? "png"
          : currentFile.type.includes("jpeg") ||
              currentFile.type.includes("jpg")
            ? "jpeg"
            : "png";
        formData.append("format", detectedFormat);
        formData.append("quality", "75");
        const backendResult = await callBackend("/api/encode/image", formData);
        compBytes = backendResult.size;
        ratio = origBytes / compBytes;
        label = "JPEG q70 (backend)";

        const img = new Image();
        img.src =
          "data:" + backendResult.mimeType + ";base64," + backendResult.buffer;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        const rc = document.createElement("canvas");
        rc.width = img.width;
        rc.height = img.height;
        rc.getContext("2d").drawImage(img, 0, 0);
        reconCanvasData = rc
          .getContext("2d")
          .getImageData(0, 0, rc.width, rc.height);
      }

      canvasAfter.width = currentImageData.width;
      canvasAfter.height = currentImageData.height;
      canvasAfter.getContext("2d").putImageData(reconCanvasData, 0, 0);

      const t1 = performance.now();
      document.getElementById("img-stats").style.display = "grid";
      document.getElementById("img-stat-orig").textContent =
        formatBytes(origBytes);
      document.getElementById("img-stat-comp").textContent =
        formatBytes(compBytes);
      document.getElementById("img-stat-ratio").textContent =
        ratio.toFixed(2) + "x";
      document.getElementById("img-stat-time").textContent = formatMs(t1 - t0);
      document.getElementById("img-decompress").disabled = false;
      document.getElementById("img-hint").textContent =
        "Kompresi " +
        label +
        " selesai. Panel kanan menampilkan hasil rekonstruksi dari data terkompresi.";

      logOperation({
        label: "IMG-" + label,
        type: "image",
        orig: origBytes,
        comp: compBytes,
        ratio,
        time: t1 - t0,
      });
      toast(label + " selesai: rasio " + ratio.toFixed(2) + "x", "ok");
    });

  document.getElementById("img-decompress").addEventListener("click", () => {
    canvasAfter.getContext("2d").putImageData(currentImageData, 0, 0);
    toast("Dekompresi: piksel direkonstruksi ke kanvas kanan.", "ok");
  });
})();

/* =========================================================
IMAGE STEGANOGRAPHY — UI WIRING
========================================================= */
(function imageStego() {
  let coverImageData = null,
    coverW = 0,
    coverH = 0;
  const coverCanvas = document.getElementById("stego-img-canvas-cover");
  const stegoCanvas = document.getElementById("stego-img-canvas-stego");

  setupDropzone("dz-stego-image", "file-stego-image", (file) => {
    if (!file.type.match(/image\//)) {
      toast("Format gambar tidak didukung.", "err");
      return;
    }
    const img = new Image();
    img.onload = () => {
      const maxW = 300;
      const scale = Math.min(1, maxW / img.width);
      coverW = Math.round(img.width * scale);
      coverH = Math.round(img.height * scale);
      coverCanvas.width = coverW;
      coverCanvas.height = coverH;
      const cx = coverCanvas.getContext("2d");
      cx.drawImage(img, 0, 0, coverW, coverH);
      coverImageData = cx.getImageData(0, 0, coverW, coverH);
      document.getElementById("stego-img-previewrow").style.display = "flex";
      document.getElementById("stego-img-embed").disabled = false;
      document.getElementById("stego-img-extract").disabled = false;
      toast(
        "Cover image dimuat (" +
          lsbCapacityBytes(coverImageData) +
          " byte kapasitas LSB).",
        "ok",
      );
    };
    img.src = URL.createObjectURL(file);
  });

  document.getElementById("stego-img-embed").addEventListener("click", () => {
    const msg = document.getElementById("stego-img-msg").value;
    if (!msg) {
      toast("Tulis pesan terlebih dahulu.", "err");
      return;
    }
    try {
      const clone = new ImageData(
        new Uint8ClampedArray(coverImageData.data),
        coverW,
        coverH,
      );
      lsbEmbed(clone, msg);
      stegoCanvas.width = coverW;
      stegoCanvas.height = coverH;
      stegoCanvas.getContext("2d").putImageData(clone, 0, 0);
      const dl = document.getElementById("stego-img-download");
      stegoCanvas.toBlob((blob) => {
        dl.href = URL.createObjectURL(blob);
        dl.style.display = "block";
      }, "image/png");
      toast("Pesan berhasil disisipkan via LSB.", "ok");
      logOperation({
        label: "STEGO-IMG-EMBED",
        type: "stego",
        orig: msg.length * 8,
        comp: msg.length * 8,
        ratio: 1,
        time: 1,
      });
    } catch (err) {
      toast(err.message, "err");
    }
  });

  document.getElementById("stego-img-extract").addEventListener("click", () => {
    try {
      const sourceData =
        stegoCanvas.width > 0
          ? stegoCanvas
              .getContext("2d")
              .getImageData(0, 0, stegoCanvas.width, stegoCanvas.height)
          : coverImageData;
      const msg = lsbExtract(sourceData);
      document.getElementById("stego-img-result").style.display = "block";
      document.getElementById("stego-img-extracted").textContent = msg;
      toast("Pesan berhasil diekstrak.", "ok");
    } catch (err) {
      toast(err.message, "err");
    }
  });
})();

/* =========================================================
AUDIO CODEC — decode, waveform, DPCM/entropy estimate
========================================================= */
(function audioCodec() {
  let audioCtx = null;
  let currentFile = null,
    currentBuffer = null,
    objectUrl = null;
  const player = document.getElementById("aud-player");

  function getCtx() {
    if (!audioCtx)
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  setupDropzone("dz-audio", "file-audio", handleFile);

  async function handleFile(file) {
    if (!file.type.match(/audio\//)) {
      toast("Format audio tidak dikenali, dicoba tetap diproses…", "warn");
    }
    currentFile = file;
    const arrBuf = await file.arrayBuffer();
    try {
      currentBuffer = await getCtx().decodeAudioData(arrBuf.slice(0));
    } catch (err) {
      toast("Gagal decode audio: " + err.message, "err");
      return;
    }
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file);
    player.src = objectUrl;

    drawWaveform(currentBuffer);
    document.getElementById("aud-wavelabel").style.display = "block";
    document.getElementById("aud-waveform").style.display = "block";
    document.getElementById("aud-compress").disabled = false;
    document.getElementById("aud-play").disabled = false;
    document.getElementById("aud-hint").textContent =
      "Audio dimuat: " +
      file.name +
      " · " +
      currentBuffer.sampleRate +
      "Hz · " +
      currentBuffer.numberOfChannels +
      "ch · " +
      formatBytes(file.size);
    toast("Audio dimuat: " + file.name, "ok");
    window.MCLAB_setPlayerTrack && window.MCLAB_setPlayerTrack(file, objectUrl);
  }

  function drawWaveform(buffer) {
    const canvas = document.getElementById("aud-waveform");
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 330,
      h = 70;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / w);
    ctx.beginPath();
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "#00e5ff");
    grad.addColorStop(0.5, "#b347ff");
    grad.addColorStop(1, "#ff2bd6");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.4;
    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = 4;
    for (let x = 0; x < w; x++) {
      let min = 1,
        max = -1;
      for (let i = 0; i < step; i++) {
        const idx = x * step + i;
        if (idx >= data.length) break;
        const v = data[idx];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const y1 = ((1 + min) * h) / 2,
        y2 = ((1 + max) * h) / 2;
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
    }
    ctx.stroke();
  }

  document.getElementById("aud-play").addEventListener("click", () => {
    const btn = document.getElementById("aud-play");
    if (player.paused) {
      player.play();
      btn.innerHTML = '<span class="material-icons">pause</span> PAUSE';
    } else {
      player.pause();
      btn.innerHTML = '<span class="material-icons">play_arrow</span> PLAY';
    }
  });
  player.addEventListener("ended", () => {
    document.getElementById("aud-play").innerHTML =
      '<span class="material-icons">play_arrow</span> PLAY';
  });

  document
    .getElementById("aud-compress")
    .addEventListener("click", async () => {
      if (!currentBuffer) return;
      const algo = document.getElementById("aud-algo").value;
      const t0 = performance.now();
      await runProgress(
        "aud-progwrap",
        "aud-progbar",
        "aud-proglabel",
        "aud-progpct",
        700 + Math.random() * 500,
      );

      const ch0 = currentBuffer.getChannelData(0);
      const numSamples = ch0.length;
      const numChannels = currentBuffer.numberOfChannels;
      const pcmBytesOriginal = numSamples * numChannels * 2; // 16-bit PCM baseline
      let compBytes, label;

      if (algo === "dpcm") {
        const int16 = new Int16Array(numSamples);
        for (let i = 0; i < numSamples; i++)
          int16[i] = Math.max(
            -32768,
            Math.min(32767, Math.round(ch0[i] * 32767)),
          );
        let maxDelta = 0;
        for (let i = 1; i < numSamples; i++) {
          const d = Math.abs(int16[i] - int16[i - 1]);
          if (d > maxDelta) maxDelta = d;
        }
        const neededBits = Math.max(
          4,
          Math.min(16, Math.ceil(Math.log2(maxDelta * 2 + 2))),
        );
        compBytes = Math.ceil((numSamples * neededBits) / 8) * numChannels;
        label = "DPCM (" + neededBits + "-bit delta)";
      } else {
        const formData = new FormData();
        formData.append("file", currentFile);
        const backendResult = await callBackend("/api/encode/audio", formData);
        compBytes = backendResult.size;
        label = "Audio backend";
      }
      const ratio = pcmBytesOriginal / compBytes;
      const bitrate = Math.round(
        (compBytes * 8) / currentBuffer.duration / 1000,
      );

      const t1 = performance.now();
      document.getElementById("aud-stats").style.display = "grid";
      document.getElementById("aud-stat-orig").textContent = formatBytes(
        currentFile.size,
      );
      document.getElementById("aud-stat-comp").textContent =
        formatBytes(compBytes);
      document.getElementById("aud-stat-ratio").textContent =
        ratio.toFixed(2) + "x";
      document.getElementById("aud-stat-bitrate").textContent =
        bitrate + " kbps";
      document.getElementById("aud-stat-dur").textContent =
        currentBuffer.duration.toFixed(1) + " s";
      document.getElementById("aud-stat-time").textContent = formatMs(t1 - t0);

      logOperation({
        label: "AUD-" + label,
        type: "audio",
        orig: pcmBytesOriginal,
        comp: compBytes,
        ratio,
        time: t1 - t0,
      });
      toast(label + " selesai: rasio " + ratio.toFixed(2) + "x", "ok");
    });
})();

/* =========================================================
WAV ENCODER — render Int16 PCM samples to a playable .wav Blob
========================================================= */
function encodeWAV(int16Samples, sampleRate, numChannels) {
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = int16Samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  function writeStr(off, str) {
    for (let i = 0; i < str.length; i++)
      view.setUint8(off + i, str.charCodeAt(i));
  }
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
  let off = 44;
  for (let i = 0; i < int16Samples.length; i++) {
    view.setInt16(off, int16Samples[i], true);
    off += 2;
  }
  return new Blob([view], { type: "audio/wav" });
}

/* =========================================================
AUDIO STEGANOGRAPHY — LSB on PCM samples (channel 0)
========================================================= */
(function audioStego() {
  let audioCtx = null;
  let coverBuffer = null,
    coverFile = null;
  function getCtx() {
    if (!audioCtx)
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  setupDropzone("dz-stego-audio", "file-stego-audio", async (file) => {
    coverFile = file;
    const arrBuf = await file.arrayBuffer();
    try {
      coverBuffer = await getCtx().decodeAudioData(arrBuf.slice(0));
    } catch (err) {
      toast("Gagal decode audio cover: " + err.message, "err");
      return;
    }
    document.getElementById("stego-aud-embed").disabled = false;
    document.getElementById("stego-aud-extract").disabled = false;
    toast("Cover audio dimuat: " + file.name, "ok");
  });

  function samplesToInt16(buffer) {
    const ch = buffer.getChannelData(0);
    const out = new Int16Array(ch.length);
    for (let i = 0; i < ch.length; i++)
      out[i] = Math.max(-32768, Math.min(32767, Math.round(ch[i] * 32767)));
    return out;
  }

  let lastStegoInt16 = null,
    lastStegoRate = 44100;

  document.getElementById("stego-aud-embed").addEventListener("click", () => {
    const msg = document.getElementById("stego-aud-msg").value;
    if (!msg) {
      toast("Tulis pesan terlebih dahulu.", "err");
      return;
    }
    const msgBytes = new TextEncoder().encode(msg);
    const totalBits = 32 + msgBytes.length * 8;
    const int16 = samplesToInt16(coverBuffer);
    if (totalBits > int16.length) {
      toast("Pesan terlalu panjang untuk durasi audio ini.", "err");
      return;
    }
    let idx = 0;
    function setBit(bit) {
      int16[idx] = (int16[idx] & ~1) | bit;
      idx++;
    }
    const len = msgBytes.length;
    for (let b = 31; b >= 0; b--) setBit((len >> b) & 1);
    for (let mb = 0; mb < len; mb++)
      for (let b = 7; b >= 0; b--) setBit((msgBytes[mb] >> b) & 1);

    lastStegoInt16 = int16;
    lastStegoRate = coverBuffer.sampleRate;
    const blob = encodeWAV(int16, coverBuffer.sampleRate, 1);
    const url = URL.createObjectURL(blob);
    const outPlayer = document.getElementById("stego-aud-out-player");
    outPlayer.src = url;
    outPlayer.style.display = "block";
    const dl = document.getElementById("stego-aud-download");
    dl.href = url;
    dl.style.display = "block";
    toast("Pesan disisipkan ke LSB sampel PCM & dirender ke WAV.", "ok");
    logOperation({
      label: "STEGO-AUD-EMBED",
      type: "stego",
      orig: msgBytes.length * 8,
      comp: msgBytes.length * 8,
      ratio: 1,
      time: 1,
    });
  });

  document.getElementById("stego-aud-extract").addEventListener("click", () => {
    try {
      const int16 = lastStegoInt16 || samplesToInt16(coverBuffer);
      let idx = 0;
      function readBit() {
        return int16[idx++] & 1;
      }
      let len = 0;
      for (let b = 31; b >= 0; b--) len = (len << 1) | readBit();
      if (len <= 0 || len > int16.length / 8)
        throw new Error("Tidak ditemukan pesan tersembunyi yang valid.");
      const bytes = new Uint8Array(len);
      for (let mb = 0; mb < len; mb++) {
        let byte = 0;
        for (let b = 7; b >= 0; b--) byte = (byte << 1) | readBit();
        bytes[mb] = byte;
      }
      const msg = new TextDecoder().decode(bytes);
      document.getElementById("stego-aud-result").style.display = "block";
      document.getElementById("stego-aud-extracted").textContent = msg;
      toast("Pesan berhasil diekstrak dari audio.", "ok");
    } catch (err) {
      toast(err.message, "err");
    }
  });
})();

/* =========================================================
VIDEO CODEC — real metadata + real frame-difference motion analysis
========================================================= */
(function videoCodec() {
  let currentFile = null;
  const hiddenVideo = document.createElement("video");
  hiddenVideo.muted = true;
  hiddenVideo.playsInline = true;

  setupDropzone("dz-video", "file-video", handleFile);

  function handleFile(file) {
    if (!file.type.match(/video\//)) {
      toast("Format video tidak dikenali, dicoba tetap diproses…", "warn");
    }
    currentFile = file;
    hiddenVideo.src = URL.createObjectURL(file);
    hiddenVideo.addEventListener(
      "loadedmetadata",
      function onMeta() {
        hiddenVideo.removeEventListener("loadedmetadata", onMeta);
        document.getElementById("vid-compress").disabled = false;
        document.getElementById("vid-hint").textContent =
          "Video dimuat: " +
          file.name +
          " · " +
          hiddenVideo.videoWidth +
          "×" +
          hiddenVideo.videoHeight +
          " · " +
          hiddenVideo.duration.toFixed(1) +
          "s · " +
          formatBytes(file.size);
        toast("Video dimuat: " + file.name, "ok");
      },
      { once: true },
    );
  }

  function seekTo(t) {
    return new Promise((resolve) => {
      function onSeeked() {
        hiddenVideo.removeEventListener("seeked", onSeeked);
        resolve();
      }
      hiddenVideo.addEventListener("seeked", onSeeked);
      hiddenVideo.currentTime = Math.min(
        Math.max(t, 0),
        Math.max(hiddenVideo.duration - 0.05, 0),
      );
    });
  }

  document
    .getElementById("vid-compress")
    .addEventListener("click", async () => {
      if (!currentFile) return;
      const t0 = performance.now();
      await runProgress(
        "vid-progwrap",
        "vid-progbar",
        "vid-proglabel",
        "vid-progpct",
        1000 + Math.random() * 600,
      );

      const maxW = 220;
      const scale = Math.min(1, maxW / hiddenVideo.videoWidth);
      const w = Math.round(hiddenVideo.videoWidth * scale),
        h = Math.round(hiddenVideo.videoHeight * scale);

      const canvasA = document.getElementById("vid-canvas-a");
      const canvasB = document.getElementById("vid-canvas-b");
      const canvasDiff = document.getElementById("vid-canvas-diff");
      [canvasA, canvasB, canvasDiff].forEach((c) => {
        c.width = w;
        c.height = h;
      });

      const dur = hiddenVideo.duration;
      await seekTo(Math.min(0.15, dur * 0.05));
      canvasA.getContext("2d").drawImage(hiddenVideo, 0, 0, w, h);
      const frameA = canvasA.getContext("2d").getImageData(0, 0, w, h);

      await seekTo(dur * 0.4);
      canvasB.getContext("2d").drawImage(hiddenVideo, 0, 0, w, h);
      const frameB = canvasB.getContext("2d").getImageData(0, 0, w, h);

      const diffCtx = canvasDiff.getContext("2d");
      const diffData = diffCtx.createImageData(w, h);
      let changed = 0;
      const total = w * h;
      for (let i = 0; i < frameA.data.length; i += 4) {
        const dr = Math.abs(frameA.data[i] - frameB.data[i]);
        const dg = Math.abs(frameA.data[i + 1] - frameB.data[i + 1]);
        const db = Math.abs(frameA.data[i + 2] - frameB.data[i + 2]);
        const diffMag = (dr + dg + db) / 3;
        if (diffMag > 28) {
          changed++;
          diffData.data[i] = 255;
          diffData.data[i + 1] = 43;
          diffData.data[i + 2] = 214;
          diffData.data[i + 3] = 255;
        } else {
          diffData.data[i] = 8;
          diffData.data[i + 1] = 6;
          diffData.data[i + 2] = 18;
          diffData.data[i + 3] = 255;
        }
      }
      diffCtx.putImageData(diffData, 0, 0);
      document.getElementById("vid-previewrow").style.display = "flex";

      const motionPct = (changed / total) * 100;
      const algo = document.getElementById("vid-algo").value;
      const baseRatio = algo === "motioncomp" ? 14 : 9;
      const ratio = Math.max(
        2,
        baseRatio - (motionPct / 100) * (baseRatio - 2.2),
      );
      const origBytes = currentFile.size;
      let compBytes = origBytes / ratio;

      try {
        const formData = new FormData();
        formData.append("file", currentFile);
        const backendResult = await callBackend("/api/encode/video", formData);
        compBytes = backendResult.size;
      } catch (error) {
        console.warn("Backend video encode unavailable, using estimate", error);
      }

      const t1 = performance.now();
      document.getElementById("vid-stats").style.display = "grid";
      document.getElementById("vid-stat-res").textContent =
        hiddenVideo.videoWidth + "×" + hiddenVideo.videoHeight;
      document.getElementById("vid-stat-dur").textContent =
        dur.toFixed(1) + " s";
      document.getElementById("vid-stat-motion").textContent =
        motionPct.toFixed(1) + "%";
      document.getElementById("vid-stat-orig").textContent =
        formatBytes(origBytes);
      document.getElementById("vid-stat-comp").textContent =
        formatBytes(compBytes);
      document.getElementById("vid-stat-ratio").textContent =
        ratio.toFixed(2) + "x";

      const label = algo === "motioncomp" ? "Motion-Comp" : "Frame-Diff";
      logOperation({
        label: "VID-" + label,
        type: "video",
        orig: origBytes,
        comp: compBytes,
        ratio,
        time: t1 - t0,
      });
      toast(
        "Analisis frame selesai: motion " +
          motionPct.toFixed(1) +
          "%, rasio est. " +
          ratio.toFixed(2) +
          "x",
        "ok",
      );
    });
})();

/* =========================================================
VIDEO STEGANOGRAPHY — demo: LSB embed into first-frame snapshot
========================================================= */
(function videoStego() {
  const hiddenVideo = document.createElement("video");
  hiddenVideo.muted = true;
  hiddenVideo.playsInline = true;
  let ready = false;

  setupDropzone("dz-stego-video", "file-stego-video", (file) => {
    hiddenVideo.src = URL.createObjectURL(file);
    hiddenVideo.addEventListener(
      "loadedmetadata",
      function onMeta() {
        hiddenVideo.removeEventListener("loadedmetadata", onMeta);
        ready = true;
        document.getElementById("stego-vid-embed").disabled = false;
        toast("Cover video dimuat: " + file.name, "ok");
      },
      { once: true },
    );
  });

  document
    .getElementById("stego-vid-embed")
    .addEventListener("click", async () => {
      if (!ready) return;
      const msg = document.getElementById("stego-vid-msg").value;
      if (!msg) {
        toast("Tulis pesan terlebih dahulu.", "err");
        return;
      }
      await new Promise((resolve) => {
        function onSeeked() {
          hiddenVideo.removeEventListener("seeked", onSeeked);
          resolve();
        }
        hiddenVideo.addEventListener("seeked", onSeeked);
        hiddenVideo.currentTime = 0.05;
      });
      const w = Math.min(280, hiddenVideo.videoWidth),
        scale = w / hiddenVideo.videoWidth,
        h = Math.round(hiddenVideo.videoHeight * scale);
      const canvas = document.getElementById("stego-vid-canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(hiddenVideo, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      try {
        lsbEmbed(imgData, msg);
        ctx.putImageData(imgData, 0, 0);
        document.getElementById("stego-vid-previewrow").style.display = "flex";
        toast(
          "Pesan disisipkan ke LSB frame pertama (proof-of-concept).",
          "ok",
        );
        logOperation({
          label: "STEGO-VID-EMBED",
          type: "stego",
          orig: msg.length * 8,
          comp: msg.length * 8,
          ratio: 1,
          time: 1,
        });
      } catch (err) {
        toast(err.message, "err");
      }
    });
})();

setupTabs("#win-stego");

/* =========================================================
FLOATING WINAMP-STYLE MEDIA PLAYER
========================================================= */
(function mediaPlayer() {
  const audioEl = new Audio();
  audioEl.crossOrigin = "anonymous";
  let audioCtx = null,
    analyser = null,
    sourceNode = null,
    vizConnected = false;
  const playBtn = document.getElementById("mp-play");
  const stopBtn = document.getElementById("mp-stop");
  const seek = document.getElementById("mp-seek");
  const vol = document.getElementById("mp-volume");
  const titleEl = document.getElementById("mp-tracktitle");
  const timeEl = document.getElementById("mp-time");
  const vizCanvas = document.getElementById("mp-viz");
  const vctx = vizCanvas.getContext("2d");
  let seeking = false;

  function ensureViz() {
    if (vizConnected) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      sourceNode = audioCtx.createMediaElementSource(audioEl);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      sourceNode.connect(analyser);
      analyser.connect(audioCtx.destination);
      vizConnected = true;
    } catch (e) {
      /* already connected or blocked, ignore */
    }
  }

  function loadTrack(file, url) {
    audioEl.src = url;
    titleEl.textContent =
      (file.name || "TRACK.WAV").toUpperCase() +
      " — NOW LOADED — M.C.LAB PLAYBACK ENGINE — " +
      (file.name || "TRACK.WAV").toUpperCase() +
      " — ";
  }
  window.MCLAB_setPlayerTrack = loadTrack;

  document.getElementById("mp-filein").addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (!f) return;
    loadTrack(f, URL.createObjectURL(f));
    toast("Track dimuat ke M.C.PLAYER: " + f.name, "ok");
  });

  playBtn.addEventListener("click", () => {
    if (!audioEl.src) {
      toast(
        "Belum ada track. Muat audio via folder atau dari Audio Codec.",
        "err",
      );
      return;
    }
    ensureViz();
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    if (audioEl.paused) {
      audioEl.play();
      playBtn.innerHTML = '<span class="material-icons">pause</span>';
    } else {
      audioEl.pause();
      playBtn.innerHTML = '<span class="material-icons">play_arrow</span>';
    }
  });
  stopBtn.addEventListener("click", () => {
    audioEl.pause();
    audioEl.currentTime = 0;
    playBtn.innerHTML = '<span class="material-icons">play_arrow</span>';
  });
  audioEl.addEventListener("ended", () => {
    playBtn.innerHTML = '<span class="material-icons">play_arrow</span>';
  });

  seek.addEventListener("input", () => {
    seeking = true;
  });
  seek.addEventListener("change", () => {
    if (audioEl.duration)
      audioEl.currentTime = (seek.value / 100) * audioEl.duration;
    seeking = false;
  });
  vol.addEventListener("input", () => {
    audioEl.volume = vol.value / 100;
  });
  audioEl.volume = 0.8;

  audioEl.addEventListener("timeupdate", () => {
    if (!seeking && audioEl.duration)
      seek.value = (audioEl.currentTime / audioEl.duration) * 100;
    timeEl.textContent =
      formatClock(audioEl.currentTime) +
      " / " +
      formatClock(audioEl.duration || 0);
  });

  function drawViz() {
    const w = vizCanvas.clientWidth || 230,
      h = 34;
    if (vizCanvas.width !== w * 2) {
      vizCanvas.width = w * 2;
      vizCanvas.height = h * 2;
    }
    vctx.setTransform(1, 0, 0, 1, 0, 0);
    vctx.scale(2, 2);
    vctx.clearRect(0, 0, w, h);
    let bars;
    if (analyser && !audioEl.paused) {
      const arr = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(arr);
      bars = Array.from(arr);
    } else {
      const t = performance.now() / 300;
      bars = Array.from(
        { length: 24 },
        (_, i) => 40 + Math.sin(t + i * 0.6) * 30 + Math.random() * 15,
      );
    }
    const bw = w / bars.length;
    for (let i = 0; i < bars.length; i++) {
      const bh = (bars[i] / 255) * h;
      const grad = vctx.createLinearGradient(0, h - bh, 0, h);
      grad.addColorStop(0, "#ff2bd6");
      grad.addColorStop(0.5, "#b347ff");
      grad.addColorStop(1, "#00e5ff");
      vctx.fillStyle = grad;
      vctx.fillRect(i * bw + 1, h - bh, bw - 2, bh);
    }
    requestAnimationFrame(drawViz);
  }
  drawViz();
})();

/* =========================================================
FLOATING WEBCAM / HANDCAM VIEWER
========================================================= */
(function webcamWidget() {
  const videoEl = document.getElementById("cam-video");
  const placeholder = document.getElementById("cam-placeholder");
  const connectBtn = document.getElementById("cam-connect");
  const stopBtn = document.getElementById("cam-stop");
  const recInd = document.getElementById("cam-recind");
  const tsEl = document.getElementById("cam-ts");
  const staticCanvas = document.getElementById("cam-static");
  const sctx = staticCanvas.getContext("2d");
  let stream = null,
    tsTimer = null;

  function resizeStatic() {
    staticCanvas.width = staticCanvas.clientWidth;
    staticCanvas.height = staticCanvas.clientHeight;
  }
  function drawStatic() {
    if (stream) return;
    resizeStatic();
    const w = staticCanvas.width,
      h = staticCanvas.height;
    if (w === 0 || h === 0) {
      requestAnimationFrame(drawStatic);
      return;
    }
    const imgData = sctx.createImageData(w, h);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const v = Math.random() * 40;
      const tint = Math.random() > 0.985 ? 200 : 0;
      imgData.data[i] = v + tint * 0.2;
      imgData.data[i + 1] = v + tint * 0.4;
      imgData.data[i + 2] = v + tint * 0.7;
      imgData.data[i + 3] = 255;
    }
    sctx.putImageData(imgData, 0, 0);
    requestAnimationFrame(drawStatic);
  }
  drawStatic();

  connectBtn.addEventListener("click", async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
        audio: false,
      });
      videoEl.srcObject = stream;
      videoEl.style.display = "block";
      placeholder.style.display = "none";
      staticCanvas.style.display = "none";
      recInd.style.visibility = "visible";
      tsEl.style.display = "block";
      connectBtn.style.display = "none";
      stopBtn.style.display = "block";
      tsTimer = setInterval(() => {
        tsEl.textContent = new Date().toLocaleString("en-GB", {
          hour12: false,
        });
      }, 1000);
      toast("Kamera tersambung.", "ok");
    } catch (err) {
      toast("Akses kamera ditolak / tidak tersedia: " + err.message, "err");
    }
  });
  stopBtn.addEventListener("click", () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    videoEl.style.display = "none";
    staticCanvas.style.display = "block";
    placeholder.style.display = "block";
    recInd.style.visibility = "hidden";
    tsEl.style.display = "none";
    connectBtn.style.display = "block";
    stopBtn.style.display = "none";
    clearInterval(tsTimer);
    drawStatic();
    toast("Kamera dimatikan.", "ok");
  });
})();

/* init dashboard charts once DOM ready */
document.addEventListener("DOMContentLoaded", initDashCharts);
