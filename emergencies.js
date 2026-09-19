/**
 * ECHOCORE: ANTI-GRAVITY - Emergency System & Consequence Manager
 * Upgraded with:
 * - Level 0: Training Mission (Practice mode, 60s, guided arrows)
 * - Level 1: 90s per emergency
 * - Level 2: 75s per emergency
 * - Level 3: 60s per emergency
 * - Complete data dispatch for Mission Completion Modal & Collateral Accidents
 */

class EmergencyManager {
  constructor() {
    this.activeEmergency = null;
    this.emergencyQueue = [];
    this.timer = 90;
    this.maxTime = 90;
    this.level = 1;
    this.emergencyIndex = 0;
    this.solvedCount = 0;
    this.totalEmergenciesInLevel = 3;
    this.consequenceAccidentCount = 0;

    // Callbacks to game controller
    this.onScoreUpdate = null;
    this.onStabilityChange = null;
    this.onEmergencyStart = null;
    this.onEmergencySuccess = null;
    this.onEmergencyFail = null;
    this.onFeedback = null;
  }

  getLevelTimeLimit(level) {
    if (level === 0) return 60;
    if (level <= 2) return 85;
    if (level <= 5) return 75;
    if (level <= 10) return 65;
    if (level <= 15) return 55;
    return 45; // Levels 16 - 20 (High intensity crisis)
  }

  getDifficultyScale(level = this.level) {
    return 1 + Math.min(2.2, (Math.max(1, level) - 1) * 0.12);
  }

  getLevelBriefing(level) {
    const briefings = {
      0: { tag: 'TRAINING MISSION', title: 'GRAVITY CONTROLS CALIBRATION', objectiveText: 'Drag the Magnetic Stabilizer Rod into the yellow TARGET ZONE.', badgeObj: 'MOVE TO TARGET', timeLimitText: '60s' },
      1: { tag: 'LEVEL 1', title: 'CORE FAILURE', objectiveText: 'Guide the magnetic stabilizer into the Gravity Core socket to restore resonance.', badgeObj: 'STABILIZE CORE', timeLimitText: '85s' },
      2: { tag: 'LEVEL 2', title: 'BUILDING DRIFT', objectiveText: 'A residential spire tether has snapped! Steer it into the Magnetic Dock.', badgeObj: 'SECURE SPIRE', timeLimitText: '85s' },
      3: { tag: 'LEVEL 3', title: 'VEHICLE COLLISION', objectiveText: 'Rogue sky-cab with failed autopilot! Divert it into the Safety Corridor.', badgeObj: 'CLEAR TRAFFIC', timeLimitText: '75s' },
      4: { tag: 'LEVEL 4', title: 'POWER GRID OFFLINE', objectiveText: 'Plasma fuel cell dislodged! Maneuver the cell into the Power Generator bay.', badgeObj: 'RESTORE POWER', timeLimitText: '75s' },
      5: { tag: 'LEVEL 5', title: 'REFINERY INFERNO', objectiveText: 'Thermal blaze raging in the Refinery! Guide the Cryo Drone into the fire zone.', badgeObj: 'EXTINGUISH FIRE', timeLimitText: '75s' },
      6: { tag: 'LEVEL 6', title: 'CRITICAL TRAUMA', objectiveText: 'Critical trauma ambulance in transit! Clear skyways to Hospital Dock.', badgeObj: 'SAVE CITIZENS', timeLimitText: '65s' },
      7: { tag: 'LEVEL 7', title: 'DUAL CRISIS: CORE & POWER', objectiveText: 'Simultaneous Core resonance failure and power grid disruption!', badgeObj: 'RESTORE SYSTEMS', timeLimitText: '65s' },
      8: { tag: 'LEVEL 8', title: 'TWIN SPIRE DRIFT', objectiveText: 'Two residential spires drifting toward the city forcefield perimeter!', badgeObj: 'DOCK SPIRES', timeLimitText: '65s' },
      9: { tag: 'LEVEL 9', title: 'HIGHWAY PILEUP', objectiveText: 'Multiple sky-cabs careening out of control across arterial lanes.', badgeObj: 'AVOID COLLISION', timeLimitText: '65s' },
      10: { tag: 'LEVEL 10', title: 'CHEMICAL INFERNO', objectiveText: 'Refinery fire outbreak threatening nearby plasma generator cells!', badgeObj: 'CONTAIN CHEMICALS', timeLimitText: '65s' },
      11: { tag: 'LEVEL 11', title: 'MASS CASUALTY TRANSIT', objectiveText: 'Trauma shuttles navigating through heavy out-of-control traffic!', badgeObj: 'EMERGENCY AIRLIFT', timeLimitText: '55s' },
      12: { tag: 'LEVEL 12', title: 'RESONANCE CASCADE', objectiveText: 'Core failure combined with residential building detachment!', badgeObj: 'STABILIZE SECTOR', timeLimitText: '55s' },
      13: { tag: 'LEVEL 13', title: 'SUB-STATION BLACKOUT', objectiveText: 'Multiple plasma cells dislodged with traffic collisions imminent!', badgeObj: 'RESTORE GRID', timeLimitText: '55s' },
      14: { tag: 'LEVEL 14', title: 'INDUSTRIAL CATASTROPHE', objectiveText: 'Refinery blaze spreading while heavy spires drift uncontrollably!', badgeObj: 'QUENCH & DOCK', timeLimitText: '55s' },
      15: { tag: 'LEVEL 15', title: 'PRIORITY MEDEVAC', objectiveText: 'Multiple medical life-support shuttles racing against oxygen timers!', badgeObj: 'RACE TIMER', timeLimitText: '55s' },
      16: { tag: 'LEVEL 16', title: 'METROPOLIS DE-ORBIT', objectiveText: 'Gravity Core de-sync, thermal refinery blaze, and building drift!', badgeObj: 'PREVENT CRASH', timeLimitText: '45s' },
      17: { tag: 'LEVEL 17', title: 'SUPER-GRID RUPTURE', objectiveText: 'Dual plasma cells and central stabilizer failure under high gravity flux!', badgeObj: 'SYNCHRONIZE ALL', timeLimitText: '45s' },
      18: { tag: 'LEVEL 18', title: 'SKY-CORRIDOR CHAOS', objectiveText: 'High-density collision alert across all civilian flight paths!', badgeObj: 'DIVERT TRAFFIC', timeLimitText: '45s' },
      19: { tag: 'LEVEL 19', title: 'FULL METRO EVACUATION', objectiveText: 'Spire drift, critical trauma shuttles, and industrial chemical fire!', badgeObj: 'SAVE METROPOLIS', timeLimitText: '45s' },
      20: { tag: 'LEVEL 20', title: 'ECHOCORE OMEGA ZERO', objectiveText: 'THE ULTIMATE CRISIS: Total gravitational collapse across all 6 sectors!', badgeObj: 'OMEGA PROTOCOL', timeLimitText: '40s' }
    };

    return briefings[level] || {
      tag: `LEVEL ${level}`,
      title: 'CRISIS CONTINUUM',
      objectiveText: 'Survive extreme randomized gravity anomalies!',
      badgeObj: 'SURVIVE CRISIS',
      timeLimitText: '40s'
    };
  }

  initLevel(level) {
    this.level = level;
    this.emergencyIndex = 0;
    this.solvedCount = 0;
    this.consequenceAccidentCount = 0;
    this.activeEmergency = null;

    // 20 Unique Progressive Level Queues
    const queues = {
      0: ['training'],
      1: ['core_failure'],
      2: ['building_drift'],
      3: ['vehicle_collision'],
      4: ['power_failure'],
      5: ['fire'],
      6: ['hospital_emergency'],
      7: ['core_failure', 'power_failure'],
      8: ['building_drift', 'building_drift'],
      9: ['vehicle_collision', 'vehicle_collision'],
      10: ['fire', 'power_failure'],
      11: ['hospital_emergency', 'vehicle_collision'],
      12: ['core_failure', 'building_drift'],
      13: ['power_failure', 'power_failure', 'vehicle_collision'],
      14: ['fire', 'building_drift', 'building_drift'],
      15: ['hospital_emergency', 'power_failure', 'hospital_emergency'],
      16: ['core_failure', 'fire', 'building_drift'],
      17: ['power_failure', 'core_failure', 'power_failure'],
      18: ['vehicle_collision', 'vehicle_collision', 'vehicle_collision'],
      19: ['building_drift', 'hospital_emergency', 'fire'],
      20: ['core_failure', 'power_failure', 'fire', 'hospital_emergency', 'building_drift']
    };

    this.emergencyQueue = (queues[level] || ['core_failure', 'power_failure', 'fire', 'building_drift']).slice();
    this.totalEmergenciesInLevel = this.emergencyQueue.length;
  }

  startNextEmergency() {
    if (this.emergencyQueue.length === 0) {
      return false; // All emergencies cleared in this level
    }

    const type = this.emergencyQueue.shift();
    this.emergencyIndex++;
    this.setupEmergency(type);
    return true;
  }

  setupEmergency(type) {
    const city = window.cityManager;
    const physics = window.physicsEngine;
    const bounds = city.cityBounds;
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;

    // Reset old entities & hazard effects
    physics.clear();
    city.setFireZone(false, 0, 0);

    const timeLimit = this.getLevelTimeLimit(this.level);
    let emergencyData = null;

    // 0. TRAINING PRACTICE MISSION
    if (type === 'training') {
      const coreZone = city.getZone('gravity_core');
      const startX = bounds.minX + 110;
      const startY = bounds.maxY - 110;

      // Objective: Magnetic Stabilizer Rod
      const rod = new PhysicsEntity({
        id: 'training_rod',
        name: 'Magnetic Stabilizer Rod',
        type: 'core_rod',
        x: startX,
        y: startY,
        width: 36,
        height: 36,
        radius: 20,
        shape: 'circle',
        color: '#00f0ff',
        glowColor: 'rgba(0, 240, 255, 0.9)',
        icon: '💎',
        isObjective: true,
        targetZoneId: 'gravity_core'
      });
      physics.addEntity(rod);

      emergencyData = {
        type: 'training',
        name: 'TRAINING MISSION',
        icon: '🟢',
        desc: 'Move the Magnetic Stabilizer Rod into the yellow TARGET ZONE. Follow the guide arrow!',
        consequence: 'Press Arrow Keys or tap the D-Pad to apply gravity. Press SPACE / ZERO to stop.',
        targetZoneId: 'gravity_core',
        objectiveEntityId: 'training_rod',
        timeLimit: 60,
        isCitizenSave: false,
        isTraining: true
      };
    }

    // 1. GRAVITY CORE FAILURE
    else if (type === 'core_failure') {
      const coreZone = city.getZone('gravity_core');
      const startX = bounds.minX + 90;
      const startY = bounds.maxY - 90;

      const rod = new PhysicsEntity({
        id: 'stabilizer_rod',
        name: 'Magnetic Stabilizer Rod',
        type: 'core_rod',
        x: startX,
        y: startY,
        width: 34,
        height: 34,
        radius: 18,
        shape: 'circle',
        color: '#00f0ff',
        glowColor: 'rgba(0, 240, 255, 0.8)',
        icon: '💎',
        isObjective: true,
        targetZoneId: 'gravity_core'
      });
      physics.addEntity(rod);

      // Civilian ambient traffic
      const trafficCount = Math.min(9, Math.max(2, Math.round((this.level >= 2 ? 4 : 2) * this.getDifficultyScale())));
      this.spawnAmbientVehicles(trafficCount, bounds);

      emergencyData = {
        type: 'core_failure',
        name: 'GRAVITY CORE DE-SYNCHRONIZATION',
        icon: '⚠️',
        desc: 'Core resonance failing! Move the Magnetic Stabilizer Rod into the central Gravity Core socket!',
        consequence: 'Caution: Shifting gravity moves civilian sky-cabs into collision corridors!',
        targetZoneId: 'gravity_core',
        objectiveEntityId: 'stabilizer_rod',
        timeLimit: timeLimit,
        isCitizenSave: false
      };
    }

    // 2. BUILDING DRIFTING
    else if (type === 'building_drift') {
      const anchorZone = city.getZone('anchor_dock');
      const startX = bounds.minX + 130;
      const startY = bounds.minY + 95;

      const spire = new PhysicsEntity({
        id: 'drifting_spire',
        name: 'Residential Spire Theta',
        type: 'spire',
        x: startX,
        y: startY,
        width: 54,
        height: 54,
        radius: 30,
        shape: 'rect',
        mass: 2.2,
        color: '#ffaa00',
        glowColor: 'rgba(255, 170, 0, 0.7)',
        icon: '🏢',
        isObjective: true,
        targetZoneId: 'anchor_dock'
      });
      physics.addEntity(spire);

      const trafficCount = Math.min(9, Math.max(2, Math.round((this.level >= 2 ? 4 : 2) * this.getDifficultyScale())));
      this.spawnAmbientVehicles(trafficCount, bounds);

      emergencyData = {
        type: 'building_drift',
        name: 'RESIDENTIAL SPIRE TETHER SNAPPED',
        icon: '🏢',
        desc: 'Spire Theta has detached with citizens inside! Guide it safely into the Magnetic Spire Anchor Dock!',
        consequence: 'Heavy building momentum: Slamming into walls or vehicles will cause severe structural damage!',
        targetZoneId: 'anchor_dock',
        objectiveEntityId: 'drifting_spire',
        timeLimit: timeLimit,
        isCitizenSave: true
      };
    }

    // 3. VEHICLE COLLISION
    else if (type === 'vehicle_collision') {
      const transitZone = city.getZone('transit_depot');

      const runaway = new PhysicsEntity({
        id: 'runaway_cab',
        name: 'Runaway Sky-Cab',
        type: 'vehicle',
        x: bounds.minX + 90,
        y: cy - 40,
        vx: 80,
        vy: 20,
        width: 36,
        height: 24,
        radius: 18,
        color: '#ff2a55',
        glowColor: 'rgba(255, 42, 85, 0.8)',
        icon: '🚕',
        isObjective: true,
        targetZoneId: 'transit_depot'
      });
      physics.addEntity(runaway);

      const trafficCount = Math.min(10, Math.max(3, Math.round((this.level >= 2 ? 5 : 3) * this.getDifficultyScale())));
      this.spawnAmbientVehicles(trafficCount, bounds);

      emergencyData = {
        type: 'vehicle_collision',
        name: 'HIGH-SPEED TRAFFIC COLLISION ALERT',
        icon: '🚨',
        desc: 'Autopilot failure in Sky-Cab! Divert the rogue vehicle into the Safety Transit Corridor!',
        consequence: 'Steering the vehicle may tip other shuttles into energy barriers!',
        targetZoneId: 'transit_depot',
        objectiveEntityId: 'runaway_cab',
        timeLimit: timeLimit,
        isCitizenSave: false
      };
    }

    // 4. POWER FAILURE
    else if (type === 'power_failure') {
      const powerZone = city.getZone('power_hub');
      const startX = bounds.maxX - 110;
      const startY = bounds.maxY - 110;

      const cell = new PhysicsEntity({
        id: 'plasma_cell',
        name: 'Plasma Power Cell',
        type: 'power_cell',
        x: startX,
        y: startY,
        width: 36,
        height: 36,
        radius: 20,
        color: '#9d4edd',
        glowColor: 'rgba(157, 78, 221, 0.8)',
        icon: '🔋',
        isObjective: true,
        targetZoneId: 'power_hub'
      });
      physics.addEntity(cell);

      const trafficCount = Math.min(9, Math.max(2, Math.round((this.level >= 2 ? 4 : 2) * this.getDifficultyScale())));
      this.spawnAmbientVehicles(trafficCount, bounds);

      emergencyData = {
        type: 'power_failure',
        name: 'PLASMA GRID GENERATOR OFFLINE',
        icon: '⚡',
        desc: 'Plasma cell dislodged! Maneuver the high-energy cell into the Power Grid Bay to prevent total blackout!',
        consequence: 'Shifting the cell pulls ambient vehicles towards the high-voltage perimeter!',
        targetZoneId: 'power_hub',
        objectiveEntityId: 'plasma_cell',
        timeLimit: timeLimit,
        isCitizenSave: false
      };
    }

    // 5. FIRE OUTBREAK
    else if (type === 'fire') {
      const refineryZone = city.getZone('industrial_sector');
      city.setFireZone(true, refineryZone.x, refineryZone.y, 45);

      const drone = new PhysicsEntity({
        id: 'cryo_drone',
        name: 'Cryo-Extinguisher Drone',
        type: 'cryo_drone',
        x: bounds.minX + 90,
        y: bounds.minY + 90,
        width: 34,
        height: 34,
        radius: 18,
        shape: 'circle',
        color: '#00f0ff',
        glowColor: 'rgba(0, 240, 255, 0.8)',
        icon: '🧯',
        isObjective: true,
        targetZoneId: 'industrial_sector'
      });
      physics.addEntity(drone);

      const trafficCount = Math.min(9, Math.max(2, Math.round((this.level >= 2 ? 4 : 2) * this.getDifficultyScale())));
      this.spawnAmbientVehicles(trafficCount, bounds);

      emergencyData = {
        type: 'fire',
        name: 'THERMAL BLAZE IN REFINERY DISTRICT',
        icon: '🔥',
        desc: 'Uncontrolled fire raging in the Refinery! Guide the Cryo-Extinguisher Drone directly into the blaze!',
        consequence: 'Extreme heat risk: Avoid ramming civil transports into the fire zone!',
        targetZoneId: 'industrial_sector',
        objectiveEntityId: 'cryo_drone',
        timeLimit: timeLimit,
        isCitizenSave: false
      };
    }

    // 6. HOSPITAL EMERGENCY
    else if (type === 'hospital_emergency') {
      const hospitalZone = city.getZone('hospital_bay');
      const startX = bounds.minX + 90;
      const startY = bounds.maxY - 90;

      const shuttle = new PhysicsEntity({
        id: 'med_shuttle',
        name: 'Critical Trauma Shuttle',
        type: 'shuttle',
        x: startX,
        y: startY,
        width: 40,
        height: 26,
        radius: 20,
        color: '#00ff88',
        glowColor: 'rgba(0, 255, 136, 0.9)',
        icon: '🚑',
        isObjective: true,
        targetZoneId: 'hospital_bay'
      });
      physics.addEntity(shuttle);

      const trafficCount = Math.min(10, Math.max(3, Math.round((this.level >= 2 ? 5 : 3) * this.getDifficultyScale())));
      this.spawnAmbientVehicles(trafficCount, bounds);

      emergencyData = {
        type: 'hospital_emergency',
        name: 'CRITICAL TRAUMA PATIENT IN TRANSIT',
        icon: '🏥',
        desc: 'Emergency Life-Support Shuttle must reach the Medical Center Dock immediately! Clear the flight path!',
        consequence: 'Gravity acceleration to move the ambulance risks flinging cross-traffic into skyscrapers!',
        targetZoneId: 'hospital_bay',
        objectiveEntityId: 'med_shuttle',
        timeLimit: timeLimit,
        isCitizenSave: true
      };
    }

    this.activeEmergency = emergencyData;
    this.timer = emergencyData.timeLimit;
    this.maxTime = emergencyData.timeLimit;

    if (window.soundManager) {
      if (emergencyData.isTraining) {
        window.soundManager.playWarning();
      } else {
        window.soundManager.playAlarm();
      }
    }

    if (this.onEmergencyStart) {
      this.onEmergencyStart(this.activeEmergency);
    }
  }

  spawnAmbientVehicles(count, bounds) {
    const physics = window.physicsEngine;
    const icons = ['🚗', '🚙', '🚚', '📦'];
    const colors = ['#70d6ff', '#e0aaff', '#ffd166', '#a0c4ff'];

    for (let i = 0; i < count; i++) {
      const pad = 120;
      const x = bounds.minX + pad + Math.random() * (bounds.maxX - bounds.minX - pad * 2);
      const y = bounds.minY + pad + Math.random() * (bounds.maxY - bounds.minY - pad * 2);
      const icon = icons[i % icons.length];
      const color = colors[i % colors.length];

      const v = new PhysicsEntity({
        id: `ambient_${i}`,
        name: `Civilian Transport ${i + 1}`,
        type: 'vehicle',
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 30,
        vy: (Math.random() - 0.5) * 30,
        width: 32,
        height: 22,
        radius: 16,
        color: color,
        glowColor: 'rgba(255, 255, 255, 0.3)',
        icon: icon,
        isObjective: false,
        dangerLevel: 1
      });
      physics.addEntity(v);
    }
  }

  // Handle collision consequences (when non-target objects crash)
  handleAccident(entityA, entityB, impactSpeed) {
    if (!this.activeEmergency) return;
    if (this.activeEmergency.isTraining) return; // No penalties in training

    this.consequenceAccidentCount++;
    const penalty = -150;
    const stabilityDamage = 12;

    if (this.onScoreUpdate) {
      this.onScoreUpdate(penalty, 'COLLATERAL ACCIDENT!');
    }
    if (this.onStabilityChange) {
      this.onStabilityChange(-stabilityDamage);
    }
    if (this.onFeedback) {
      this.onFeedback('⚠️ ACCIDENT CAUSED (-150) | Use ZERO-G to Brake!', 'danger');
    }
  }

  update(dt) {
    if (!this.activeEmergency) return;

    this.timer -= dt;

    // Check emergency objective completion
    const physics = window.physicsEngine;
    const city = window.cityManager;
    const objEntity = physics.entities.find(e => e.id === this.activeEmergency.objectiveEntityId);
    const targetZone = city.getZone(this.activeEmergency.targetZoneId);

    if (objEntity && targetZone) {
      const dist = Math.hypot(objEntity.x - targetZone.x, objEntity.y - targetZone.y);
      const dockRadius = Math.min(targetZone.width, targetZone.height) / 2 + 15;
      const speed = Math.hypot(objEntity.vx, objEntity.vy);
      const speedLimit = Math.max(70, 140 - (this.level - 1) * 4);

      // Must be inside dock and under landing speed threshold
      if (dist < dockRadius) {
        if (speed < speedLimit) {
          this.resolveEmergencySuccess(objEntity, targetZone);
          return;
        } else {
          // Warning: approaching dock too fast!
          if (Math.random() < 0.05 && window.soundManager) {
            window.soundManager.playWarning();
          }
        }
      }
    }

    // Timer expiration
    if (this.timer <= 0) {
      this.resolveEmergencyFail();
    }
  }

  resolveEmergencySuccess(objEntity, targetZone) {
    const isCitizenSave = this.activeEmergency.isCitizenSave;
    const isFastResponse = (this.timer / this.maxTime) >= 0.35;
    const isTraining = this.activeEmergency.isTraining;

    let basePoints = 100;
    let citizenBonus = isCitizenSave ? 150 : 0;
    let fastBonus = isFastResponse ? 50 : 0;
    let totalPoints = basePoints + citizenBonus + fastBonus;

    this.solvedCount++;

    // Magnetic Snap & Socket Lock (Stops all drifting immediately!)
    if (objEntity && targetZone) {
      objEntity.snapTo(targetZone.x, targetZone.y);
    }

    // Particle celebration & sounds
    const physics = window.physicsEngine;
    physics.particleManager.emitRipple(targetZone.x, targetZone.y, '#00ff88');
    physics.particleManager.emit(targetZone.x, targetZone.y, 35, '#00ff88', 140, 3.5, 0.7, 'spark');

    if (window.soundManager) {
      window.soundManager.playSnapLock();
    }

    if (this.activeEmergency.type === 'fire') {
      window.cityManager.setFireZone(false, 0, 0);
      if (window.soundManager) window.soundManager.playCryoSpray();
    } else {
      if (window.soundManager) {
        window.soundManager.playDock();
        window.soundManager.playSuccess();
      }
    }

    if (this.onScoreUpdate) {
      this.onScoreUpdate(totalPoints, '+100 RESOLVED');
    }

    // City Stability boost (+5%)
    const stabilityBoost = 5;
    if (this.onStabilityChange) {
      this.onStabilityChange(stabilityBoost);
    }

    const completed = this.activeEmergency;
    this.activeEmergency = null;

    // Structured completion payload for Game UI
    const completionData = {
      baseScore: 100,
      stabilityGain: stabilityBoost,
      fastBonus: fastBonus,
      totalScore: totalPoints,
      isTraining: isTraining,
      isLastInLevel: this.emergencyQueue.length === 0,
      level: this.level
    };

    if (this.onEmergencySuccess) {
      this.onEmergencySuccess(completionData);
    }
  }

  resolveEmergencyFail() {
    const penalty = -75;
    const stabilityDamage = 20;

    if (window.soundManager) {
      window.soundManager.playCollision(0.8);
    }

    if (this.onScoreUpdate) {
      this.onScoreUpdate(penalty, 'EMERGENCY FAILED (-75)');
    }
    if (this.onStabilityChange) {
      this.onStabilityChange(-stabilityDamage);
    }
    if (this.onFeedback) {
      this.onFeedback('EMERGENCY TIMED OUT (-75) | Sector Damaged!', 'danger');
    }

    const failed = this.activeEmergency;
    this.activeEmergency = null;

    if (this.onEmergencyFail) {
      this.onEmergencyFail(failed);
    }
  }
}

// Global emergency manager instance
window.emergencyManager = new EmergencyManager();
