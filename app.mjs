// Spin the Wheel — Flagship Studio Engine
// High-DPI Canvas Wheel, Spring Physics Pointer, Procedural Web Audio & Confetti

export const PALETTES = {
  rainbow: ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'],
  cyber: ['#06b6d4', '#ec4899', '#8b5cf6', '#10b981', '#facc15', '#3b82f6'],
  sunset: ['#f43f5e', '#fb7185', '#f97316', '#fb923c', '#f59e0b', '#fde047'],
  emerald: ['#059669', '#10b981', '#34d399', '#d97706', '#f59e0b', '#fbbf24'],
  ocean: ['#0284c7', '#0ea5e9', '#38bdf8', '#6366f1', '#818cf8', '#a855f7'],
  pastel: ['#fca5a5', '#fdba74', '#fde047', '#86efac', '#67e8f9', '#93c5fd', '#c4b5fd', '#f472b6']
};

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('stw-sound-muted') === 'true';
  }

  _init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.muted = muted;
    localStorage.setItem('stw-sound-muted', muted ? 'true' : 'false');
  }

  playTick(velocity = 1) {
    if (this.muted) return;
    try {
      this._init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Sharp percussive mechanical click
      osc.type = 'triangle';
      const baseFreq = 520 + Math.min(velocity * 40, 200);
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.025);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch (e) {}
  }

  playFanfare() {
    if (this.muted) return;
    try {
      this._init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + i * 0.09;
        const dur = 0.45;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + dur);
      });
    } catch (e) {}
  }
}

class ConfettiEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.particles = [];
    this.animating = false;
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  blast() {
    if (!this.canvas || !this.ctx) return;
    this._resize();
    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#3b82f6', '#f43f5e'];
    this.particles = [];
    const count = 100;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI / 4) + Math.random() * (Math.PI / 2); // Upwards fountain
      const speed = 12 + Math.random() * 18;
      this.particles.push({
        x: this.canvas.width / 2 + (Math.random() - 0.5) * 80,
        y: this.canvas.height * 0.6,
        vx: Math.cos(angle) * (Math.random() > 0.5 ? 1 : -1) * speed,
        vy: -Math.sin(angle) * speed,
        size: 8 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        tilt: Math.random() * 10,
        tiltSpeed: 0.1 + Math.random() * 0.1,
        opacity: 1,
        life: 0
      });
    }

    if (!this.animating) {
      this.animating = true;
      this._loop();
    }
  }

  _loop() {
    if (!this.animating) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const gravity = 0.45;
    const drag = 0.985;
    let alive = 0;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life++;
      p.vx *= drag;
      p.vy = p.vy * drag + gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.tilt += p.tiltSpeed;

      if (p.life > 90) {
        p.opacity -= 0.02;
      }

      if (p.opacity > 0 && p.y < this.canvas.height + 50) {
        alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.scale(Math.cos(p.tilt), 1);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
    }

    if (alive > 0) {
      requestAnimationFrame(() => this._loop());
    } else {
      this.animating = false;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

function secureRandom(max) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return (arr[0] / 4294967296) * max;
}

export class SpinWheel {
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = config.options || [];
    this.palette = config.palette || 'rainbow';
    this.spinDuration = config.spinDuration || 5000; // ms
    this.rotation = 0;
    this.isSpinning = false;
    this.winnerIndex = -1;
    this.pointerAngle = 0; // spring deflection in radians
    this.pointerVelocity = 0;
    this.lastPassedSlice = -1;

    this.sound = new SoundEngine();
    this.onResult = config.onResult || (() => {});
    this.onSpinStart = config.onSpinStart || (() => {});
    this.onSpinEnd = config.onSpinEnd || (() => {});

    this._setupDPR();
    this.draw();

    window.addEventListener('resize', () => {
      this._setupDPR();
      this.draw();
    });

    this.canvas.addEventListener('click', () => this.spin());
  }

  _setupDPR() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const rect = this.canvas.getBoundingClientRect();
    const size = Math.min(rect.width || 420, rect.height || 420);
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.ctx.resetTransform?.() || this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.size = size;
    this.radius = size / 2;
  }

  setOptions(options) {
    this.options = options;
    this.rotation = 0;
    this.winnerIndex = -1;
    this.pointerAngle = 0;
    this.draw();
  }

  setPalette(paletteKey) {
    if (PALETTES[paletteKey]) {
      this.palette = paletteKey;
      this.draw();
    }
  }

  setDuration(ms) {
    this.spinDuration = ms;
  }

  draw() {
    const ctx = this.ctx;
    const size = this.size;
    const radius = this.radius;
    const cx = size / 2;
    const cy = size / 2;

    ctx.clearRect(0, 0, size, size);

    const outerBezelRadius = radius - 4;
    const wheelRadius = radius - 18;

    // 1. Draw Outer Bezel / Ring (Metallic Dark Bevel)
    const bezelGrad = ctx.createLinearGradient(0, 0, size, size);
    bezelGrad.addColorStop(0, '#334155');
    bezelGrad.addColorStop(0.5, '#1e293b');
    bezelGrad.addColorStop(1, '#0f172a');

    ctx.beginPath();
    ctx.arc(cx, cy, outerBezelRadius, 0, Math.PI * 2);
    ctx.fillStyle = bezelGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (this.options.length === 0) {
      // Empty state
      ctx.beginPath();
      ctx.arc(cx, cy, wheelRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 15px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Add choices to spin', cx, cy);
      this._drawPointer(cx, cy, radius);
      return;
    }

    const n = this.options.length;
    const arcAngle = (Math.PI * 2) / n;
    const colors = PALETTES[this.palette] || PALETTES.rainbow;

    // 2. Draw Wheel Slices
    for (let i = 0; i < n; i++) {
      const startAngle = i * arcAngle + this.rotation - Math.PI / 2;
      const endAngle = startAngle + arcAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, wheelRadius, startAngle, endAngle);
      ctx.closePath();

      const color = colors[i % colors.length];
      ctx.fillStyle = color;
      ctx.fill();

      // Subtle slice gradient / 3D sheen
      const radGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, wheelRadius);
      radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
      radGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0)');
      radGrad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
      ctx.fillStyle = radGrad;
      ctx.fill();

      // Slice divider border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Text Rendering
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + arcAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // Dynamic font calculation
      const text = this.options[i];
      const maxChars = n > 20 ? 10 : 18;
      const displayText = text.length > maxChars ? text.slice(0, maxChars - 1) + '…' : text;
      const fontSize = Math.max(10, Math.min(16, Math.floor(220 / Math.max(n, 8))));

      ctx.font = `700 ${fontSize}px 'Plus Jakarta Sans', Inter, sans-serif`;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(displayText, wheelRadius - 14, 0);
      ctx.restore();

      // 3. Draw Outer Bezel Pin / Stud at Sector Joint
      const pinAngle = startAngle;
      const pinX = cx + Math.cos(pinAngle) * (wheelRadius + 6);
      const pinY = cy + Math.sin(pinAngle) * (wheelRadius + 6);

      ctx.beginPath();
      ctx.arc(pinX, pinY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 4. Center Hub (3D Metallic Brushed Hubcap)
    const hubRadius = Math.max(22, wheelRadius * 0.16);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, hubRadius + 4, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 10;
    ctx.fill();

    const hubGrad = ctx.createLinearGradient(cx - hubRadius, cy - hubRadius, cx + hubRadius, cy + hubRadius);
    hubGrad.addColorStop(0, '#475569');
    hubGrad.addColorStop(0.5, '#1e293b');
    hubGrad.addColorStop(1, '#090d16');

    ctx.beginPath();
    ctx.arc(cx, cy, hubRadius, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Center Gold Core with "SPIN" text or star
    ctx.beginPath();
    ctx.arc(cx, cy, hubRadius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#6366f1';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${Math.max(8, hubRadius * 0.35)}px 'Plus Jakarta Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPIN', cx, cy);
    ctx.restore();

    // 5. Draw Pointer (12 o'clock needle with deflection physics)
    this._drawPointer(cx, cy, radius);
  }

  _drawPointer(cx, cy, radius) {
    const ctx = this.ctx;
    const pointerTipY = 16;
    const pointerBaseY = 0;
    const pointerWidth = 18;

    ctx.save();
    ctx.translate(cx, 10);
    ctx.rotate(this.pointerAngle);

    // Pointer shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    // Pointer Body (Metallic Golden Dart)
    ctx.beginPath();
    ctx.moveTo(0, 26); // tip pointing down into wheel
    ctx.lineTo(-pointerWidth / 2, -6);
    ctx.lineTo(pointerWidth / 2, -6);
    ctx.closePath();

    const ptrGrad = ctx.createLinearGradient(-10, -6, 10, 26);
    ptrGrad.addColorStop(0, '#fbbf24');
    ptrGrad.addColorStop(0.5, '#f59e0b');
    ptrGrad.addColorStop(1, '#d97706');

    ctx.fillStyle = ptrGrad;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Small pivot cap
    ctx.beginPath();
    ctx.arc(0, -2, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
  }

  spin() {
    if (this.isSpinning) return;
    if (this.options.length < 2) {
      showToast('Please add at least 2 options to spin!');
      return;
    }

    this.isSpinning = true;
    this.winnerIndex = -1;
    this.onSpinStart();

    const n = this.options.length;
    const arcAngle = (Math.PI * 2) / n;
    const winnerIdx = Math.floor(secureRandom(n));

    // Pointer is at -PI/2 (top).
    // Slices are drawn starting at (startAngle = i*arcAngle + rotation - PI/2).
    // Slice center is at startAngle + arcAngle/2.
    // We want winner slice center to align with -PI/2.
    // winnerIdx * arcAngle + rotation - PI/2 + arcAngle/2 = -PI/2
    // rotation = -(winnerIdx * arcAngle + arcAngle/2) mod 2PI
    const fullSpins = 6 + Math.floor(secureRandom(3)); // 6-8 rotations
    const TWO_PI = Math.PI * 2;
    const targetMod = (TWO_PI - ((winnerIdx * arcAngle + arcAngle / 2) % TWO_PI)) % TWO_PI;
    const currentMod = ((this.rotation % TWO_PI) + TWO_PI) % TWO_PI;
    const delta = (targetMod - currentMod + TWO_PI) % TWO_PI;
    const totalRotation = fullSpins * TWO_PI + delta;

    const startRotation = this.rotation;
    const duration = this.spinDuration;
    const startTime = performance.now();
    let prevRotation = startRotation;

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(t);

      this.rotation = startRotation + totalRotation * eased;
      const speed = (this.rotation - prevRotation) * 60; // rad/sec
      prevRotation = this.rotation;

      // Check for sector pin crossings to trigger tick sound and pointer bounce
      const currentNormalized = (this.rotation % TWO_PI + TWO_PI) % TWO_PI;
      const currentSlice = Math.floor(currentNormalized / arcAngle);

      if (currentSlice !== this.lastPassedSlice) {
        this.lastPassedSlice = currentSlice;
        this.pointerVelocity = 0.35; // Kick pointer forward
        this.sound.playTick(Math.min(speed, 10));
      }

      // Pointer spring physics
      const spring = 0.18;
      const damp = 0.72;
      this.pointerVelocity += -spring * this.pointerAngle;
      this.pointerVelocity *= damp;
      this.pointerAngle += this.pointerVelocity;

      this.draw();

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isSpinning = false;
        this.winnerIndex = winnerIdx;
        this.pointerAngle = 0;
        this.draw();
        this.sound.playFanfare();
        this.onSpinEnd(this.options[winnerIdx], winnerIdx);
      }
    };

    requestAnimationFrame(animate);
  }
}

// Toast System
export function showToast(msg, isSuccess = false) {
  let toast = document.querySelector('.wheel-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'wheel-toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML = `<span class="wheel-toast-text"></span>`;
    document.body.appendChild(toast);
  }
  const textEl = toast.querySelector('.wheel-toast-text') || toast;
  textEl.textContent = msg;
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

// Page Initialization Orchestrator
export function initWheelPage(config) {
  const { mode, defaultOptions, storageKey, pageName } = config;

  const canvas = document.getElementById('wheel-canvas');
  const confettiCanvas = document.getElementById('confetti-canvas');
  const input = document.getElementById('options-input');
  const spinHeroBtn = document.getElementById('spin-btn-hero');
  const countBadge = document.getElementById('option-count-badge');
  const clearBtn = document.getElementById('clear-btn');
  const shuffleBtn = document.getElementById('shuffle-btn');
  const sortBtn = document.getElementById('sort-btn');
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const paletteSelect = document.getElementById('palette-select');
  const speedSelect = document.getElementById('speed-select');
  const removeOnPickCheckbox = document.getElementById('remove-on-pick');
  const shareWheelBtn = document.getElementById('share-wheel-btn');

  // Tabs
  const tabEditor = document.getElementById('tab-editor');
  const tabHistory = document.getElementById('tab-history');
  const viewEditor = document.getElementById('view-editor');
  const viewHistory = document.getElementById('view-history');
  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  const historyBadge = document.getElementById('history-count-badge');

  // Winner Modal Elements
  const winnerModal = document.getElementById('winner-modal');
  const winnerTitle = document.getElementById('winner-name');
  const modalSpinAgainBtn = document.getElementById('modal-spin-again');
  const modalRemoveSpinBtn = document.getElementById('modal-remove-spin');
  const modalCopyBtn = document.getElementById('modal-copy-btn');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  const confetti = confettiCanvas ? new ConfettiEngine(confettiCanvas) : null;

  // Load URL query param choices or saved options
  let initialOptions = [];
  try {
    const params = new URLSearchParams(window.location.search);
    const paramChoices = params.get('choices') || params.get('options');
    if (paramChoices) {
      initialOptions = paramChoices.split(',').map(s => decodeURIComponent(s).trim()).filter(s => s.length > 0);
    }
  } catch (e) {}

  if (initialOptions.length === 0) {
    let saved = [];
    try {
      const stored = localStorage.getItem(storageKey || 'stw-options');
      if (stored) saved = JSON.parse(stored);
    } catch (e) {}
    initialOptions = saved.length > 0 ? saved : (defaultOptions || ['Yes', 'No', 'Maybe', 'Try Again']);
  }

  // Load saved history
  let spinHistory = [];
  const historyStorageKey = (storageKey || 'stw-main') + '-history';
  try {
    const storedHistory = localStorage.getItem(historyStorageKey);
    if (storedHistory) spinHistory = JSON.parse(storedHistory);
  } catch (e) {}

  // Initialize Wheel
  const wheel = new SpinWheel(canvas, {
    options: initialOptions,
    palette: localStorage.getItem('stw-palette') || 'rainbow',
    spinDuration: parseInt(localStorage.getItem('stw-speed') || '5000', 10),
    onSpinStart: () => {
      if (spinHeroBtn) {
        spinHeroBtn.disabled = true;
        spinHeroBtn.querySelector('.btn-label').textContent = 'Spinning...';
      }
      document.querySelector('.wheel-frame')?.classList.add('spinning');
    },
    onSpinEnd: (winner, index) => {
      if (spinHeroBtn) {
        spinHeroBtn.disabled = false;
        spinHeroBtn.querySelector('.btn-label').textContent = 'SPIN THE WHEEL';
      }
      document.querySelector('.wheel-frame')?.classList.remove('spinning');

      // Record History
      const record = { winner, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) };
      spinHistory.unshift(record);
      if (spinHistory.length > 50) spinHistory.pop();
      try {
        localStorage.setItem(historyStorageKey, JSON.stringify(spinHistory));
      } catch (e) {}
      renderHistory();

      // Confetti Blast
      if (confetti) confetti.blast();

      // Check Elimination mode
      if (removeOnPickCheckbox && removeOnPickCheckbox.checked) {
        const opts = [...wheel.options];
        opts.splice(index, 1);
        wheel.setOptions(opts);
        updateInput(opts);
        saveOptions(opts);
      }

      // Open Celebration Modal
      if (winnerModal && winnerTitle) {
        winnerTitle.textContent = winner;
        winnerModal.classList.add('is-active');
        winnerModal._lastIndex = index;
      }
    }
  });

  function updateInput(opts) {
    if (input) input.value = opts.join('\n');
    if (countBadge) countBadge.textContent = `${opts.length} option${opts.length !== 1 ? 's' : ''}`;
  }

  function saveOptions(opts) {
    try {
      localStorage.setItem(storageKey || 'stw-options', JSON.stringify(opts));
    } catch (e) {}
  }

  function parseInput() {
    if (!input) return [];
    return input.value.split('\n').map(s => s.trim()).filter(s => s.length > 0).slice(0, 100);
  }

  function renderHistory() {
    if (historyBadge) historyBadge.textContent = spinHistory.length;
    if (!historyList) return;
    if (spinHistory.length === 0) {
      historyList.innerHTML = `<div class="history-empty">No spins recorded yet. Hit Spin to start!</div>`;
      return;
    }
    historyList.innerHTML = spinHistory.map(item => `
      <div class="history-item">
        <span class="history-winner">🎯 ${escapeHtml(item.winner)}</span>
        <span class="history-time">${item.time}</span>
      </div>
    `).join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Bind Input Change
  if (input) {
    input.addEventListener('input', () => {
      const opts = parseInput();
      wheel.setOptions(opts);
      saveOptions(opts);
      if (countBadge) countBadge.textContent = `${opts.length} option${opts.length !== 1 ? 's' : ''}`;
    });
  }

  // Bind Spin Buttons
  if (spinHeroBtn) spinHeroBtn.addEventListener('click', () => wheel.spin());

  // Bind Fast Action Bar
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      const opts = parseInput();
      for (let i = opts.length - 1; i > 0; i--) {
        const j = Math.floor(secureRandom(i + 1));
        [opts[i], opts[j]] = [opts[j], opts[i]];
      }
      updateInput(opts);
      saveOptions(opts);
      wheel.setOptions(opts);
      showToast('Options shuffled randomly!');
    });
  }

  if (sortBtn) {
    sortBtn.addEventListener('click', () => {
      const opts = parseInput();
      opts.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
      updateInput(opts);
      saveOptions(opts);
      wheel.setOptions(opts);
      showToast('Options sorted A to Z!');
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (input) input.value = '';
      wheel.setOptions([]);
      saveOptions([]);
      if (countBadge) countBadge.textContent = '0 options';
      showToast('Cleared all choices.');
    });
  }

  // Bind Toolbar Controls
  if (soundToggleBtn) {
    const isMuted = wheel.sound.muted;
    updateSoundBtnState(isMuted);
    soundToggleBtn.addEventListener('click', () => {
      const nextState = !wheel.sound.muted;
      wheel.sound.setMuted(nextState);
      updateSoundBtnState(nextState);
      showToast(nextState ? 'Sound Muted' : 'Sound Enabled');
    });
  }

  function updateSoundBtnState(muted) {
    if (!soundToggleBtn) return;
    soundToggleBtn.classList.toggle('active', !muted);
    soundToggleBtn.innerHTML = muted 
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg><span>Muted</span>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg><span>Sound On</span>`;
  }

  if (paletteSelect) {
    const savedPalette = localStorage.getItem('stw-palette') || 'rainbow';
    paletteSelect.value = savedPalette;
    wheel.setPalette(savedPalette);
    paletteSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      localStorage.setItem('stw-palette', val);
      wheel.setPalette(val);
    });
  }

  if (speedSelect) {
    const savedSpeed = localStorage.getItem('stw-speed') || '5000';
    speedSelect.value = savedSpeed;
    wheel.setDuration(parseInt(savedSpeed, 10));
    speedSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      localStorage.setItem('stw-speed', val);
      wheel.setDuration(parseInt(val, 10));
    });
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    });
  }

  // Bind Quick Chips
  document.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetData = btn.getAttribute('data-options');
      if (presetData) {
        const opts = JSON.parse(presetData);
        updateInput(opts);
        saveOptions(opts);
        wheel.setOptions(opts);
        showToast(`Loaded ${btn.textContent.trim()} preset!`);
      }
    });
  });

  // Bind Share Button
  if (shareWheelBtn) {
    shareWheelBtn.addEventListener('click', () => {
      const opts = wheel.options.length > 0 ? wheel.options : initialOptions;
      const url = new URL(window.location.href);
      url.searchParams.set('choices', opts.join(','));
      navigator.clipboard.writeText(url.toString()).then(() => {
        showToast('Custom Wheel link copied to clipboard!');
      }).catch(() => {
        prompt('Copy your custom wheel URL:', url.toString());
      });
    });
  }

  // Bind Tabs
  if (tabEditor && tabHistory) {
    tabEditor.addEventListener('click', () => {
      tabEditor.classList.add('active');
      tabHistory.classList.remove('active');
      viewEditor.style.display = 'flex';
      viewHistory.style.display = 'none';
    });
    tabHistory.addEventListener('click', () => {
      tabHistory.classList.add('active');
      tabEditor.classList.remove('active');
      viewEditor.style.display = 'none';
      viewHistory.style.display = 'flex';
      renderHistory();
    });
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      spinHistory = [];
      try { localStorage.removeItem(historyStorageKey); } catch (e) {}
      renderHistory();
      showToast('Winner history cleared.');
    });
  }

  // Bind Modal Actions
  function closeModal() {
    if (winnerModal) winnerModal.classList.remove('is-active');
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (winnerModal) {
    winnerModal.addEventListener('click', (e) => {
      if (e.target === winnerModal) closeModal();
    });
  }

  if (modalSpinAgainBtn) {
    modalSpinAgainBtn.addEventListener('click', () => {
      closeModal();
      setTimeout(() => wheel.spin(), 200);
    });
  }

  if (modalRemoveSpinBtn) {
    modalRemoveSpinBtn.addEventListener('click', () => {
      const idx = winnerModal._lastIndex;
      if (idx !== undefined && idx >= 0) {
        const opts = [...wheel.options];
        opts.splice(idx, 1);
        wheel.setOptions(opts);
        updateInput(opts);
        saveOptions(opts);
      }
      closeModal();
      setTimeout(() => wheel.spin(), 200);
    });
  }

  if (modalCopyBtn) {
    modalCopyBtn.addEventListener('click', () => {
      if (winnerTitle) {
        navigator.clipboard.writeText(winnerTitle.textContent).then(() => {
          showToast(`Copied "${winnerTitle.textContent}" to clipboard!`);
        });
      }
    });
  }

  // Keyboard Shortcuts (Space to spin, Esc to close modal)
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && document.activeElement !== input && document.activeElement?.tagName !== 'INPUT') {
      e.preventDefault();
      if (winnerModal && winnerModal.classList.contains('is-active')) {
        closeModal();
        setTimeout(() => wheel.spin(), 150);
      } else {
        wheel.spin();
      }
    }
    if (e.code === 'Escape' && winnerModal && winnerModal.classList.contains('is-active')) {
      closeModal();
    }
  });

  // Init Data
  updateInput(initialOptions);
  renderHistory();

  return wheel;
}
