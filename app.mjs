// Spin the Wheel — Core Application Logic
// Canvas 2D spinning wheel with physics-based animation

const WHEEL_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
];

function getTextColor(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum > 140 ? '#1e293b' : '#ffffff';
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function secureRandom(max) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] / 4294967296 * max;
}

class SpinWheel {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = options.options || [];
    this.rotation = 0;
    this.isSpinning = false;
    this.winnerIndex = -1;
    this.onResult = options.onResult || (() => {});
    this.onSpinStart = options.onSpinStart || (() => {});
    this.onSpinEnd = options.onSpinEnd || (() => {});
    this._setupDPR();
    this.draw();

    // Click to spin
    this.canvas.addEventListener('click', () => this.spin());
    this.canvas.addEventListener('touchend', (e) => { e.preventDefault(); this.spin(); });
  }

  _setupDPR() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.size = rect.width;
    this.radius = this.size / 2;
  }

  setOptions(options) {
    this.options = options;
    this.rotation = 0;
    this.winnerIndex = -1;
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    const size = this.size;
    const radius = this.radius;
    const cx = size / 2;
    const cy = size / 2;

    ctx.clearRect(0, 0, size, size);

    // Shadow/glow
    ctx.save();
    ctx.shadowColor = 'rgba(99, 102, 241, 0.25)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.restore();

    if (this.options.length === 0) {
      // Empty state
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Add options to start', cx, cy);
      return;
    }

    const n = this.options.length;
    const arcAngle = (Math.PI * 2) / n;

    // Draw sectors
    for (let i = 0; i < n; i++) {
      const startAngle = i * arcAngle + this.rotation - Math.PI / 2;
      const endAngle = startAngle + arcAngle;

      // Sector fill
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius - 8, startAngle, endAngle);
      ctx.closePath();

      const color = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fillStyle = color;
      ctx.fill();

      // Highlight winner
      if (this.winnerIndex === i && !this.isSpinning) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      }

      // Border
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + arcAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = getTextColor(color);

      const text = this.options[i];
      const maxLen = 12;
      const displayText = text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text;

      // Auto-scale font
      const fontSize = Math.max(10, Math.min(18, 28 - n));
      ctx.font = `600 ${fontSize}px Inter, sans-serif`;
      ctx.fillText(displayText, radius - 16, 0);
      ctx.restore();
    }

    // Center hub
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#6366f1';
    ctx.fill();

    // Pointer (top triangle)
    ctx.beginPath();
    ctx.moveTo(cx, 4);
    ctx.lineTo(cx - 14, 30);
    ctx.lineTo(cx + 14, 30);
    ctx.closePath();
    ctx.fillStyle = '#6366f1';
    ctx.fill();
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  spin() {
    if (this.isSpinning) return;
    if (this.options.length < 2) {
      this._showToast('Please add at least 2 options');
      return;
    }

    this.isSpinning = true;
    this.winnerIndex = -1;
    this.onSpinStart();

    const n = this.options.length;
    const arcAngle = (Math.PI * 2) / n;
    const winnerIdx = Math.floor(secureRandom(n));

    // Target: winner sector center should align to pointer (top, angle -PI/2)
    // Sector i center in draw: i * arcAngle + rotation - PI/2 + arcAngle/2
    // For that to equal -PI/2: rotation = -(i * arcAngle + arcAngle/2) mod 2PI
    const fullSpins = 5 + Math.floor(secureRandom(3)); // 5-7 full spins
    const TWO_PI = Math.PI * 2;
    const targetMod = (TWO_PI - (winnerIdx * arcAngle + arcAngle / 2)) % TWO_PI;
    const currentMod = ((this.rotation % TWO_PI) + TWO_PI) % TWO_PI;
    const delta = (targetMod - currentMod + TWO_PI) % TWO_PI;
    const totalRotation = fullSpins * TWO_PI + delta;

    const startRotation = this.rotation;
    const duration = 4000 + secureRandom(1000); // 4-5 seconds
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(t);

      this.rotation = startRotation + totalRotation * eased;
      this.draw();

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isSpinning = false;
        this.winnerIndex = winnerIdx;
        this.draw();
        this.onSpinEnd(this.options[winnerIdx], winnerIdx);
        this._fireConfetti();
      }
    };

    requestAnimationFrame(animate);
  }

  _fireConfetti() {
    // Simple confetti using DOM elements
    const colors = WHEEL_COLORS;
    const container = document.querySelector('.wheel-container') || document.body;
    for (let i = 0; i < 40; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.cssText = `
        position: absolute;
        width: 10px; height: 10px;
        background: ${colors[i % colors.length]};
        left: 50%; top: 30%;
        pointer-events: none;
        z-index: 100;
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      `;
      container.appendChild(piece);

      const angle = (Math.random() * 2 - 1) * Math.PI;
      const velocity = 200 + Math.random() * 200;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity - 100;
      const rotSpeed = (Math.random() * 2 - 1) * 720;

      let x = 0, y = 0, rot = 0;
      let lastTime = performance.now();
      const gravity = 600;

      const fall = (now) => {
        const dt = (now - lastTime) / 1000;
        lastTime = now;
        x += vx * dt;
        y += (vy + gravity * dt * 0.5) * dt;
        rot += rotSpeed * dt;

        piece.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;

        if (y < 800) {
          requestAnimationFrame(fall);
        } else {
          piece.remove();
        }
      };
      requestAnimationFrame(fall);
    }
  }

  _showToast(msg) {
    let toast = document.querySelector('.wheel-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'wheel-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    // Force reflow so re-triggering the same message replays the animation
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }
}

// Page initialization helper
export function initWheelPage(config) {
  const { mode, defaultOptions, storageKey, pageName } = config;

  const canvas = document.getElementById('wheel-canvas');
  const input = document.getElementById('options-input');
  const spinBtn = document.getElementById('spin-btn');
  const clearBtn = document.getElementById('clear-btn');
  const shuffleBtn = document.getElementById('shuffle-btn');
  const resultDisplay = document.getElementById('result-display');
  const counterEl = document.getElementById('option-count');
  const removeCheck = document.getElementById('remove-on-pick');

  // Load saved options
  let savedOptions = [];
  try {
    const stored = localStorage.getItem(storageKey || 'stw-options');
    if (stored) savedOptions = JSON.parse(stored);
  } catch (e) {}

  const initialOptions = savedOptions.length > 0 ? savedOptions : (defaultOptions || []);

  // Set up wheel
  const wheel = new SpinWheel(canvas, {
    options: initialOptions,
    onSpinStart: () => {
      spinBtn.disabled = true;
      spinBtn.textContent = 'Spinning...';
    },
    onSpinEnd: (winner, index) => {
      spinBtn.disabled = false;
      spinBtn.textContent = 'Spin Again';
      resultDisplay.innerHTML = `
        <div class="result-winner">
          <span class="result-label">Result:</span>
          <span class="result-value">${escapeHtml(winner)}</span>
        </div>
        <div class="result-actions">
          <button class="btn btn-primary btn-sm" id="spin-again-btn">Spin Again</button>
          <button class="btn btn-text btn-sm" id="remove-spin-btn">Remove &amp; Spin</button>
        </div>
      `;
      resultDisplay.classList.add('visible');

      document.getElementById('spin-again-btn')?.addEventListener('click', () => wheel.spin());
      document.getElementById('remove-spin-btn')?.addEventListener('click', () => {
        const opts = [...wheel.options];
        opts.splice(index, 1);
        wheel.setOptions(opts);
        updateInput(opts);
        saveOptions(opts);
        setTimeout(() => wheel.spin(), 100);
      });
    }
  });

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function updateInput(opts) {
    if (input) input.value = opts.join('\n');
    if (counterEl) counterEl.textContent = `${opts.length} option${opts.length !== 1 ? 's' : ''}`;
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

  // Input handler
  if (input) {
    input.addEventListener('input', () => {
      const opts = parseInput();
      wheel.setOptions(opts);
      saveOptions(opts);
      if (counterEl) counterEl.textContent = `${opts.length} option${opts.length !== 1 ? 's' : ''}`;
    });
  }

  // Spin button
  if (spinBtn) {
    spinBtn.addEventListener('click', () => wheel.spin());
  }

  // Clear button
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (input) input.value = '';
      wheel.setOptions([]);
      saveOptions([]);
      if (counterEl) counterEl.textContent = '0 options';
      resultDisplay.classList.remove('visible');
    });
  }

  // Shuffle button
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
    });
  }

  // Init
  updateInput(initialOptions);

  return wheel;
}
