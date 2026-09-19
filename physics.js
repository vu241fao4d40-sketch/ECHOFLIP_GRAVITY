/**
 * ECHOCORE: ANTI-GRAVITY - Physics Engine & Particle System
 * Handles 2D rigid-body motion, gravity vector simulation, collisions, and particle effects.
 */

// 2D Vector Helper
class Vec2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  set(x, y) { this.x = x; this.y = y; return this; }
  add(v) { this.x += v.x; this.y += v.y; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; return this; }
  scale(s) { this.x *= s; this.y *= s; return this; }
  length() { return Math.hypot(this.x, this.y); }
  normalize() {
    const len = this.length();
    if (len > 0.0001) { this.x /= len; this.y /= len; }
    return this;
  }
  dist(v) { return Math.hypot(this.x - v.x, this.y - v.y); }
  static dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
}

// Visual Particle Class
class Particle {
  constructor(x, y, vx, vy, color, size, life, type = 'spark') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.life = life;
    this.maxLife = life;
    this.type = type; // 'spark', 'smoke', 'fire', 'cryo', 'ripple'
    this.decay = 1.0;
  }

  update(dt) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.type === 'smoke' || this.type === 'fire') {
      this.vy -= 15 * dt; // Fire/smoke naturally drifts slightly upward
      this.size += 4 * dt;
    } else if (this.type === 'cryo') {
      this.size += 8 * dt;
      this.vx *= 0.95;
      this.vy *= 0.95;
    } else if (this.type === 'spark') {
      this.vx *= 0.92;
      this.vy *= 0.92;
    }
    return this.life > 0;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;

    if (this.type === 'ripple') {
      const radius = this.size + (1 - alpha) * 60;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2 * alpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(0.5, this.size * alpha), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// Particle Manager
class ParticleManager {
  constructor() {
    this.particles = [];
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      if (!this.particles[i].update(dt)) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      p.draw(ctx);
    }
  }

  emit(x, y, count, color, speed = 80, size = 3, life = 0.5, type = 'spark') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (0.3 + Math.random() * 0.7) * speed;
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd;
      this.particles.push(new Particle(x, y, vx, vy, color, size, life * (0.8 + Math.random() * 0.4), type));
    }
  }

  emitCollision(x, y, color = '#ffaa00') {
    this.emit(x, y, 16, color, 140, 3, 0.4, 'spark');
    this.emit(x, y, 6, '#ffffff', 80, 2, 0.25, 'spark');
  }

  emitFire(x, y) {
    const colors = ['#ff2a55', '#ff7700', '#ffcc00'];
    const col = colors[Math.floor(Math.random() * colors.length)];
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.0;
    const speed = 30 + Math.random() * 40;
    this.particles.push(new Particle(x + (Math.random() - 0.5) * 20, y, Math.cos(angle) * speed, Math.sin(angle) * speed, col, 4, 0.6, 'fire'));
  }

  emitCryo(x, y) {
    const colors = ['#00f0ff', '#e0ffff', '#70d6ff'];
    const col = colors[Math.floor(Math.random() * colors.length)];
    this.particles.push(new Particle(x + (Math.random() - 0.5) * 10, y + (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, col, 5, 0.5, 'cryo'));
  }

  emitRipple(x, y, color = '#00f0ff') {
    this.particles.push(new Particle(x, y, 0, 0, color, 10, 0.7, 'ripple'));
  }

  clear() {
    this.particles = [];
  }
}

// Movable Dynamic Entity
class PhysicsEntity {
  constructor(config) {
    this.id = config.id || Math.random().toString(36).substr(2, 9);
    this.name = config.name || 'Object';
    this.type = config.type || 'generic'; // 'shuttle', 'vehicle', 'spire', 'core_rod', 'power_cell', 'cryo_drone', 'debris'
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.vx = config.vx || 0;
    this.vy = config.vy || 0;
    this.width = config.width || 36;
    this.height = config.height || 28;
    this.radius = config.radius || Math.max(this.width, this.height) / 2;
    this.shape = config.shape || 'rect'; // 'rect' or 'circle'
    this.mass = config.mass || 1.0;
    this.color = config.color || '#00f0ff';
    this.glowColor = config.glowColor || 'rgba(0, 240, 255, 0.4)';
    this.icon = config.icon || '🚀';
    this.anchored = config.anchored || false; // Anchored buildings don't move
    this.isObjective = config.isObjective || false; // Target of active emergency
    this.targetZoneId = config.targetZoneId || null;
    this.emergencyId = config.emergencyId || null;
    this.dangerLevel = config.dangerLevel || 0; // High danger can cause severe accidents
    this.health = 100;
    this.maxHealth = 100;
    this.rotation = config.rotation || 0;
    this.targetRotation = 0;
    this.trailTimer = 0;
    this.collidedThisFrame = false;

    // Interactive Drag & Snap-Lock States
    this.isDragging = false;
    this.isLocked = false;
    this.snapProgress = 0;
    this.snapOrigin = null;
    this.snapTarget = null;
    this.glowAnim = Math.random() * 10;
  }

  getBounds() {
    return {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - this.height / 2,
      bottom: this.y + this.height / 2
    };
  }

  snapTo(targetX, targetY) {
    if (this.isLocked) return;
    this.snapOrigin = { x: this.x, y: this.y };
    this.snapTarget = { x: targetX, y: targetY };
    this.snapProgress = 0;
    this.isDragging = false;
    this.vx = 0;
    this.vy = 0;
  }

  update(dt, gravity, cityBounds, particleManager) {
    this.glowAnim += dt * 4;

    // 1. If locked in place, cannot drift
    if (this.isLocked) {
      this.vx = 0;
      this.vy = 0;
      return;
    }

    // 2. Snap Animation into socket
    if (this.snapTarget) {
      this.snapProgress += dt * 4.5;
      const t = Math.min(1.0, this.snapProgress);
      const ease = 1 - Math.pow(1 - t, 3);
      this.x = this.snapOrigin.x + (this.snapTarget.x - this.snapOrigin.x) * ease;
      this.y = this.snapOrigin.y + (this.snapTarget.y - this.snapOrigin.y) * ease;
      this.vx = 0;
      this.vy = 0;
      if (t >= 1.0) {
        this.x = this.snapTarget.x;
        this.y = this.snapTarget.y;
        this.isLocked = true;
        this.anchored = true;
        this.snapTarget = null;
        if (particleManager) {
          particleManager.emitRipple(this.x, this.y, '#00f0ff');
          particleManager.emit(this.x, this.y, 30, '#00ff88', 120, 3, 0.6, 'spark');
        }
      }
      return;
    }

    if (this.anchored) return;

    // 3. If user is dragging directly, position is driven by pointer
    if (this.isDragging) {
      this.trailTimer += dt;
      if (this.trailTimer > 0.06 && particleManager) {
        this.trailTimer = 0;
        particleManager.emit(this.x, this.y, 1, '#00f0ff', 20, 2.5, 0.3, 'spark');
      }
      return;
    }

    // 4. Normal anti-gravity physics
    const isZeroG = (gravity.x === 0 && gravity.y === 0);

    if (isZeroG) {
      // Powerful zero-G stasis braking so objects stop drifting cleanly!
      const brakeDamping = Math.pow(0.04, dt);
      this.vx *= brakeDamping;
      this.vy *= brakeDamping;
      if (Math.hypot(this.vx, this.vy) < 4) {
        this.vx = 0;
        this.vy = 0;
      }
    } else {
      const gravForce = 380; // Pixels per sec^2
      this.vx += gravity.x * gravForce * dt;
      this.vy += gravity.y * gravForce * dt;

      // Normal atmospheric damping
      const damping = Math.pow(0.85, dt);
      this.vx *= damping;
      this.vy *= damping;
    }

    // Maximum speed clamp
    const maxSpeed = 320;
    const currentSpeed = Math.hypot(this.vx, this.vy);
    if (currentSpeed > maxSpeed) {
      this.vx = (this.vx / currentSpeed) * maxSpeed;
      this.vy = (this.vy / currentSpeed) * maxSpeed;
    }

    // Update position
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Align rotation smoothly to velocity when moving
    if (currentSpeed > 20 && this.type !== 'spire' && this.type !== 'power_cell' && this.type !== 'core_rod') {
      this.targetRotation = Math.atan2(this.vy, this.vx);
      let diff = this.targetRotation - this.rotation;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.rotation += diff * 8 * dt;
    }

    // Emit light thruster trail when accelerating
    this.trailTimer += dt;
    if (this.trailTimer > 0.08 && currentSpeed > 40 && particleManager) {
      this.trailTimer = 0;
      const trailColor = this.isObjective ? '#ffaa00' : this.color;
      particleManager.emit(
        this.x - (this.vx / currentSpeed) * (this.width / 2),
        this.y - (this.vy / currentSpeed) * (this.height / 2),
        1,
        trailColor,
        25,
        2.5,
        0.3,
        'spark'
      );
    }

    // Perimeter boundary constraint (magnetic containment forcefield of floating city)
    const padding = Math.max(this.width, this.height) / 2 + 10;
    let hitBoundary = false;

    if (this.x < cityBounds.minX + padding) {
      this.x = cityBounds.minX + padding;
      this.vx = -this.vx * 0.5;
      hitBoundary = true;
    } else if (this.x > cityBounds.maxX - padding) {
      this.x = cityBounds.maxX - padding;
      this.vx = -this.vx * 0.5;
      hitBoundary = true;
    }

    if (this.y < cityBounds.minY + padding) {
      this.y = cityBounds.minY + padding;
      this.vy = -this.vy * 0.5;
      hitBoundary = true;
    } else if (this.y > cityBounds.maxY - padding) {
      this.y = cityBounds.maxY - padding;
      this.vy = -this.vy * 0.5;
      hitBoundary = true;
    }

    if (hitBoundary && currentSpeed > 80 && particleManager) {
      particleManager.emitCollision(this.x, this.y, '#00f0ff');
      if (window.soundManager) window.soundManager.playCollision(0.4);
    }

    this.collidedThisFrame = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Glowing aura if target objective
    if (this.isObjective) {
      const auraPulse = Math.sin(this.glowAnim) * 4 + 14;
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = auraPulse;
      ctx.strokeStyle = '#ffaa00';
      ctx.lineWidth = 2.5;
      if (this.shape === 'circle' || this.type === 'core_rod') {
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeRect(-this.width / 2 - 4, -this.height / 2 - 4, this.width + 8, this.height + 8);
      }
    }

    // Drag interaction highlight
    if (this.isDragging) {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Render based on shape / type
    if (this.type === 'core_rod') {
      // High-Tech Magnetic Stabilizer Rod
      const rw = 16;
      const rh = 46;

      // Outer metallic rod housing
      ctx.shadowColor = this.isLocked ? '#00ff88' : '#00f0ff';
      ctx.shadowBlur = this.isLocked ? 20 : 14;
      ctx.fillStyle = '#0a1626';
      ctx.strokeStyle = this.isLocked ? '#00ff88' : '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-rw / 2, -rh / 2, rw, rh, 6);
      ctx.fill();
      ctx.stroke();

      // Top and Bottom magnetic emitter caps
      ctx.fillStyle = this.isLocked ? '#00ff88' : '#ffaa00';
      ctx.fillRect(-rw / 2 + 2, -rh / 2 + 2, rw - 4, 6);
      ctx.fillRect(-rw / 2 + 2, rh / 2 - 8, rw - 4, 6);

      // Central glowing plasma energy conduit
      const corePulse = Math.sin(this.glowAnim * 2) * 0.2 + 0.8;
      ctx.fillStyle = this.isLocked ? `rgba(0, 255, 136, ${corePulse})` : `rgba(0, 240, 255, ${corePulse})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.isLocked ? '#00ff88' : '#00f0ff';
      ctx.fillRect(-3, -12, 6, 24);

      // Glowing center stabilizer orb
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.type === 'spire') {
      // Floating Tower / Residential Spire
      ctx.shadowColor = this.glowColor;
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#0e1d35';
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
      ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

      // Window grid lights
      ctx.fillStyle = this.color;
      const winSize = 4;
      for (let wx = -this.width / 2 + 6; wx < this.width / 2 - 4; wx += 8) {
        for (let wy = -this.height / 2 + 6; wy < this.height / 2 - 4; wy += 8) {
          ctx.fillRect(wx, wy, winSize, winSize);
        }
      }
    } else if (this.type === 'power_cell') {
      // Hexagonal / Pulsing Plasma Power Cell
      ctx.shadowColor = '#9d4edd';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#1c0e35';
      ctx.strokeStyle = '#c77dff';
      ctx.lineWidth = 3;
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
      ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

      // Plasma Core inside
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'cryo_drone') {
      // Cryo Fire Drone
      ctx.fillStyle = '#0d2238';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Drone propellers / rings
      ctx.strokeStyle = '#70d6ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Vehicles & Shuttles (Sleek aerodynamic hovercraft)
      ctx.shadowColor = this.glowColor;
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#0d1d33';
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;

      // Body shape
      ctx.beginPath();
      ctx.moveTo(this.width / 2, 0);
      ctx.lineTo(-this.width / 2 + 6, -this.height / 2);
      ctx.lineTo(-this.width / 2, 0);
      ctx.lineTo(-this.width / 2 + 6, this.height / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Windshield cockpit
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.ellipse(this.width / 6, 0, this.width / 6, this.height / 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Center icon/symbol
    ctx.shadowBlur = 0;
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.icon, 0, 0);

    ctx.restore();
  }
}

// Physics System Controller
class PhysicsSystem {
  constructor() {
    this.gravity = new Vec2(0, 0);
    this.currentDirection = 'NEUTRAL';
    this.particleManager = new ParticleManager();
    this.entities = [];

    // Pointer Drag System
    this.draggedEntity = null;
    this.dragOffset = { x: 0, y: 0 };
    this.lastPointerPos = { x: 0, y: 0 };

    // Screen Shake System
    this.shakeDuration = 0;
    this.shakeIntensity = 0;

    // Gravity Wave Ripples
    this.gravityWaves = [];
  }

  setGravity(dir, cityBounds) {
    this.currentDirection = dir;
    switch (dir) {
      case 'UP':
        this.gravity.set(0, -1);
        break;
      case 'DOWN':
        this.gravity.set(0, 1);
        break;
      case 'LEFT':
        this.gravity.set(-1, 0);
        break;
      case 'RIGHT':
        this.gravity.set(1, 0);
        break;
      case 'NEUTRAL':
      default:
        this.gravity.set(0, 0);
        break;
    }

    if (cityBounds) {
      this.triggerGravityWave(dir, cityBounds);
    }
  }

  triggerGravityWave(dir, bounds) {
    if (!bounds) return;
    const w = bounds.maxX - bounds.minX;
    const h = bounds.maxY - bounds.minY;
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;

    for (let i = 0; i < 3; i++) {
      this.gravityWaves.push({
        dir: dir,
        delay: i * 0.08,
        progress: -i * 0.08,
        speed: 1.8,
        cx: cx,
        cy: cy,
        bounds: bounds,
        color: dir === 'NEUTRAL' ? '#c77dff' : '#00f0ff'
      });
    }
  }

  triggerShake(intensity = 6, duration = 0.28) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  getShakeOffset() {
    if (this.shakeDuration <= 0) return { x: 0, y: 0 };
    const factor = this.shakeDuration / 0.28;
    return {
      x: (Math.random() - 0.5) * this.shakeIntensity * factor,
      y: (Math.random() - 0.5) * this.shakeIntensity * factor
    };
  }

  // Pointer & Touch Drag Handlers
  startDrag(x, y) {
    // Find closest movable entity (prioritizing active objectives)
    let bestEntity = null;
    let minD = Infinity;

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      if (e.anchored || e.isLocked || e.snapTarget) continue;

      const d = Math.hypot(e.x - x, e.y - y);
      const grabRadius = Math.max(e.radius, 28) + 18;

      if (d <= grabRadius) {
        if (e.isObjective) {
          bestEntity = e;
          break;
        } else if (d < minD) {
          minD = d;
          bestEntity = e;
        }
      }
    }

    if (bestEntity) {
      this.draggedEntity = bestEntity;
      bestEntity.isDragging = true;
      this.dragOffset = { x: bestEntity.x - x, y: bestEntity.y - y };
      this.lastPointerPos = { x, y };
      return bestEntity;
    }

    return null;
  }

  updateDrag(x, y, dt, cityBounds) {
    if (!this.draggedEntity) return;

    const e = this.draggedEntity;
    const padding = Math.max(e.width, e.height) / 2 + 10;

    let targetX = x + this.dragOffset.x;
    let targetY = y + this.dragOffset.y;

    if (cityBounds) {
      targetX = Math.max(cityBounds.minX + padding, Math.min(cityBounds.maxX - padding, targetX));
      targetY = Math.max(cityBounds.minY + padding, Math.min(cityBounds.maxY - padding, targetY));
    }

    // Smooth lerp to follow touch / mouse
    const lerpSpeed = Math.min(1.0, 30 * dt);
    e.x += (targetX - e.x) * lerpSpeed;
    e.y += (targetY - e.y) * lerpSpeed;

    if (dt > 0.001) {
      e.vx = (x - this.lastPointerPos.x) / dt * 0.6;
      e.vy = (y - this.lastPointerPos.y) / dt * 0.6;
    }
    this.lastPointerPos = { x, y };
  }

  endDrag() {
    if (this.draggedEntity) {
      this.draggedEntity.isDragging = false;
      // Clamp velocity to prevent wild flinging
      const spd = Math.hypot(this.draggedEntity.vx, this.draggedEntity.vy);
      if (spd > 300) {
        this.draggedEntity.vx = (this.draggedEntity.vx / spd) * 300;
        this.draggedEntity.vy = (this.draggedEntity.vy / spd) * 300;
      }
      this.draggedEntity = null;
    }
  }

  addEntity(entity) {
    this.entities.push(entity);
  }

  removeEntity(id) {
    this.entities = this.entities.filter(e => e.id !== id);
  }

  clear() {
    this.entities = [];
    this.gravityWaves = [];
    this.draggedEntity = null;
    this.particleManager.clear();
  }

  update(dt, cityBounds, onCollision) {
    // 1. Update entities
    for (const entity of this.entities) {
      entity.update(dt, this.gravity, cityBounds, this.particleManager);
    }

    // 2. Pairwise collision detection & response
    const n = this.entities.length;
    for (let i = 0; i < n; i++) {
      const a = this.entities[i];
      for (let j = i + 1; j < n; j++) {
        const b = this.entities[j];

        // Skip if both are anchored
        if (a.anchored && b.anchored) continue;

        // Collision check
        const dist = Vec2.dist(a, b);
        const minDist = a.radius + b.radius;

        if (dist < minDist && dist > 0.0001) {
          // Collision Normal
          const nx = (b.x - a.x) / dist;
          const ny = (b.y - a.y) / dist;

          // Overlap resolution
          const overlap = minDist - dist;
          const totalMass = a.mass + b.mass;

          if (!a.anchored && !b.anchored) {
            a.x -= nx * overlap * (b.mass / totalMass);
            a.y -= ny * overlap * (b.mass / totalMass);
            b.x += nx * overlap * (a.mass / totalMass);
            b.y += ny * overlap * (a.mass / totalMass);
          } else if (!a.anchored && b.anchored) {
            a.x -= nx * overlap;
            a.y -= ny * overlap;
          } else if (a.anchored && !b.anchored) {
            b.x += nx * overlap;
            b.y += ny * overlap;
          }

          // Relative velocity along normal
          const kx = a.vx - b.vx;
          const ky = a.vy - b.vy;
          const p = 2 * (nx * kx + ny * ky) / totalMass;

          // Restitution (bounciness)
          const restitution = 0.65;
          const impulse = p * (1 + restitution);

          if (!a.anchored) {
            a.vx -= impulse * b.mass * nx;
            a.vy -= impulse * b.mass * ny;
          }
          if (!b.anchored) {
            b.vx += impulse * a.mass * nx;
            b.vy += impulse * a.mass * ny;
          }

          // Collision Impact effects
          const impactSpeed = Math.hypot(kx, ky);
          if (impactSpeed > 40) {
            const cx = (a.x + b.x) / 2;
            const cy = (a.y + b.y) / 2;
            this.particleManager.emitCollision(cx, cy, '#ff5500');

            if (window.soundManager) {
              window.soundManager.playCollision(Math.min(1.0, impactSpeed / 180));
            }

            // Callback for game logic (consequence penalty, accident tracking)
            if (onCollision && !a.collidedThisFrame && !b.collidedThisFrame) {
              a.collidedThisFrame = true;
              b.collidedThisFrame = true;
              onCollision(a, b, impactSpeed);
            }
          }
        }
      }
    }

    // 3. Update screen shake
    if (this.shakeDuration > 0) {
      this.shakeDuration = Math.max(0, this.shakeDuration - dt);
    }

    // 4. Update gravity waves
    for (let i = this.gravityWaves.length - 1; i >= 0; i--) {
      const w = this.gravityWaves[i];
      w.progress += dt * w.speed;
      if (w.progress > 1.2) {
        this.gravityWaves.splice(i, 1);
      }
    }

    // 5. Update particles
    this.particleManager.update(dt);
  }

  drawGravityWaves(ctx) {
    for (const w of this.gravityWaves) {
      if (w.progress < 0) continue;
      const alpha = Math.max(0, 1 - w.progress);
      ctx.save();
      ctx.strokeStyle = w.color;
      ctx.globalAlpha = alpha * 0.45;
      ctx.lineWidth = 3;
      ctx.shadowColor = w.color;
      ctx.shadowBlur = 12;

      const b = w.bounds;
      const spanX = b.maxX - b.minX;
      const spanY = b.maxY - b.minY;

      if (w.dir === 'UP') {
        const y = b.maxY - w.progress * spanY;
        ctx.beginPath();
        ctx.moveTo(b.minX, y);
        ctx.lineTo(b.maxX, y);
        ctx.stroke();
      } else if (w.dir === 'DOWN') {
        const y = b.minY + w.progress * spanY;
        ctx.beginPath();
        ctx.moveTo(b.minX, y);
        ctx.lineTo(b.maxX, y);
        ctx.stroke();
      } else if (w.dir === 'LEFT') {
        const x = b.maxX - w.progress * spanX;
        ctx.beginPath();
        ctx.moveTo(x, b.minY);
        ctx.lineTo(x, b.maxY);
        ctx.stroke();
      } else if (w.dir === 'RIGHT') {
        const x = b.minX + w.progress * spanX;
        ctx.beginPath();
        ctx.moveTo(x, b.minY);
        ctx.lineTo(x, b.maxY);
        ctx.stroke();
      } else {
        // Zero-G concentric expanding ring
        const rad = w.progress * Math.min(spanX, spanY) * 0.6;
        ctx.beginPath();
        ctx.arc(w.cx, w.cy, Math.max(5, rad), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  draw(ctx) {
    this.drawGravityWaves(ctx);
    for (const entity of this.entities) {
      entity.draw(ctx);
    }
    this.particleManager.draw(ctx);
  }
}

// Global physics engine instance
window.physicsEngine = new PhysicsSystem();
