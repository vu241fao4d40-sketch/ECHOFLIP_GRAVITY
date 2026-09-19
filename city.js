/**
 * ECHOCORE: ANTI-GRAVITY - City Renderer & World Generator
 * Renders the floating sci-fi metropolis of Neo-Aethel, space background,
 * magnetic skyways, city sectors, and target landing zones.
 */

class CityManager {
  constructor() {
    this.stars = [];
    this.distantBuildings = [];
    this.distantTraffic = [];
    this.spaceMotes = [];
    this.zones = [];
    this.cityBounds = { minX: 50, maxX: 950, minY: 50, maxY: 650 };
    this.animTime = 0;
    this.gridOffset = { x: 0, y: 0 };
    this.fireZoneActive = false;
    this.fireLocation = { x: 0, y: 0, radius: 40 };

    // Tutorial spotlight & visual guidance properties
    this.tutorialActive = false;
    this.tutorialStep = 0;
    this.tutorialTargetZoneId = null;
    this.tutorialObjectiveId = null;
  }

  init(width, height) {
    this.updateBounds(width, height);
    this.initStars(width, height);
    this.initDistantCity(width, height);
    this.initTraffic(width, height);
    this.initMotes(width, height);
    this.setupZones();
  }

  updateBounds(width, height) {
    // Keep safety margin for floating platforms & HUD
    const padX = Math.max(30, width * 0.05);
    const padY = Math.max(40, height * 0.08);
    this.cityBounds = {
      minX: padX,
      maxX: width - padX,
      minY: padY + 40, // Top HUD clearance
      maxY: height - padY - 70 // Bottom controls clearance
    };
  }

  initStars(width, height) {
    this.stars = [];
    const count = Math.floor((width * height) / 3500);
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.0 + 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 2.5 + 1.2,
        color: Math.random() > 0.3 ? '#e2f1ff' : (Math.random() > 0.5 ? '#00f0ff' : '#c77dff'),
        layer: Math.random() > 0.6 ? 2 : 1
      });
    }
  }

  initDistantCity(width, height) {
    this.distantBuildings = [];
    const count = Math.max(12, Math.floor(width / 65));
    const baseWidth = width / count;

    for (let i = 0; i < count; i++) {
      const bHeight = 80 + Math.random() * (height * 0.38);
      this.distantBuildings.push({
        x: i * baseWidth + (Math.random() - 0.5) * 15,
        y: height - bHeight + 40,
        width: baseWidth * (0.65 + Math.random() * 0.45),
        height: bHeight,
        color: Math.random() > 0.5 ? '#091322' : '#070f1a',
        beaconColor: Math.random() > 0.5 ? '#ff2a55' : '#00f0ff',
        beaconBlink: Math.random() * 2 + 1,
        windows: Math.floor(Math.random() * 14) + 4,
        hasAntenna: Math.random() > 0.3
      });
    }
  }

  initTraffic(width, height) {
    this.distantTraffic = [];
    for (let i = 0; i < 6; i++) {
      this.distantTraffic.push({
        x: Math.random() * width,
        y: height * 0.15 + Math.random() * (height * 0.55),
        vx: (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 35),
        color: Math.random() > 0.5 ? '#00f0ff' : '#ffaa00',
        size: 3 + Math.random() * 2.5
      });
    }
  }

  initMotes(width, height) {
    this.spaceMotes = [];
    for (let i = 0; i < 28; i++) {
      this.spaceMotes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        size: 1.2 + Math.random() * 2.0,
        alpha: 0.2 + Math.random() * 0.5,
        color: Math.random() > 0.5 ? '#00f0ff' : '#ffaa00'
      });
    }
  }

  setupZones() {
    const b = this.cityBounds;
    const w = b.maxX - b.minX;
    const h = b.maxY - b.minY;
    const cx = b.minX + w / 2;
    const cy = b.minY + h / 2;

    this.zones = [
      // 1. Central Gravity Core
      {
        id: 'gravity_core',
        name: 'GRAVITY CORE',
        x: cx,
        y: cy,
        width: 130,
        height: 130,
        type: 'core',
        color: '#00f0ff',
        icon: '⚛️',
        label: 'GRAVITY CORE'
      },
      // 2. Hospital Bay (Medical District - Top Right)
      {
        id: 'hospital_bay',
        name: 'MEDICAL CENTER',
        x: b.maxX - w * 0.2,
        y: b.minY + h * 0.22,
        width: 140,
        height: 100,
        type: 'hospital',
        color: '#00ff88',
        icon: '🏥',
        label: 'HOSPITAL DOCK'
      },
      // 3. Power Grid Hub (Top Left)
      {
        id: 'power_hub',
        name: 'POWER GRID BAY',
        x: b.minX + w * 0.2,
        y: b.minY + h * 0.22,
        width: 130,
        height: 100,
        type: 'power',
        color: '#9d4edd',
        icon: '⚡',
        label: 'POWER GENERATOR'
      },
      // 4. Magnetic Anchor Dock (Bottom Right)
      {
        id: 'anchor_dock',
        name: 'SPIRE ANCHOR',
        x: b.maxX - w * 0.22,
        y: b.maxY - h * 0.22,
        width: 150,
        height: 110,
        type: 'anchor',
        color: '#00f0ff',
        icon: '⚓',
        label: 'MAGNETIC DOCK'
      },
      // 5. Cargo & Transit Depot (Bottom Left)
      {
        id: 'transit_depot',
        name: 'TRANSIT CORRIDOR',
        x: b.minX + w * 0.22,
        y: b.maxY - h * 0.22,
        width: 150,
        height: 110,
        type: 'transit',
        color: '#ffaa00',
        icon: '🚊',
        label: 'SAFETY LANE'
      },
      // 6. Industrial Sector (Fire Outbreak Zone - Mid Center Right)
      {
        id: 'industrial_sector',
        name: 'REFINERY SECTOR',
        x: cx + w * 0.32,
        y: cy,
        width: 110,
        height: 90,
        type: 'industrial',
        color: '#ff5500',
        icon: '🏭',
        label: 'REFINERY'
      }
    ];
  }

  getZone(id) {
    return this.zones.find(z => z.id === id);
  }

  setFireZone(active, x, y, radius = 50) {
    this.fireZoneActive = active;
    this.fireLocation = { x, y, radius };
  }

  update(dt, gravityDir, particleManager) {
    this.animTime += dt;

    // Shift gravity flow grid lines according to active gravity
    const flowSpeed = 60;
    if (gravityDir === 'UP') this.gridOffset.y -= flowSpeed * dt;
    else if (gravityDir === 'DOWN') this.gridOffset.y += flowSpeed * dt;
    else if (gravityDir === 'LEFT') this.gridOffset.x -= flowSpeed * dt;
    else if (gravityDir === 'RIGHT') this.gridOffset.x += flowSpeed * dt;

    // Wrap grid offset
    this.gridOffset.x = (this.gridOffset.x % 40 + 40) % 40;
    this.gridOffset.y = (this.gridOffset.y % 40 + 40) % 40;

    // Emit fire particles if fire emergency is active
    if (this.fireZoneActive && particleManager) {
      for (let i = 0; i < 2; i++) {
        particleManager.emitFire(this.fireLocation.x, this.fireLocation.y);
      }
    }
  }

  draw(ctx, width, height, activeEmergency) {
    // 1. Deep Space & Stars
    this.drawSpaceBackground(ctx, width, height);

    // 2. Gravitational Flux Grid
    this.drawGravityGrid(ctx, width, height);

    // 3. City Perimeter Forcefield Barrier (hidden during gameplay)
    // this.drawCityPerimeter(ctx);

    // 4. Skyway Magnetic Conduits
    this.drawSkywayConduits(ctx);

    // 5. Floating Districts & Anchor Zones
    this.drawZones(ctx, activeEmergency);

    // 6. Active Fire Outbreak Zone Highlight
    if (this.fireZoneActive) {
      this.drawFireZone(ctx);
    }

    // 7. Dynamic Visual Guidance Arrows & Beacons (Interactive Tutorial / Objectives)
    if (activeEmergency) {
      this.drawGuidanceArrows(ctx, activeEmergency);
    }
  }

  drawSpaceBackground(ctx, width, height) {
    // 1. Deep Space Nebula Gradient
    const bgGrad = ctx.createRadialGradient(width * 0.5, height * 0.45, 50, width * 0.5, height * 0.5, Math.max(width, height) * 0.75);
    bgGrad.addColorStop(0, '#0e1d35');
    bgGrad.addColorStop(0.5, '#081020');
    bgGrad.addColorStop(1, '#03050a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Parallax Layer 1 (Far Stars & Nebulae)
    for (const star of this.stars) {
      const alpha = star.alpha * (0.5 + 0.5 * Math.sin(this.animTime * star.twinkleSpeed));
      ctx.fillStyle = star.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Distant Metropolis Skyline (Sci-Fi Floating Skyscrapers)
    ctx.save();
    for (const b of this.distantBuildings) {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.width, b.height);

      // Antenna beacon
      if (b.hasAntenna) {
        ctx.strokeStyle = '#0f243d';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(b.x + b.width / 2, b.y);
        ctx.lineTo(b.x + b.width / 2, b.y - 18);
        ctx.stroke();

        const blink = Math.sin(this.animTime * b.beaconBlink * 3) > 0.2;
        if (blink) {
          ctx.fillStyle = b.beaconColor;
          ctx.shadowColor = b.beaconColor;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(b.x + b.width / 2, b.y - 18, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Lit windows
      ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
      const winRows = Math.min(6, Math.floor(b.height / 14));
      const winCols = Math.min(4, Math.floor(b.width / 12));
      for (let r = 0; r < winRows; r++) {
        for (let c = 0; c < winCols; c++) {
          if ((r + c + Math.floor(b.x)) % 3 === 0) {
            ctx.fillRect(b.x + 5 + c * 10, b.y + 12 + r * 12, 4, 4);
          }
        }
      }
    }
    ctx.restore();

    // 4. Distant Sky-Highway Traffic
    for (const t of this.distantTraffic) {
      t.x += t.vx * 0.016;
      if (t.x < -40) t.x = width + 30;
      if (t.x > width + 40) t.x = -30;

      ctx.save();
      ctx.fillStyle = t.color;
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
      ctx.fill();

      // Tail trail
      ctx.strokeStyle = t.color;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.lineTo(t.x - (t.vx > 0 ? 18 : -18), t.y);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Floating Energy Dust Motes
    for (const m of this.spaceMotes) {
      m.x += m.vx * 0.016;
      m.y += m.vy * 0.016;
      if (m.x < 0) m.x = width;
      if (m.x > width) m.x = 0;
      if (m.y < 0) m.y = height;
      if (m.y > height) m.y = 0;

      ctx.fillStyle = m.color;
      ctx.globalAlpha = m.alpha * (0.6 + 0.4 * Math.sin(this.animTime + m.size));
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  drawGravityGrid(ctx, width, height) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    ctx.lineWidth = 1;

    const spacing = 45;
    const startX = this.gridOffset.x % spacing;
    const startY = this.gridOffset.y % spacing;

    ctx.beginPath();
    for (let x = startX; x < width; x += spacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = startY; y < height; y += spacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  drawCityPerimeter(ctx) {
    const b = this.cityBounds;
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 8]);
    ctx.strokeRect(b.minX, b.minY, b.maxX - b.minX, b.maxY - b.minY);

    // Corner brackets
    const bracketSize = 16;
    ctx.setLineDash([]);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(b.minX, b.minY + bracketSize);
    ctx.lineTo(b.minX, b.minY);
    ctx.lineTo(b.minX + bracketSize, b.minY);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(b.maxX, b.minY + bracketSize);
    ctx.lineTo(b.maxX, b.minY);
    ctx.lineTo(b.maxX - bracketSize, b.minY);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(b.minX, b.maxY - bracketSize);
    ctx.lineTo(b.minX, b.maxY);
    ctx.lineTo(b.minX + bracketSize, b.maxY);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(b.maxX, b.maxY - bracketSize);
    ctx.lineTo(b.maxX, b.maxY);
    ctx.lineTo(b.maxX - bracketSize, b.maxY);
    ctx.stroke();

    ctx.restore();
  }

  drawSkywayConduits(ctx) {
    const b = this.cityBounds;
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.18)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 12]);

    // Concentric orbital rings around Core
    ctx.beginPath();
    ctx.arc(cx, cy, 175, 0, Math.PI * 2);
    ctx.arc(cx, cy, 310, 0, Math.PI * 2);
    ctx.stroke();

    // Energy arterial conduits connecting zones
    ctx.setLineDash([4, 16]);
    ctx.strokeStyle = 'rgba(157, 78, 221, 0.22)';
    for (const zone of this.zones) {
      if (zone.id === 'gravity_core') continue;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(zone.x, zone.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  // --- RECOGNIZABLE SCI-FI VISUAL OBJECTS (REPLACING TEXT BOXES) ---

  drawZones(ctx, activeEmergency) {
    for (const zone of this.zones) {
      const isTarget = activeEmergency && activeEmergency.targetZoneId === zone.id;

      ctx.save();
      ctx.translate(zone.x, zone.y);

      switch (zone.type) {
        case 'core':
          this.drawCoreZone(ctx, zone, isTarget);
          break;
        case 'hospital':
          this.drawHospitalZone(ctx, zone, isTarget);
          break;
        case 'power':
          this.drawPowerZone(ctx, zone, isTarget);
          break;
        case 'industrial':
          this.drawRefineryZone(ctx, zone, isTarget);
          break;
        case 'transit':
          this.drawSafetyZone(ctx, zone, isTarget);
          break;
        case 'anchor':
          this.drawMagneticDockZone(ctx, zone, isTarget);
          break;
      }

      ctx.restore();
    }
  }

  // 1. Central Gravity Core
  drawCoreZone(ctx, zone, isTarget) {
    const t = this.animTime;
    const pulse = 1 + 0.08 * Math.sin(t * 4);

    // Target aura
    if (isTarget) {
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 24 + 8 * Math.sin(t * 6);
      ctx.strokeStyle = 'rgba(255, 170, 0, 0.8)';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, 58 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Outer Gyroscope Ring (Rotates Clockwise)
    ctx.save();
    ctx.rotate(t * 0.8);
    ctx.strokeStyle = isTarget ? '#ffaa00' : '#00f0ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.stroke();

    // Gyro Node Beacons
    for (let a = 0; a < 4; a++) {
      const angle = (a * Math.PI) / 2;
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * 48, Math.sin(angle) * 48, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Inner Gyroscope Ring (Rotates Counter-Clockwise)
    ctx.save();
    ctx.rotate(-t * 1.2);
    ctx.strokeStyle = '#9d4edd';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.stroke();
    for (let a = 0; a < 3; a++) {
      const angle = (a * Math.PI * 2) / 3;
      ctx.fillStyle = '#c77dff';
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * 36, Math.sin(angle) * 36, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Central Stabilizer Dock Socket (Receives the Stabilizer Rod!)
    ctx.fillStyle = '#081424';
    ctx.strokeStyle = isTarget ? '#ffaa00' : '#00f0ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-14, -26, 28, 52, 6);
    ctx.fill();
    ctx.stroke();

    // Glowing core reactor plasma
    const coreGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 16);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.5, '#00f0ff');
    coreGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 16 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Center Crosshair / Socket indicator
    ctx.strokeStyle = isTarget ? '#ffaa00' : '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-8, 0); ctx.lineTo(8, 0);
    ctx.moveTo(0, -10); ctx.lineTo(0, 10);
    ctx.stroke();

    // Sleek Subtitle Label
    ctx.fillStyle = isTarget ? '#ffaa00' : '#cde4ff';
    ctx.font = 'bold 9px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GRAVITY CORE', 0, 68);
  }

  // 2. Futuristic Hospital Bay
  drawHospitalZone(ctx, zone, isTarget) {
    const t = this.animTime;

    // Platform Base
    ctx.fillStyle = 'rgba(10, 28, 24, 0.85)';
    ctx.strokeStyle = isTarget ? '#ffaa00' : '#00ff88';
    ctx.lineWidth = isTarget ? 3 : 1.5;
    if (isTarget) {
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 18;
    }
    ctx.beginPath();
    ctx.roundRect(-zone.width / 2, -zone.height / 2, zone.width, zone.height, 12);
    ctx.fill();
    ctx.stroke();

    // Main Hospital Structure
    ctx.fillStyle = '#0f3228';
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-42, -26, 40, 48, 8);
    ctx.fill();
    ctx.stroke();

    // Hospital Glass Bio-Dome
    ctx.fillStyle = 'rgba(0, 255, 136, 0.35)';
    ctx.beginPath();
    ctx.arc(-22, -26, 14, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    // Glowing Red/White Medical Cross
    ctx.fillStyle = '#ff2a55';
    ctx.shadowColor = '#ff2a55';
    ctx.shadowBlur = 8;
    ctx.fillRect(-26, -18, 8, 22);
    ctx.fillRect(-33, -11, 22, 8);
    ctx.shadowBlur = 0;

    // Trauma Helipad Landing Ring [ H ]
    ctx.strokeStyle = isTarget ? '#ffaa00' : 'rgba(0, 255, 136, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(24, 0, 20, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = 'bold 16px Rajdhani, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('H', 24, 6);

    // Strobe lights around Helipad
    const blink = Math.sin(t * 6) > 0;
    ctx.fillStyle = blink ? '#ffaa00' : '#334433';
    [-1, 1].forEach(side => {
      ctx.beginPath();
      ctx.arc(24 + side * 18, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Sleek Subtitle
    ctx.fillStyle = isTarget ? '#ffaa00' : '#cde4ff';
    ctx.font = 'bold 9px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOSPITAL DOCK', 0, zone.height / 2 + 14);
  }

  // 3. Power Grid Generator
  drawPowerZone(ctx, zone, isTarget) {
    const t = this.animTime;

    // Platform Base
    ctx.fillStyle = 'rgba(22, 12, 36, 0.85)';
    ctx.strokeStyle = isTarget ? '#ffaa00' : '#9d4edd';
    ctx.lineWidth = isTarget ? 3 : 1.5;
    if (isTarget) {
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 18;
    }
    ctx.beginPath();
    ctx.roundRect(-zone.width / 2, -zone.height / 2, zone.width, zone.height, 12);
    ctx.fill();
    ctx.stroke();

    // Power Generator Reactor Complex
    ctx.fillStyle = '#1c0c32';
    ctx.strokeStyle = '#c77dff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-30, -22, 60, 44, 8);
    ctx.fill();
    ctx.stroke();

    // Cooling Fin Vents
    ctx.strokeStyle = 'rgba(199, 125, 255, 0.4)';
    ctx.lineWidth = 1.5;
    for (let x = -20; x <= 20; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, -22); ctx.lineTo(x, -14);
      ctx.moveTo(x, 14); ctx.lineTo(x, 22);
      ctx.stroke();
    }

    // Dual Tesla Coils with Electrical Lightning Arc!
    const coilY = 0;
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.arc(-22, coilY, 5, 0, Math.PI * 2);
    ctx.arc(22, coilY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Animated Electric Arc
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-22, coilY);
    const midX = (Math.random() - 0.5) * 14;
    const midY = coilY + (Math.random() - 0.5) * 14;
    ctx.lineTo(midX, midY);
    ctx.lineTo(22, coilY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Glowing Central Plasma Chamber
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    // Sleek Subtitle
    ctx.fillStyle = isTarget ? '#ffaa00' : '#cde4ff';
    ctx.font = 'bold 9px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('POWER GENERATOR', 0, zone.height / 2 + 14);
  }

  // 4. Industrial Refinery
  drawRefineryZone(ctx, zone, isTarget) {
    const t = this.animTime;

    // Platform Base
    ctx.fillStyle = 'rgba(32, 16, 12, 0.85)';
    ctx.strokeStyle = isTarget ? '#ffaa00' : '#ff5500';
    ctx.lineWidth = isTarget ? 3 : 1.5;
    if (isTarget) {
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 18;
    }
    ctx.beginPath();
    ctx.roundRect(-zone.width / 2, -zone.height / 2, zone.width, zone.height, 10);
    ctx.fill();
    ctx.stroke();

    // Industrial Storage Tanks
    ctx.fillStyle = '#2d1810';
    ctx.strokeStyle = '#ff7700';
    ctx.lineWidth = 2;
    [-22, 14].forEach(x => {
      ctx.beginPath();
      ctx.roundRect(x, -22, 18, 38, 6);
      ctx.fill();
      ctx.stroke();

      // Hazard Stripes on Tank
      ctx.strokeStyle = 'rgba(255, 170, 0, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 2, -6); ctx.lineTo(x + 16, -6);
      ctx.stroke();
    });

    // Metallic Pipe Conduit Network connecting tanks
    ctx.strokeStyle = '#8fa0b5';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-4, -14);
    ctx.lineTo(14, -14);
    ctx.moveTo(-4, 4);
    ctx.lineTo(14, 4);
    ctx.stroke();

    // Pressure Meter Dial
    ctx.fillStyle = '#0a1018';
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(5, -14, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Needle on Dial
    const needleAngle = Math.sin(t * 3) * 0.8;
    ctx.strokeStyle = '#ff2a55';
    ctx.beginPath();
    ctx.moveTo(5, -14);
    ctx.lineTo(5 + Math.cos(needleAngle) * 4, -14 + Math.sin(needleAngle) * 4);
    ctx.stroke();

    // Smoke / Steam venting from top pipe
    const puff = (t * 20) % 15;
    ctx.fillStyle = 'rgba(255, 150, 50, 0.3)';
    ctx.beginPath();
    ctx.arc(-13, -28 - puff, 4 + puff * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Sleek Subtitle
    ctx.fillStyle = isTarget ? '#ffaa00' : '#cde4ff';
    ctx.font = 'bold 9px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('REFINERY', 0, zone.height / 2 + 14);
  }

  // 5. Safety Zone / Transit Corridor
  drawSafetyZone(ctx, zone, isTarget) {
    const t = this.animTime;

    // Platform Base
    ctx.fillStyle = 'rgba(12, 24, 38, 0.85)';
    ctx.strokeStyle = isTarget ? '#ffaa00' : '#ffaa00';
    ctx.lineWidth = isTarget ? 3 : 1.5;
    if (isTarget) {
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 18;
    }
    ctx.beginPath();
    ctx.roundRect(-zone.width / 2, -zone.height / 2, zone.width, zone.height, 10);
    ctx.fill();
    ctx.stroke();

    // Holographic Shield Forcefield Dome
    ctx.save();
    const shieldPulse = Math.sin(t * 3) * 0.15 + 0.85;
    ctx.strokeStyle = 'rgba(255, 170, 0, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 32 * shieldPulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Shield Emblem Icon
    ctx.fillStyle = 'rgba(255, 170, 0, 0.15)';
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(16, -8);
    ctx.lineTo(16, 8);
    ctx.lineTo(0, 20);
    ctx.lineTo(-16, 8);
    ctx.lineTo(-16, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Transit Safe Corridor Entry Chevrons
    ctx.fillStyle = '#ffaa00';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🛡️', 0, 5);

    // Sleek Subtitle
    ctx.fillStyle = isTarget ? '#ffaa00' : '#cde4ff';
    ctx.font = 'bold 9px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SAFETY ZONE', 0, zone.height / 2 + 14);
  }

  // 6. Magnetic Dock
  drawMagneticDockZone(ctx, zone, isTarget) {
    const t = this.animTime;

    // Platform Base
    ctx.fillStyle = 'rgba(10, 20, 36, 0.85)';
    ctx.strokeStyle = isTarget ? '#ffaa00' : '#00f0ff';
    ctx.lineWidth = isTarget ? 3 : 1.5;
    if (isTarget) {
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 18;
    }
    ctx.beginPath();
    ctx.roundRect(-zone.width / 2, -zone.height / 2, zone.width, zone.height, 10);
    ctx.fill();
    ctx.stroke();

    // Dual High-Tech Magnetic Clamp Arms
    [-28, 28].forEach(x => {
      ctx.fillStyle = '#0c1a2e';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x - 8, -24, 16, 48, 6);
      ctx.fill();
      ctx.stroke();

      // Magnetic Coils along clamps
      ctx.fillStyle = '#ffaa00';
      [-12, 0, 12].forEach(y => {
        ctx.fillRect(x - 6, y - 2, 12, 4);
      });
    });

    // Magnetic Confinement Rings
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Central Docking Anchor Core
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Sleek Subtitle
    ctx.fillStyle = isTarget ? '#ffaa00' : '#cde4ff';
    ctx.font = 'bold 9px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MAGNETIC DOCK', 0, zone.height / 2 + 14);
  }

  drawFireZone(ctx) {
    ctx.save();
    ctx.translate(this.fireLocation.x, this.fireLocation.y);

    const pulse = 1.0 + 0.15 * Math.sin(this.animTime * 8);
    const rad = this.fireLocation.radius * pulse;

    const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, rad);
    grad.addColorStop(0, 'rgba(255, 50, 0, 0.65)');
    grad.addColorStop(0.5, 'rgba(255, 120, 0, 0.35)');
    grad.addColorStop(1, 'rgba(255, 50, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 60, 0, 0.85)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, rad * 0.8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // Subway Surfers Style Visual Guidance & Spotlight
  drawGuidanceArrows(ctx, activeEmergency) {
    const physics = window.physicsEngine;
    if (!physics) return;

    const obj = physics.entities.find(e => e.id === activeEmergency.objectiveEntityId);
    const target = this.getZone(activeEmergency.targetZoneId);
    if (!obj || !target) return;

    ctx.save();

    // 1. First-Time Player Visual Tutorial Spotlight
    if (activeEmergency.isTraining || this.tutorialActive) {
      this.drawTutorialSpotlight(ctx, obj, target);
    }

    // 2. Trajectory guide line
    const dx = target.x - obj.x;
    const dy = target.y - obj.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 30) {
      const isTraining = activeEmergency.isTraining || this.tutorialActive;
      ctx.strokeStyle = isTraining ? 'rgba(255, 170, 0, 0.9)' : 'rgba(0, 240, 255, 0.7)';
      ctx.lineWidth = isTraining ? 4 : 2;
      ctx.setLineDash([12, 8]);
      ctx.lineDashOffset = -this.animTime * 50;

      ctx.beginPath();
      ctx.moveTo(obj.x, obj.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Flowing arrow
      const tProgress = (this.animTime * 0.9) % 1.0;
      const arrowX = obj.x + dx * tProgress;
      const arrowY = obj.y + dy * tProgress;
      const angle = Math.atan2(dy, dx);

      ctx.save();
      ctx.translate(arrowX, arrowY);
      ctx.rotate(angle);
      ctx.fillStyle = '#ffaa00';
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-8, -9);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-8, 9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 3. Highlight Moving Object
    const pulse = 1 + 0.18 * Math.sin(this.animTime * 6);
    ctx.save();
    ctx.translate(obj.x, obj.y);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(0, 0, (obj.radius + 14) * pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = 'bold 11px Rajdhani, sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.textAlign = 'center';
    ctx.fillText('▲ DRAG OR STEER', 0, -obj.radius - 20);
    ctx.restore();

    // 4. Highlight Target Zone
    ctx.save();
    ctx.translate(target.x, target.y);
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 18;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, 52 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = 'bold 12px Rajdhani, sans-serif';
    ctx.fillStyle = '#ffaa00';
    ctx.textAlign = 'center';
    ctx.fillText('▼ TARGET ZONE ▼', 0, -60);
    ctx.restore();

    ctx.restore();
  }

  // Subway Surfers Style Visual Tutorial Spotlight
  drawTutorialSpotlight(ctx, obj, target) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    ctx.save();
    // Semi-darken the background
    ctx.fillStyle = 'rgba(3, 7, 16, 0.65)';
    ctx.fillRect(0, 0, width, height);

    // Spotlight Cutout over Object
    ctx.globalCompositeOperation = 'destination-out';
    const objCutout = ctx.createRadialGradient(obj.x, obj.y, obj.radius * 0.5, obj.x, obj.y, obj.radius + 50);
    objCutout.addColorStop(0, 'rgba(0, 0, 0, 1)');
    objCutout.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = objCutout;
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, obj.radius + 50, 0, Math.PI * 2);
    ctx.fill();

    // Spotlight Cutout over Target
    const tgtCutout = ctx.createRadialGradient(target.x, target.y, 25, target.x, target.y, 80);
    tgtCutout.addColorStop(0, 'rgba(0, 0, 0, 1)');
    tgtCutout.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = tgtCutout;
    ctx.beginPath();
    ctx.arc(target.x, target.y, 80, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';

    // Animated Tutorial Gesture Finger / Cursor
    const gestureT = (this.animTime * 0.7) % 1.0;
    const fingerX = obj.x + (target.x - obj.x) * gestureT;
    const fingerY = obj.y + (target.y - obj.y) * gestureT;

    ctx.save();
    ctx.translate(fingerX, fingerY);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 16 * (0.8 + 0.2 * Math.sin(this.animTime * 8)), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }
}

// Global city manager instance
window.cityManager = new CityManager();
