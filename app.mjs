// Spin the Wheel — Master Studio Engine
// Retina Canvas Wheel, 3D Brushed Metallic Bezel, Specular Studs, Spring Physics Flapper, Web Audio & Multi-shape Confetti

export const PALETTES = {
  vibrant: {
    name: 'Vibrant Studio',
    colors: ['#4f46e5', '#f43f5e', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#d946ef', '#84cc16']
  },
  cyber: {
    name: 'Cyberpunk Neon',
    colors: ['#00f0ff', '#ff007a', '#7928ca', '#10e575', '#ffb800', '#0070f3', '#ff5400']
  },
  sunset: {
    name: 'Sunset Flame',
    colors: ['#e11d48', '#ea580c', '#f59e0b', '#d97706', '#fb7185', '#fbbf24']
  },
  emerald: {
    name: 'Emerald Royale',
    colors: ['#047857', '#059669', '#10b981', '#34d399', '#0d9488', '#14b8a6', '#f59e0b']
  },
  ocean: {
    name: 'Ocean Azure',
    colors: ['#0369a1', '#0284c7', '#0ea5e9', '#38bdf8', '#6366f1', '#818cf8', '#a855f7']
  },
  pastel: {
    name: 'Holo Pastel',
    colors: ['#f87171', '#fb923c', '#fbbf24', '#34d399', '#38bdf8', '#a78bfa', '#f472b6', '#818cf8']
  }
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

      osc.type = 'triangle';
      const baseFreq = 580 + Math.min(velocity * 30, 220);
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.028);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.032);
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
        const startTime = now + i * 0.085;
        const dur = 0.5;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.22, startTime + 0.03);
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
    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#3b82f6', '#f43f5e', '#fbbf24', '#ffffff'];
    this.particles = [];
    const count = 140;

    for (let i = 0; i < count; i++) {
      const fromLeft = i % 2 === 0;
      const originX = fromLeft ? this.canvas.width * 0.15 : this.canvas.width * 0.85;
      const angle = fromLeft ? (Math.PI / 4) + Math.random() * (Math.PI / 3) : (Math.PI * 0.75) - Math.random() * (Math.PI / 3);
      const speed = 14 + Math.random() * 22;

      this.particles.push({
        x: originX,
        y: this.canvas.height * 0.65,
        vx: Math.cos(angle) * (fromLeft ? 1 : -1) * speed,
        vy: -Math.sin(angle) * speed,
        size: 7 + Math.random() * 9,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 14,
        tilt: Math.random() * 10,
        tiltSpeed: 0.12 + Math.random() * 0.12,
        shape: Math.random() > 0.3 ? 'rect' : 'circle',
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

    const gravity = 0.42;
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

      if (p.life > 95) {
        p.opacity -= 0.022;
      }

      if (p.opacity > 0 && p.y < this.canvas.height + 60) {
        alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.scale(Math.cos(p.tilt), 1);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
        }
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
    this.palette = config.palette || 'vibrant';
    this.spinDuration = config.spinDuration || 5000;
    this.rotation = 0;
    this.isSpinning = false;
    this.winnerIndex = -1;
    this.pointerAngle = 0;
    this.pointerVelocity = 0;
    this.lastPassedSlice = -1;
    this.isHubHovered = false;

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

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dist = Math.hypot(x - cx, y - cy);
      // Clicking anywhere on wheel or center hub starts spin
      this.spin();
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dist = Math.hypot(x - cx, y - cy);
      const hubHover = dist < (rect.width * 0.18);
      if (hubHover !== this.isHubHovered) {
        this.isHubHovered = hubHover;
        if (!this.isSpinning) this.draw();
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      if (this.isHubHovered) {
        this.isHubHovered = false;
        if (!this.isSpinning) this.draw();
      }
    });
  }

  _setupDPR() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const rect = this.canvas.getBoundingClientRect();
    const size = Math.min(rect.width || 460, rect.height || 460);
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
    const innerTrackRadius = radius - 16;
    const wheelRadius = radius - 24;

    // 1. Layer 1: Outer Cast Shadow & Deep Bezel Ring
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, outerBezelRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#0b0d14';
    ctx.fill();
    ctx.restore();

    // 2. Layer 2: Milled Precision Titanium Bezel with Radial Highlights
    const bezelGrad = ctx.createLinearGradient(cx - outerBezelRadius, cy - outerBezelRadius, cx + outerBezelRadius, cy + outerBezelRadius);
    bezelGrad.addColorStop(0, '#3a4256');
    bezelGrad.addColorStop(0.25, '#1e2433');
    bezelGrad.addColorStop(0.5, '#2c3345');
    bezelGrad.addColorStop(0.75, '#151924');
    bezelGrad.addColorStop(1, '#2d3548');

    ctx.beginPath();
    ctx.arc(cx, cy, outerBezelRadius, 0, Math.PI * 2);
    ctx.fillStyle = bezelGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner Bezel Track (Gold chamfered groove)
    const grooveGrad = ctx.createLinearGradient(0, 0, size, size);
    grooveGrad.addColorStop(0, '#10131a');
    grooveGrad.addColorStop(1, '#1e2330');

    ctx.beginPath();
    ctx.arc(cx, cy, innerTrackRadius, 0, Math.PI * 2);
    ctx.fillStyle = grooveGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    if (this.options.length === 0) {
      // Empty state
      ctx.beginPath();
      ctx.arc(cx, cy, wheelRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#141824';
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Add choices to spin', cx, cy);
      this._drawPointer(cx, cy, radius);
      return;
    }

    const n = this.options.length;
    const arcAngle = (Math.PI * 2) / n;
    const paletteDef = PALETTES[this.palette] || PALETTES.vibrant;
    const colors = paletteDef.colors;

    // 3. Draw Slices & Radial Sheen
    for (let i = 0; i < n; i++) {
      const startAngle = i * arcAngle + this.rotation - Math.PI / 2;
      const endAngle = startAngle + arcAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, wheelRadius, startAngle, endAngle);
      ctx.closePath();

      const baseColor = colors[i % colors.length];
      ctx.fillStyle = baseColor;
      ctx.fill();

      // Subtle 3D Radial Curvature Gradient (Luster)
      const radGrad = ctx.createRadialGradient(cx, cy, wheelRadius * 0.15, cx, cy, wheelRadius);
      radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
      radGrad.addColorStop(0.45, 'rgba(255, 255, 255, 0.05)');
      radGrad.addColorStop(0.85, 'rgba(0, 0, 0, 0.04)');
      radGrad.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
      ctx.fillStyle = radGrad;
      ctx.fill();

      // Crisp White Slice Divider Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = n > 30 ? 1 : 1.8;
      ctx.stroke();

      // Slice Text Rendering
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + arcAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      const text = this.options[i];
      const maxChars = n > 25 ? 12 : 20;
      const displayText = text.length > maxChars ? text.slice(0, maxChars - 1) + '…' : text;
      
      // Dynamic responsive font size
      const maxFontSize = Math.min(17, Math.max(11, Math.floor(240 / Math.max(n, 7))));
      ctx.font = `700 ${maxFontSize}px "Plus Jakarta Sans", "Inter", sans-serif`;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(displayText, wheelRadius - 16, 0);
      ctx.restore();

      // 4. Draw Specular Stud Pins at Bezel Joint
      const pinAngle = startAngle;
      const pinDistance = innerTrackRadius - 4;
      const pinX = cx + Math.cos(pinAngle) * pinDistance;
      const pinY = cy + Math.sin(pinAngle) * pinDistance;

      // Pin base shadow
      ctx.beginPath();
      ctx.arc(pinX, pinY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#080a0f';
      ctx.fill();

      // Pin metallic gradient
      const pinGrad = ctx.createRadialGradient(pinX - 1.2, pinY - 1.2, 0.5, pinX, pinY, 3.5);
      pinGrad.addColorStop(0, '#ffffff');
      pinGrad.addColorStop(0.35, '#fbbf24');
      pinGrad.addColorStop(0.85, '#d97706');
      pinGrad.addColorStop(1, '#78350f');

      ctx.beginPath();
      ctx.arc(pinX, pinY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = pinGrad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // 5. Center Hubcap (Multi-tiered 3D Machined Core)
    const hubRadius = Math.max(26, wheelRadius * 0.19);

    // Hub Outer Drop Shadow
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, hubRadius + 4, 0, Math.PI * 2);
    ctx.fillStyle = '#080a0f';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;
    ctx.fill();
    ctx.restore();

    // Hub Outer Brass/Gold Bevel Ring
    const hubOuterGrad = ctx.createLinearGradient(cx - hubRadius, cy - hubRadius, cx + hubRadius, cy + hubRadius);
    hubOuterGrad.addColorStop(0, '#fef08a');
    hubOuterGrad.addColorStop(0.5, '#f59e0b');
    hubOuterGrad.addColorStop(1, '#b45309');

    ctx.beginPath();
    ctx.arc(cx, cy, hubRadius, 0, Math.PI * 2);
    ctx.fillStyle = hubOuterGrad;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Hub Middle Dark Milled Ring
    ctx.beginPath();
    ctx.arc(cx, cy, hubRadius * 0.82, 0, Math.PI * 2);
    ctx.fillStyle = '#141824';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Hub Inner Core (Interactive Glow on Hover)
    const coreGrad = ctx.createRadialGradient(cx, cy - 2, 2, cx, cy, hubRadius * 0.65);
    if (this.isHubHovered) {
      coreGrad.addColorStop(0, '#818cf8');
      coreGrad.addColorStop(0.7, '#6366f1');
      coreGrad.addColorStop(1, '#4338ca');
    } else {
      coreGrad.addColorStop(0, '#6366f1');
      coreGrad.addColorStop(0.7, '#4f46e5');
      coreGrad.addColorStop(1, '#312e81');
    }

    ctx.beginPath();
    ctx.arc(cx, cy, hubRadius * 0.65, 0, Math.PI * 2);
    ctx.fillStyle = coreGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Embossed "SPIN" Typography
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${Math.max(9, Math.floor(hubRadius * 0.4))}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
    ctx.fillText('SPIN', cx, cy);

    // 6. Draw 12 o'clock Golden Needle Pointer with Spring Physics
    this._drawPointer(cx, cy, radius);
  }

  _drawPointer(cx, cy, radius) {
    const ctx = this.ctx;
    const pointerWidth = 22;
    const pointerHeight = 32;

    ctx.save();
    ctx.translate(cx, 8);
    ctx.rotate(this.pointerAngle);

    // Needle drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    // Dual-tone 3D Golden Pointer Dart
    // Left Half (Specular highlight)
    ctx.beginPath();
    ctx.moveTo(0, pointerHeight);
    ctx.lineTo(-pointerWidth / 2, -6);
    ctx.lineTo(0, -3);
    ctx.closePath();

    const leftGrad = ctx.createLinearGradient(-pointerWidth / 2, -6, 0, pointerHeight);
    leftGrad.addColorStop(0, '#fef08a');
    leftGrad.addColorStop(0.5, '#fbbf24');
    leftGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = leftGrad;
    ctx.fill();

    // Right Half (Deep shadow)
    ctx.beginPath();
    ctx.moveTo(0, pointerHeight);
    ctx.lineTo(pointerWidth / 2, -6);
    ctx.lineTo(0, -3);
    ctx.closePath();

    const rightGrad = ctx.createLinearGradient(pointerWidth / 2, -6, 0, pointerHeight);
    rightGrad.addColorStop(0, '#f59e0b');
    rightGrad.addColorStop(0.5, '#d97706');
    rightGrad.addColorStop(1, '#92400e');
    ctx.fillStyle = rightGrad;
    ctx.fill();

    // Pointer Rim Stroke
    ctx.beginPath();
    ctx.moveTo(0, pointerHeight);
    ctx.lineTo(-pointerWidth / 2, -6);
    ctx.lineTo(0, -3);
    ctx.lineTo(pointerWidth / 2, -6);
    ctx.closePath();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Pivot Screw Head (Chrome cap)
    const pivotGrad = ctx.createRadialGradient(0, -3.5, 0.5, 0, -3.5, 4);
    pivotGrad.addColorStop(0, '#ffffff');
    pivotGrad.addColorStop(0.5, '#cbd5e1');
    pivotGrad.addColorStop(1, '#475569');

    ctx.beginPath();
    ctx.arc(0, -3.5, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = pivotGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

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

    const fullSpins = 6 + Math.floor(secureRandom(3));
    const TWO_PI = Math.PI * 2;
    // Calculate final resting position so needle points exactly at the center of winner slice
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
      const speed = (this.rotation - prevRotation) * 60;
      prevRotation = this.rotation;

      // Check sector pin crossings for mechanical tick & flapper deflection
      const currentNormalized = (this.rotation % TWO_PI + TWO_PI) % TWO_PI;
      const currentSlice = Math.floor(currentNormalized / arcAngle);

      if (currentSlice !== this.lastPassedSlice) {
        this.lastPassedSlice = currentSlice;
        this.pointerVelocity = 0.35;
        this.sound.playTick(Math.min(speed, 10));
      }

      // Spring physics for pointer flapper
      const spring = 0.2;
      const damp = 0.74;
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

// Global Toast System
export function showToast(msg) {
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
  const chipsContainer = document.getElementById('option-chips-container');
  const quickAddInput = document.getElementById('quick-add-input');
  const quickAddBtn = document.getElementById('quick-add-btn');
  const spinHeroBtn = document.getElementById('spin-btn-hero');
  const countBadge = document.getElementById('option-count-badge');
  const clearBtn = document.getElementById('clear-btn');
  const shuffleBtn = document.getElementById('shuffle-btn');
  const sortBtn = document.getElementById('sort-btn');
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const removeOnPickCheckbox = document.getElementById('remove-on-pick');
  const shareWheelBtn = document.getElementById('share-wheel-btn');
  const bulkToggleBtn = document.getElementById('bulk-toggle-btn');
  const bulkSection = document.getElementById('bulk-editor-section');

  // Tabs
  const tabChoices = document.getElementById('tab-choices');
  const tabPresets = document.getElementById('tab-presets');
  const tabHistory = document.getElementById('tab-history');
  const viewChoices = document.getElementById('view-choices');
  const viewPresets = document.getElementById('view-presets');
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
  const initialPalette = localStorage.getItem('stw-palette') || 'vibrant';
  const initialSpeed = parseInt(localStorage.getItem('stw-speed') || '5000', 10);

  const wheel = new SpinWheel(canvas, {
    options: initialOptions,
    palette: initialPalette,
    spinDuration: initialSpeed,
    onSpinStart: () => {
      if (spinHeroBtn) {
        spinHeroBtn.disabled = true;
        spinHeroBtn.querySelector('.btn-label').textContent = 'SPINNING...';
        spinHeroBtn.classList.add('is-spinning');
      }
    },
    onSpinEnd: (winner, index) => {
      if (spinHeroBtn) {
        spinHeroBtn.disabled = false;
        spinHeroBtn.querySelector('.btn-label').textContent = 'SPIN THE WHEEL';
        spinHeroBtn.classList.remove('is-spinning');
      }

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
        syncOptionsToUI(opts);
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

  function syncOptionsToUI(opts) {
    if (input) input.value = opts.join('\n');
    if (countBadge) countBadge.textContent = opts.length;
    renderChips(opts);
  }

  function renderChips(opts) {
    if (!chipsContainer) return;
    const paletteDef = PALETTES[wheel.palette] || PALETTES.vibrant;
    const colors = paletteDef.colors;
    chipsContainer.innerHTML = opts.map((opt, i) => {
      const color = colors[i % colors.length];
      return `
        <div class="option-chip" data-index="${i}">
          <span class="option-chip-dot" style="background-color: ${color}"></span>
          <span class="option-chip-text" title="${escapeHtml(opt)}">${escapeHtml(opt)}</span>
          <button class="option-chip-delete" type="button" aria-label="Remove ${escapeHtml(opt)}" title="Delete item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
    }).join('');

    chipsContainer.querySelectorAll('.option-chip-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const chip = e.target.closest('.option-chip');
        const idx = parseInt(chip.getAttribute('data-index'), 10);
        const currentOpts = [...wheel.options];
        if (idx >= 0 && idx < currentOpts.length) {
          currentOpts.splice(idx, 1);
          wheel.setOptions(currentOpts);
          syncOptionsToUI(currentOpts);
          saveOptions(currentOpts);
        }
      });
    });
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
        <span class="history-winner">🏆 ${escapeHtml(item.winner)}</span>
        <span class="history-time">${item.time}</span>
      </div>
    `).join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Quick Add
  function handleQuickAdd() {
    if (!quickAddInput) return;
    const val = quickAddInput.value.trim();
    if (!val) return;
    const currentOpts = parseInput();
    currentOpts.push(val);
    quickAddInput.value = '';
    quickAddInput.focus();
    wheel.setOptions(currentOpts);
    syncOptionsToUI(currentOpts);
    saveOptions(currentOpts);
  }

  if (quickAddBtn) quickAddBtn.addEventListener('click', handleQuickAdd);
  if (quickAddInput) {
    quickAddInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleQuickAdd();
      }
    });
  }

  // Bulk Edit Toggle
  if (bulkToggleBtn && bulkSection) {
    bulkToggleBtn.addEventListener('click', () => {
      const isHidden = bulkSection.style.display === 'none' || bulkSection.style.display === '';
      bulkSection.style.display = isHidden ? 'block' : 'none';
      bulkToggleBtn.classList.toggle('active', isHidden);
    });
  }

  if (input) {
    input.addEventListener('input', () => {
      const opts = parseInput();
      wheel.setOptions(opts);
      saveOptions(opts);
      if (countBadge) countBadge.textContent = opts.length;
      renderChips(opts);
    });
  }

  // Spin CTA
  if (spinHeroBtn) spinHeroBtn.addEventListener('click', () => wheel.spin());

  // Action Buttons (Shuffle, Sort, Clear)
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      const opts = parseInput();
      for (let i = opts.length - 1; i > 0; i--) {
        const j = Math.floor(secureRandom(i + 1));
        [opts[i], opts[j]] = [opts[j], opts[i]];
      }
      wheel.setOptions(opts);
      syncOptionsToUI(opts);
      saveOptions(opts);
      showToast('Options shuffled randomly!');
    });
  }

  if (sortBtn) {
    sortBtn.addEventListener('click', () => {
      const opts = parseInput();
      opts.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
      wheel.setOptions(opts);
      syncOptionsToUI(opts);
      saveOptions(opts);
      showToast('Options sorted alphabetically!');
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (input) input.value = '';
      wheel.setOptions([]);
      syncOptionsToUI([]);
      saveOptions([]);
      showToast('Cleared all choices.');
    });
  }

  // Speed Segmented Buttons
  document.querySelectorAll('.speed-pill-btn').forEach(btn => {
    const dur = parseInt(btn.getAttribute('data-speed'), 10);
    if (dur === wheel.spinDuration) {
      btn.classList.add('active');
    }
    btn.addEventListener('click', () => {
      document.querySelectorAll('.speed-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      wheel.setDuration(dur);
      localStorage.setItem('stw-speed', dur.toString());
    });
  });

  // Palette Swatches
  document.querySelectorAll('.palette-swatch-btn').forEach(btn => {
    const palKey = btn.getAttribute('data-palette');
    if (palKey === wheel.palette) {
      btn.classList.add('active');
    }
    btn.addEventListener('click', () => {
      document.querySelectorAll('.palette-swatch-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      wheel.setPalette(palKey);
      localStorage.setItem('stw-palette', palKey);
      renderChips(wheel.options);
    });
  });

  // Sound Button
  if (soundToggleBtn) {
    const isMuted = wheel.sound.muted;
    updateSoundBtnState(isMuted);
    soundToggleBtn.addEventListener('click', () => {
      const nextMuted = !wheel.sound.muted;
      wheel.sound.setMuted(nextMuted);
      updateSoundBtnState(nextMuted);
      showToast(nextMuted ? 'Sound muted' : 'Sound enabled');
    });
  }

  function updateSoundBtnState(muted) {
    if (!soundToggleBtn) return;
    if (muted) {
      soundToggleBtn.classList.remove('active');
      soundToggleBtn.setAttribute('title', 'Sound Muted — Click to Enable');
      soundToggleBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
        <span>Muted</span>
      `;
    } else {
      soundToggleBtn.classList.add('active');
      soundToggleBtn.setAttribute('title', 'Sound Enabled — Click to Mute');
      soundToggleBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
        <span>Sound</span>
      `;
    }
  }

  // Fullscreen
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    });
  }

  // Preset Cards / Chips
  document.querySelectorAll('.preset-pill-item[data-options]').forEach(item => {
    item.addEventListener('click', () => {
      try {
        const raw = item.getAttribute('data-options');
        const opts = JSON.parse(raw);
        wheel.setOptions(opts);
        syncOptionsToUI(opts);
        saveOptions(opts);
        showToast('Loaded preset wheel!');
        // Auto switch back to choices tab
        if (tabChoices) tabChoices.click();
      } catch (e) {}
    });
  });

  // Share Wheel URL
  if (shareWheelBtn) {
    shareWheelBtn.addEventListener('click', async () => {
      const currentOpts = parseInput();
      if (currentOpts.length === 0) {
        showToast('Please add options before sharing!');
        return;
      }
      const encoded = currentOpts.map(s => encodeURIComponent(s)).join(',');
      const shareUrl = `${window.location.origin}${window.location.pathname}?options=${encoded}`;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(shareUrl);
          showToast('Custom wheel link copied to clipboard!');
        } else {
          prompt('Copy custom wheel link:', shareUrl);
        }
      } catch (err) {
        prompt('Copy custom wheel link:', shareUrl);
      }
    });
  }

  // Tab Navigation
  function switchTab(activeTab, activeView) {
    [tabChoices, tabPresets, tabHistory].forEach(t => {
      if (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      }
    });
    [viewChoices, viewPresets, viewHistory].forEach(v => {
      if (v) v.style.display = 'none';
    });

    if (activeTab) {
      activeTab.classList.add('active');
      activeTab.setAttribute('aria-selected', 'true');
    }
    if (activeView) {
      activeView.style.display = 'flex';
    }
  }

  if (tabChoices && viewChoices) {
    tabChoices.addEventListener('click', () => switchTab(tabChoices, viewChoices));
  }
  if (tabPresets && viewPresets) {
    tabPresets.addEventListener('click', () => switchTab(tabPresets, viewPresets));
  }
  if (tabHistory && viewHistory) {
    tabHistory.addEventListener('click', () => {
      switchTab(tabHistory, viewHistory);
      renderHistory();
    });
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      spinHistory = [];
      try {
        localStorage.removeItem(historyStorageKey);
      } catch (e) {}
      renderHistory();
      showToast('Cleared winners log.');
    });
  }

  // Modal Actions
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
        syncOptionsToUI(opts);
        saveOptions(opts);
      }
      closeModal();
      setTimeout(() => wheel.spin(), 200);
    });
  }

  if (modalCopyBtn) {
    modalCopyBtn.addEventListener('click', async () => {
      const winner = winnerTitle?.textContent || '';
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(winner);
          showToast(`Copied "${winner}" to clipboard!`);
        } else {
          prompt('Copy winner text:', winner);
        }
      } catch (e) {
        prompt('Copy winner text:', winner);
      }
    });
  }

  // Keyboard Shortcuts (Space to Spin, Esc to Close)
  window.addEventListener('keydown', (e) => {
    const isModalOpen = winnerModal?.classList.contains('is-active');
    if (e.key === 'Escape' && isModalOpen) {
      closeModal();
      return;
    }
    if (e.code === 'Space' && document.activeElement !== input && document.activeElement !== quickAddInput && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      e.preventDefault();
      if (isModalOpen) {
        closeModal();
        setTimeout(() => wheel.spin(), 150);
      } else {
        wheel.spin();
      }
    }
  });

  // Initial Sync
  syncOptionsToUI(initialOptions);
  renderHistory();

  return wheel;
}
