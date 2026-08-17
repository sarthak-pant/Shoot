const MODES = ['classic', 'precision', 'speed', 'reaction', 'tracking']

// giving each mode distinct colors that will be used for targets, glow, and UI highlights
// matches the themes in :root in stylles.css
const MODE_COLORS = {
    classic: {primary: '#e7b73c', secondary: '#bd8f1f', glow: 'rgba(231, 183,60,0.31)'},
    precision: {primary: '#e12323', secondary: '#ab2d26', glow: 'rgba(249, 34, 34, 0.27)'},
    speed: {primary: '#e8662c', secondary: '#c1491a', glow: 'rgba(232, 102, 44, 0.32)'},
    reaction: {primary: '#c26fc4', secondary: '#9a4fa0', glow: 'rgba(194, 111, 196, 0.28)'},
    tracking: {primary: '#2db89f', secondary: '#1d8f79', glow: 'rgba(45, 184, 159, 0.28)'}
};

// configuring each mode's properties
const MODE_CONFIG = {
    classic: {duration: 60, targetRadius: 35, maxTargets:1, lifetime: 0, baseScore: 100, spawnDelay: 0.3, targetTypes: ['static']},
    precision: {duration: 60, targetRadius: 18, maxTargets: 1, lifetime: 0, baseScore: 250, spawnDelay: 0.4, targetTypes: ['static']},
    speed: {duration: 30, targetRadius: 30, maxTargets: 3, lifetime: 1.5, baseScore: 75, spawnDelay: 0.15, targetTypes: ['static']},
    reaction: {duration: 0, targetRadius: 35, maxTargets: 1, lifetime: 0, baseScore: 0, spawnDelay: 0, targetTypes: ['static']},
    tracking: {duration: 0, targetRadius: 30, maxTargets: 2, lifetime: 3.5, baseScore: 150, spawnDelay: 0.6, targetTypes: ['strafe', 'float', 'follow']}
}

// Sound definitions used by AudioManager.
const SOUND_DEFS = {
  hit:      { type: 'sine', freq: [880, 1760], dur: 0.12, vol: 0.18 },
  miss:     { type: 'sawtooth', freq: [200, 80], dur: 0.15, vol: 0.08 },
  combo:    { type: 'sine', freq: [660, 1320], dur: 0.10, vol: 0.12 },
  gameover: { type: 'sine', notes: [523, 659, 784, 1047], dur: 0.15, vol: 0.15, delay: 0.12 },
};


const rand  = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

// Shorthand for document.getElementById.
const getElem = (id) => document.getElementById(id);

// Reads the currently selected value from a settings button group.
function getActiveSetting(groupId) {
  const active = document.querySelector(`#${groupId} .setting-btn.active`);
  return active ? active.CDATA_SECTION_NODE.value : null;
}


class AudioManager {
  constructor() {
    this.context = null;
    this.enabled = true;
  }

  // Create the AudioContext (must happen after a user gesture on some browsers).
  init() {
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    } catch (_) {}
  }

  // Chrome blocks autoplay  resume on first interaction.
  ensureResumed() {
    if (this.context && this.context.state === 'suspended') {
      this.context.resume();
    }
  }

   // Play a single oscillator tone with optional frequency sweep.
  playTone(type, frequency, startTime, duration, volume, endFrequency) {
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    if (endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, startTime + duration * 0.7);
    }

    gainNode.gain.setValueAtTime(volume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  // Look up a sound definition and play it.
  play(name) {
    if (!this.enabled || !this.context) return;
    this.ensureResumed();

    const sound = SOUND_DEFS[name];
    if (!sound) return;

    const now = this.context.currentTime;

    if (sound.notes) {
      // Multi-note sounds (e.g. game over fanfare).
      sound.notes.forEach((note, index) => {
        this.playTone(sound.type, note, now + index * sound.delay, sound.dur, sound.vol);
      });
    } else {
      this.playTone(sound.type, sound.freq[0], now, sound.dur, sound.vol, sound.freq[1]);
    }
  }

  hit() { this.play('hit'); }
  miss() { this.play('miss'); }
  combo() { this.play('combo'); }
  gameOver() { this.play('gameover'); }
}



class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  // Spawn a burst of particles at (x, y) with the given color.
  emit(x, y, color, count = 16, speed = 200) {
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const velocity = rand(speed * 0.5, speed);

      this.particles.push({
        x, y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1,
        decay: rand(0.015, 0.04),
        size: rand(2, 5),
        color,
      });
    }
  }

  // Advance all particles (apply gravity, fade out).
  update(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.vy += 120 * deltaTime;  // gravity
      p.life-= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // Draw all active particles.
  render(context) {
    for (const p of this.particles) {
      context.globalAlpha = p.life;
      context.fillStyle = p.color;
      context.beginPath();
      context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
  }
}



class Target {
  constructor(config) {
    this.x = config.x;
    this.y = config.y;
    this.radius= config.radius;
    this.type = config.type || 'static';
    this.lifetime= config.lifetime || 0;
    this.baseColor= config.color || '#e7b73c';

    this.elapsed= 0;
    this.hit = false;
    this.spawnedAt = performance.now();

    // Movement state.
    this.direction= rand(0, Math.PI * 2);
    this.speed = rand(80, 160);
    this.strafeDir= 1;
    this.strafeSpeed = rand(100, 200);
  }

  // Advance the target's position based on its movement type.
  update(deltaTime, canvasWidth, canvasHeight) {
    this.elapsed += deltaTime;

    switch (this.type) {
      case 'strafe':
        this.x += this.strafeDir * this.strafeSpeed * deltaTime;
        if (this.x > canvasWidth - this.radius - 20 || this.x < this.radius + 20) {
          this.strafeDir *= -1;
        }
        break;

      case 'float':
        this.direction += rand(-1, 1) * deltaTime;
        this.x += Math.cos(this.direction) * this.speed * deltaTime;
        this.y += Math.sin(this.direction) * this.speed * deltaTime;
        this.x = clamp(this.x, this.radius + 10, canvasWidth  - this.radius - 10);
        this.y = clamp(this.y, this.radius + 10, canvasHeight - this.radius - 10);
        break;

      case 'follow':
        const angle = Math.atan2(
          canvasHeight * 0.5 - this.y,
          canvasWidth  * 0.5 - this.x        );
        this.x += Math.cos(angle) * this.speed * deltaTime * 0.4;
        this.y += Math.sin(angle) * this.speed * deltaTime * 0.4;
        break;
    }
  }

  // Draw the target — outer glow, pulsing ring, inner dot, and crosshair.
  render(context, now) {
    if (this.hit) return;

    const r = this.radius;
    const pulse = Math.sin(now * 0.003) * 0.04 + 0.96;

    // Fade out during the last 300ms of the target's lifetime.
    let alpha = 1;
    if (this.lifetime > 0 && this.elapsed > this.lifetime - 0.3) {
      alpha = clamp((this.lifetime - this.elapsed) / 0.3, 0, 1);
    }

    context.save();
    context.globalAlpha = alpha;

    // Outer radial glow.
    const gradient = context.createRadialGradient(this.x, this.y, r * 0.2, this.x, this.y, r * 1.5);
    gradient.addColorStop(0, this.baseColor + '30');
    gradient.addColorStop(1, this.baseColor + '00');
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(this.x, this.y, r * 1.5, 0, Math.PI * 2);
    context.fill();

    // Pulsing outer ring.
    context.beginPath();
    context.arc(this.x, this.y, r * pulse, 0, Math.PI * 2);
    context.fillStyle = this.baseColor + '20';
    context.fill();

    // Main filled circle.
    context.beginPath();
    context.arc(this.x, this.y, r, 0, Math.PI * 2);
    context.fillStyle = this.baseColor + '25';
    context.fill();

    // Main border.
    context.strokeStyle = this.baseColor;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(this.x, this.y, r, 0, Math.PI * 2);
    context.stroke();

    // Inner ring.
    context.beginPath();
    context.arc(this.x, this.y, r * 0.6, 0, Math.PI * 2);
    context.strokeStyle = this.baseColor + '80';
    context.lineWidth = 1.5;
    context.stroke();

    // Center dot.
    context.beginPath();
    context.arc(this.x, this.y, r * 0.2, 0, Math.PI * 2);
    context.fillStyle = this.baseColor + 'cc';
    context.fill();

    // Crosshair lines.
    context.strokeStyle = this.baseColor + '60';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(this.x - r * 0.7, this.y);
    context.lineTo(this.x + r * 0.7, this.y);
    context.stroke();
    context.beginPath();
    context.moveTo(this.x, this.y - r * 0.7);
    context.lineTo(this.x, this.y + r * 0.7);
    context.stroke();

    context.restore();
  }

  // Hit-test against canvas coordinates.
  contains(px, py) {
    return !this.hit && distance(px, py, this.x, this.y) <= this.radius;
  }

  // True when the target has exceeded its lifetime.
  isExpired() {
    return this.lifetime > 0 && this.elapsed > this.lifetime;
  }
}



class StatsManager {
  constructor() {
    this.data = this.load();
  }

  // Default structure when no saved data exists.
  static defaults() {
    return { best: {}, history: [], totalSessions: 0 };
  }

  load() {
    try {
      return JSON.parse(localStorage.getItem('shoot_stats')) || StatsManager.defaults();
    } catch {
      return StatsManager.defaults();
    }
  }

  save() {
    try {
      localStorage.setItem('shoot_stats', JSON.stringify(this.data));
    } catch (_) {}
  }

  // Return the best score for a given mode (or 0 if none).
  getBest(mode) {
    return this.data.best[mode] || 0;
  }

