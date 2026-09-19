/**
 * ECHOCORE: ANTI-GRAVITY - Central Game Engine
 * Coordinates state machine, levels 0-3 (Training + Levels 1-3),
 * mobile onboarding carousel, briefing screens, completion popups,
 * HUD, touch controls, and high score persistence.
 */

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.state = 'MENU'; // 'MENU', 'ONBOARDING', 'BRIEFING', 'PLAYING', 'COMPLETION_MODAL', 'PAUSED', 'LEVEL_CLEAR', 'GAME_OVER'
    this.level = 1;
    this.score = 0;
    this.bestScore = parseInt(localStorage.getItem('echocore_best_score') || '0', 10);
    this.maxLevel = parseInt(localStorage.getItem('echocore_max_level') || '1', 10);
    this.stability = 100;
    this.corePower = 100;
    this.activeDirection = 'NEUTRAL';
    this.lastTime = performance.now();
    this.feedbackTimeout = null;
    this.warningSoundTimer = 0;
    this.pendingCompletionData = null;
    this.playerName = '';
    this.theme = localStorage.getItem('echocore_theme') || 'dark';

    // Canvas roundRect compatibility fallback
    if (!CanvasRenderingContext2D.prototype.roundRect) {
      CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r = 8) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
      };
    }

    this.initDOMElements();
    this.applyTheme(this.theme);
    this.initEventListeners();
    this.resizeCanvas();
    this.checkFirstTimeUser();
  }

  initDOMElements() {
    // Top HUD
    this.brandBadge = document.getElementById('brand-badge');
    this.uiStabilityValue = document.getElementById('stability-value');
    this.uiStabilityBar = document.getElementById('stability-bar');
    this.uiPowerValue = document.getElementById('power-value');
    this.uiPowerBar = document.getElementById('power-bar');
    this.uiLevelValue = document.getElementById('level-value');
    this.uiScoreValue = document.getElementById('score-value');
    this.uiTimerValue = document.getElementById('timer-value');

    // Emergency Banner
    this.uiEmergencyPanel = document.getElementById('emergency-panel');
    this.uiEmergencyIcon = document.getElementById('emergency-icon');
    this.uiEmergencyName = document.getElementById('emergency-name');
    this.uiEmergencyCountdown = document.getElementById('emergency-countdown');
    this.uiEmergencyDesc = document.getElementById('emergency-desc');
    this.uiEmergencyTimerBar = document.getElementById('emergency-timer-bar');
    this.btnDismissEmergency = document.getElementById('btn-dismiss-emergency');

    // Vector Compass
    this.uiVectorArrow = document.getElementById('vector-arrow');
    this.uiVectorText = document.getElementById('vector-text');

    // D-Pad Buttons
    this.btnUp = document.getElementById('btn-up');
    this.btnDown = document.getElementById('btn-down');
    this.btnLeft = document.getElementById('btn-left');
    this.btnRight = document.getElementById('btn-right');
    this.btnNeutral = document.getElementById('btn-neutral');
    this.btnPause = document.getElementById('pause-btn');
    this.btnSound = document.getElementById('sound-toggle-btn');
    this.soundIcon = document.getElementById('sound-icon');

    // Modals
    this.modalMainMenu = document.getElementById('main-menu-modal');
    this.modalOnboarding = document.getElementById('onboarding-modal');
    this.modalLevelStart = document.getElementById('level-start-modal');
    this.modalMissionComplete = document.getElementById('mission-complete-modal');
    this.modalMissions = document.getElementById('missions-modal');
    this.modalSettings = document.getElementById('settings-modal');
    this.modalLevel = document.getElementById('level-modal');
    this.modalGameOver = document.getElementById('gameover-modal');
    this.modalPause = document.getElementById('pause-modal');
    this.feedbackBanner = document.getElementById('feedback-banner');
    this.loginModal = document.getElementById('login-modal');
    this.loginForm = document.getElementById('login-form');
    this.playerNameInput = document.getElementById('player-name');
    this.loginError = document.getElementById('login-error');
    this.playerGreeting = document.getElementById('player-greeting');

    // Main Menu Elements
    this.menuBestScore = document.getElementById('menu-best-score');
    this.menuCurrentLevel = document.getElementById('menu-current-level');
    this.btnMenuPlay = document.getElementById('menu-play-btn');
    this.btnMenuMissions = document.getElementById('menu-missions-btn');
    this.btnMenuHowToPlay = document.getElementById('menu-how-to-play-btn');
    this.btnMenuSettings = document.getElementById('menu-settings-btn');

    // Onboarding Buttons
    this.onboardingScreens = [
      document.getElementById('onboarding-screen-1'),
      document.getElementById('onboarding-screen-2'),
      document.getElementById('onboarding-screen-3'),
      document.getElementById('onboarding-screen-4'),
      document.getElementById('onboarding-screen-5')
    ].filter(Boolean);
    this.onboardingBtns = [
      document.getElementById('onboarding-btn-1'),
      document.getElementById('onboarding-btn-2'),
      document.getElementById('onboarding-btn-3'),
      document.getElementById('onboarding-btn-4'),
      document.getElementById('onboarding-btn-5')
    ].filter(Boolean);

    // Briefing Elements
    this.briefingLevelTag = document.getElementById('briefing-level-tag');
    this.briefingLevelTitle = document.getElementById('briefing-level-title');
    this.briefingObjectiveText = document.getElementById('briefing-objective-text');
    this.briefingBadgeObj = document.getElementById('briefing-badge-obj');
    this.briefingBadgeTime = document.getElementById('briefing-badge-time');
    this.briefingBadgeStab = document.getElementById('briefing-badge-stab');
    this.btnBriefingStart = document.getElementById('briefing-start-btn');

    // Completion Elements
    this.compBaseScore = document.getElementById('comp-base-score');
    this.compStabilityVal = document.getElementById('comp-stability-val');
    this.compBonusRow = document.getElementById('comp-bonus-row');
    this.compBonusScore = document.getElementById('comp-bonus-score');
    this.btnCompNext = document.getElementById('completion-next-btn');
    this.btnCompMenu = document.getElementById('completion-menu-btn');

    // Missions Modal Buttons
    this.missionSelectList = document.getElementById('mission-select-list');
    this.missionSelectBtns = [];
    this.btnMissionsBack = document.getElementById('missions-back-btn');
    this.btnMissionsClose = document.getElementById('missions-close-btn');

    this.buildMissionButtons();

    // Settings Modal Buttons
    this.btnSettingsSound = document.getElementById('settings-sound-btn');
    this.btnSettingsTheme = document.getElementById('settings-theme-btn');
    this.btnSettingsReplayOnboarding = document.getElementById('settings-replay-onboarding-btn');
    this.btnSettingsResetScore = document.getElementById('settings-reset-score-btn');
    this.btnSettingsBack = document.getElementById('settings-back-btn');
    this.btnSettingsClose = document.getElementById('settings-close-btn');

    // Level Clear & Game Over Elements
    this.levelModalTitle = document.getElementById('level-modal-title');
    this.levelModalDesc = document.getElementById('level-modal-desc');
    this.levelModalScore = document.getElementById('level-modal-score');
    this.levelModalStability = document.getElementById('level-modal-stability');
    this.btnNextLevel = document.getElementById('next-level-btn');

    this.gameoverScore = document.getElementById('gameover-score');
    this.gameoverLevel = document.getElementById('gameover-level');
    this.gameoverBest = document.getElementById('gameover-best');
    this.btnRestart = document.getElementById('restart-game-btn');

    this.btnResume = document.getElementById('resume-btn');
    this.btnPauseBack = document.getElementById('pause-back-btn');
    this.btnPauseRestart = document.getElementById('pause-restart-btn');
    this.btnPauseMenu = document.getElementById('pause-menu-btn');

    this.updateMenuStats();
  }

  initEventListeners() {
    window.addEventListener('resize', () => this.resizeCanvas());

    // Gravity D-Pad Controls
    const setDir = (dir, evt) => {
      if (evt && evt.cancelable) evt.preventDefault();
      if (this.state !== 'PLAYING') return;
      this.applyGravity(dir);
    };

    const attachButton = (btn, dir) => {
      btn.addEventListener('pointerdown', (e) => setDir(dir, e));
      btn.addEventListener('click', (e) => setDir(dir, e));
    };

    attachButton(this.btnUp, 'UP');
    attachButton(this.btnDown, 'DOWN');
    attachButton(this.btnLeft, 'LEFT');
    attachButton(this.btnRight, 'RIGHT');
    attachButton(this.btnNeutral, 'NEUTRAL');

    // Keyboard Controls
    const handleKeyboard = (e) => {
      const key = (e.key || '').toLowerCase();
      const code = (e.code || '').toLowerCase();
      const keyCode = e.keyCode || e.which || 0;
      const legacyMap = {
        38: 'UP', 40: 'DOWN', 37: 'LEFT', 39: 'RIGHT', 32: 'NEUTRAL',
        87: 'UP', 83: 'DOWN', 65: 'LEFT', 68: 'RIGHT', 88: 'NEUTRAL',
        80: 'PAUSE'
      };

      const isArrowKey = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'space', ' '].includes(key) || ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'space'].includes(code);
      if (isArrowKey) e.preventDefault();

      if (this.state === 'PLAYING') {
        const directionMap = {
          arrowup: 'UP', up: 'UP', w: 'UP', keyw: 'UP',
          arrowdown: 'DOWN', down: 'DOWN', s: 'DOWN', keys: 'DOWN',
          arrowleft: 'LEFT', left: 'LEFT', a: 'LEFT', keya: 'LEFT',
          arrowright: 'RIGHT', right: 'RIGHT', d: 'RIGHT', keyd: 'RIGHT',
          space: 'NEUTRAL', x: 'NEUTRAL', keyx: 'NEUTRAL', ' ': 'NEUTRAL'
        };

        const mapped = directionMap[key] || directionMap[code] || legacyMap[keyCode];
        if (mapped && mapped !== 'PAUSE') {
          if (!e.repeat || mapped === 'NEUTRAL') {
            this.applyGravity(mapped);
          }
        }

        if (code === 'keyp' || key === 'p' || code === 'escape' || key === 'escape' || keyCode === 27 || keyCode === 80) {
          e.preventDefault();
          this.togglePause();
        }
      } else if (this.state === 'PAUSED' && (code === 'keyp' || key === 'p' || code === 'escape' || key === 'escape' || keyCode === 27 || keyCode === 80)) {
        this.togglePause();
      }
    };

    window.addEventListener('keydown', handleKeyboard, { passive: false });
    document.addEventListener('keydown', handleKeyboard, { passive: false });

    // Sound toggle
    const toggleSound = () => {
      const isMuted = window.soundManager.toggleMute();
      this.soundIcon.textContent = isMuted ? '🔇' : '🔊';
      this.btnSettingsSound.textContent = isMuted ? '🔇 SOUND EFFECTS: OFF' : '🔊 SOUND EFFECTS: ON';
    };
    this.btnSound.addEventListener('click', toggleSound);
    this.btnSettingsSound.addEventListener('click', toggleSound);

    this.btnSettingsTheme.addEventListener('click', () => {
      const nextTheme = this.theme === 'dark' ? 'light' : 'dark';
      this.applyTheme(nextTheme);
    });

    // Pause & Menu brand icon
    this.btnPause.addEventListener('click', () => this.togglePause());
    this.brandBadge.addEventListener('click', () => {
      if (this.state === 'PLAYING') {
        this.togglePause();
      } else {
        this.showMainMenu();
      }
    });

    // Dismiss / Minimize Emergency Banner
    if (this.btnDismissEmergency && this.uiEmergencyPanel) {
      this.btnDismissEmergency.addEventListener('click', () => {
        const isMin = this.uiEmergencyPanel.classList.toggle('minimized');
        this.btnDismissEmergency.textContent = isMin ? 'EXPAND' : 'GOT IT';
      });
    }

    // Main Menu Buttons
    this.btnMenuPlay.addEventListener('click', () => {
      window.soundManager.ensureContext();
      this.modalMainMenu.classList.add('hidden');
      const startLevel = this.maxLevel === 0 ? 0 : Math.max(1, this.maxLevel);
      this.showBriefing(startLevel);
    });

    this.btnMenuMissions.addEventListener('click', () => {
      this.modalMainMenu.classList.add('hidden');
      this.modalMissions.classList.remove('hidden');
    });

    this.btnMenuHowToPlay.addEventListener('click', () => {
      this.modalMainMenu.classList.add('hidden');
      this.startOnboarding();
    });

    this.btnMenuSettings.addEventListener('click', () => {
      this.modalMainMenu.classList.add('hidden');
      this.modalSettings.classList.remove('hidden');
    });

    this.loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = this.playerNameInput.value.trim().replace(/\s+/g, ' ');
      if (name.length < 2) {
        this.loginError.textContent = 'Enter at least 2 characters for your callsign.';
        return;
      }
      this.playerName = name;
      localStorage.setItem('echocore_player_name', name);
      this.loginModal.classList.add('hidden');
      this.playerGreeting.textContent = `CONTROLLER // ${name.toUpperCase()}`;

      const tutorialKey = `echocore_tutorial_completed_${name.toLowerCase()}`;
      const tutorialDone = localStorage.getItem(tutorialKey);
      if (!tutorialDone) {
        this.startOnboarding();
      } else {
        this.showMainMenu();
      }
    });

    // Onboarding Step Flow (Screens 1 through 5)
    for (let i = 0; i < 4; i++) {
      this.onboardingBtns[i].addEventListener('click', () => {
        window.soundManager.ensureContext();
        this.onboardingScreens[i].classList.add('hidden');
        this.onboardingScreens[i + 1].classList.remove('hidden');
      });
    }

    // Step 5 completes Onboarding and launches Training Mission
    this.onboardingBtns[4].addEventListener('click', () => {
      const tutorialKey = `echocore_tutorial_completed_${this.playerName.toLowerCase()}`;
      localStorage.setItem(tutorialKey, 'true');
      this.modalOnboarding.classList.add('hidden');
      this.showBriefing(0); // Launch Training Mission
    });

    // Briefing Screen Start Button
    this.btnBriefingStart.addEventListener('click', () => {
      this.modalLevelStart.classList.add('hidden');
      this.startGameplayLevel(this.pendingLevelToStart);
    });

    // Mission Completion Buttons
    this.btnCompNext.addEventListener('click', () => {
      this.modalMissionComplete.classList.add('hidden');
      if (this.pendingCompletionData) {
        if (this.pendingCompletionData.isTraining) {
          // Finished training -> Move to Level 1
          this.showBriefing(1);
        } else if (this.pendingCompletionData.isLastInLevel) {
          // Finished all emergencies in level -> Show level debrief
          this.triggerLevelClear();
        } else {
          // Continue next emergency in current level
          this.state = 'PLAYING';
          this.applyGravity('NEUTRAL');
          window.emergencyManager.startNextEmergency();
        }
      }
    });

    this.btnCompMenu.addEventListener('click', () => {
      this.modalMissionComplete.classList.add('hidden');
      this.showMainMenu();
    });

    // Missions Modal Selectors
    this.btnMissionsBack.addEventListener('click', () => {
      this.modalMissions.classList.add('hidden');
      if (this.state === 'MENU') {
        this.showMainMenu();
      } else {
        this.showMainMenu();
      }
    });

    this.btnMissionsClose.addEventListener('click', () => {
      this.modalMissions.classList.add('hidden');
      this.showMainMenu();
    });

    // Settings Modal Handlers
    this.btnSettingsBack.addEventListener('click', () => {
      this.modalSettings.classList.add('hidden');
      this.showMainMenu();
    });

    this.btnSettingsReplayOnboarding.addEventListener('click', () => {
      this.modalSettings.classList.add('hidden');
      this.startOnboarding();
    });

    this.btnSettingsResetScore.addEventListener('click', () => {
      localStorage.setItem('echocore_best_score', '0');
      this.bestScore = 0;
      this.updateMenuStats();
      this.showFeedback('HIGH SCORE RESET', 'danger');
    });

    this.btnSettingsClose.addEventListener('click', () => {
      this.modalSettings.classList.add('hidden');
      this.showMainMenu();
    });

    // Level Clear Next Button
    this.btnNextLevel.addEventListener('click', () => {
      this.modalLevel.classList.add('hidden');
      if (this.level >= 20) {
        this.showMainMenu();
      } else {
        this.showBriefing(this.level + 1);
      }
    });

    // Game Over Restart
    this.btnRestart.addEventListener('click', () => {
      this.modalGameOver.classList.add('hidden');
      this.showBriefing(this.level);
    });

    // Pause Handlers
    this.btnResume.addEventListener('click', () => this.togglePause());
    this.btnPauseBack.addEventListener('click', () => {
      this.modalPause.classList.add('hidden');
      this.state = 'PLAYING';
      this.lastTime = performance.now();
    });
    this.btnPauseRestart.addEventListener('click', () => {
      this.modalPause.classList.add('hidden');
      this.showBriefing(this.level);
    });
    this.btnPauseMenu.addEventListener('click', () => {
      this.modalPause.classList.add('hidden');
      this.showMainMenu();
    });

    // Emergency Manager Callbacks
    window.emergencyManager.onScoreUpdate = (delta, reason) => {
      this.addScore(delta);
    };

    window.emergencyManager.onStabilityChange = (delta) => {
      this.changeStability(delta);
    };

    window.emergencyManager.onEmergencyStart = (emergency) => {
      this.updateEmergencyBanner(emergency);
    };

    window.emergencyManager.onEmergencySuccess = (completionData) => {
      this.handleEmergencySolved(completionData);
    };

    window.emergencyManager.onEmergencyFail = (emergency) => {
      this.scheduleNextEmergency();
    };

    window.emergencyManager.onFeedback = (text, type) => {
      this.showFeedback(text, type);
    };
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    window.cityManager.init(width, height);
  }

  checkFirstTimeUser() {
    this.state = 'LOGIN';
    this.loginModal.classList.remove('hidden');
    this.playerNameInput.value = '';
    this.loginError.textContent = '';
    this.playerNameInput.focus();
    return;
  }

  startOnboarding() {
    this.state = 'ONBOARDING';
    this.modalMainMenu.classList.add('hidden');
    this.modalLevelStart.classList.add('hidden');
    this.modalPause.classList.add('hidden');
    this.modalGameOver.classList.add('hidden');

    // Show screen 1, hide others
    this.onboardingScreens.forEach((s, idx) => {
      if (idx === 0) s.classList.remove('hidden');
      else s.classList.add('hidden');
    });
    this.modalOnboarding.classList.remove('hidden');
  }

  showMainMenu() {
    this.state = 'MENU';
    this.updateMenuStats();
    if (this.loginModal) this.loginModal.classList.add('hidden');
    this.modalMainMenu.classList.remove('hidden');
  }

  updateMenuStats() {
    this.menuBestScore.textContent = this.bestScore;
    this.menuCurrentLevel.textContent = this.maxLevel === 0 ? 'TRAINING' : `LEVEL ${this.maxLevel}`;
  }

  applyTheme(theme) {
    this.theme = theme;
    const isDark = theme === 'dark';
    document.body.classList.toggle('light-mode', !isDark);
    document.body.classList.toggle('dark-mode', isDark);
    this.btnSettingsTheme.textContent = isDark ? '🌙 DARK MODE' : '☀️ LIGHT MODE';
    localStorage.setItem('echocore_theme', theme);
  }

  buildMissionButtons() {
    if (!this.missionSelectList) return;

    this.missionSelectList.innerHTML = '';
    this.missionSelectBtns = [];

    const missions = [{ level: 0, label: 'TRAINING MISSION', time: '60s' }];
    for (let level = 1; level <= 20; level++) {
      missions.push({ level, label: `LEVEL ${level}`, time: window.emergencyManager ? window.emergencyManager.getLevelTimeLimit(level) + 's' : '45s' });
    }

    missions.forEach((mission) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'menu-btn';
      btn.dataset.level = String(mission.level);
      btn.id = mission.level === 0 ? 'mission-select-0' : `mission-select-${mission.level}`;
      btn.style.textAlign = 'left';
      btn.style.display = 'flex';
      btn.style.justifyContent = 'space-between';
      btn.style.alignItems = 'center';

      const labelText = mission.level === 0
        ? '🟢 TRAINING MISSION (Practice)'
        : `${mission.level}️⃣ ${mission.label}: ${window.emergencyManager?.getLevelBriefing(mission.level)?.title || 'CRISIS'}`;

      const timeColor = mission.level === 0 ? 'var(--green)' : mission.level <= 10 ? 'var(--cyan)' : mission.level <= 15 ? 'var(--amber)' : 'var(--red)';

      btn.innerHTML = `
        <span>${labelText}</span>
        <span style="color: ${timeColor}; font-size: 0.8rem;">${mission.time}</span>
      `;

      btn.addEventListener('click', () => {
        this.modalMissions.classList.add('hidden');
        this.showBriefing(Number(btn.dataset.level));
      });

      this.missionSelectList.appendChild(btn);
      this.missionSelectBtns.push(btn);
    });
  }

  showBriefing(lvl) {
    this.state = 'BRIEFING';
    this.pendingLevelToStart = lvl;
    const briefing = window.emergencyManager.getLevelBriefing(lvl);

    this.briefingLevelTag.textContent = briefing.tag;
    this.briefingLevelTitle.textContent = briefing.title;
    this.briefingObjectiveText.textContent = briefing.objectiveText;
    this.briefingBadgeObj.textContent = briefing.badgeObj;
    this.briefingBadgeTime.textContent = briefing.timeLimitText;
    this.briefingBadgeStab.textContent = `${Math.round(this.stability)}%`;

    this.modalLevelStart.classList.remove('hidden');
  }

  startGameplayLevel(lvl) {
    this.level = lvl;
    this.stability = 100;
    this.corePower = 100;
    this.uiLevelValue.textContent = lvl === 0 ? 'TRN' : lvl;
    this.updateHUD();

    window.emergencyManager.initLevel(lvl);
    this.applyGravity('NEUTRAL');

    this.state = 'PLAYING';
    window.emergencyManager.startNextEmergency();
  }

  handleEmergencySolved(completionData) {
    this.pendingCompletionData = completionData;
    this.state = 'COMPLETION_MODAL';

    // Populate Mission Complete Modal
    this.compBaseScore.textContent = `+${completionData.baseScore} SCORE`;
    this.compStabilityVal.textContent = `+${completionData.stabilityGain}%`;

    if (completionData.fastBonus > 0) {
      this.compBonusRow.classList.remove('hidden');
      this.compBonusScore.textContent = `Fast Response +${completionData.fastBonus}`;
    } else {
      this.compBonusRow.classList.add('hidden');
    }

    if (completionData.isTraining) {
      this.btnCompNext.textContent = 'PROCEED TO LEVEL 1 ➔';
    } else if (completionData.isLastInLevel) {
      this.btnCompNext.textContent = 'SECTOR DEBRIEF ➔';
    } else {
      this.btnCompNext.textContent = 'NEXT EMERGENCY ➔';
    }

    // Show modal after tiny celebration delay
    setTimeout(() => {
      this.modalMissionComplete.classList.remove('hidden');
    }, 450);
  }

  scheduleNextEmergency() {
    if (this.state !== 'PLAYING') return;

    if (window.emergencyManager.emergencyQueue.length === 0) {
      setTimeout(() => {
        if (this.state === 'PLAYING') this.triggerLevelClear();
      }, 1000);
      return;
    }

    this.updateEmergencyBanner({
      name: 'SCANNING DISTRICTS...',
      icon: '📡',
      desc: 'Gravitational telemetry stabilizing. Next sector alert incoming...',
      isNormal: true
    });

    setTimeout(() => {
      if (this.state === 'PLAYING') {
        window.emergencyManager.startNextEmergency();
      }
    }, 1800);
  }

  applyGravity(dir) {
    const powerDrain = dir === 'NEUTRAL' ? 1 : (this.level === 3 ? 12 : 8);
    if (this.corePower < powerDrain && dir !== 'NEUTRAL') {
      this.showFeedback('CORE ENERGY INSUFFICIENT!', 'danger');
      if (window.soundManager) window.soundManager.playWarning();
      return;
    }

    this.activeDirection = dir;
    this.corePower = Math.max(0, this.corePower - powerDrain);

    window.physicsEngine.setGravity(dir);
    if (window.soundManager) window.soundManager.playGravityShift(dir);

    this.updateVectorUI(dir);
  }

  updateVectorUI(dir) {
    [this.btnUp, this.btnDown, this.btnLeft, this.btnRight, this.btnNeutral].forEach(b => b.classList.remove('active'));

    let arrowText = '●';
    let label = 'ZERO-G';

    switch (dir) {
      case 'UP':
        arrowText = '▲';
        label = 'GRAV UP';
        this.btnUp.classList.add('active');
        break;
      case 'DOWN':
        arrowText = '▼';
        label = 'GRAV DOWN';
        this.btnDown.classList.add('active');
        break;
      case 'LEFT':
        arrowText = '◀';
        label = 'GRAV LEFT';
        this.btnLeft.classList.add('active');
        break;
      case 'RIGHT':
        arrowText = '▶';
        label = 'GRAV RIGHT';
        this.btnRight.classList.add('active');
        break;
      case 'NEUTRAL':
      default:
        arrowText = '●';
        label = 'ZERO-G';
        this.btnNeutral.classList.add('active');
        break;
    }

    this.uiVectorArrow.textContent = arrowText;
    this.uiVectorText.textContent = label;
  }

  changeStability(delta) {
    this.stability = Math.max(0, Math.min(100, this.stability + delta));
    this.updateHUD();

    if (this.stability <= 0 && this.state === 'PLAYING') {
      this.triggerGameOver();
    }
  }

  addScore(points) {
    this.score = Math.max(0, this.score + points);
    this.uiScoreValue.textContent = this.score;

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('echocore_best_score', this.bestScore.toString());
    }
  }

  updateHUD() {
    this.uiStabilityValue.textContent = `${Math.round(this.stability)}%`;
    this.uiStabilityBar.style.width = `${this.stability}%`;

    if (this.stability < 30) {
      this.uiStabilityBar.style.background = 'linear-gradient(90deg, #ff2a55, #ff7700)';
      this.uiStabilityBar.style.boxShadow = '0 0 10px rgba(255, 42, 85, 0.8)';
    } else if (this.stability < 60) {
      this.uiStabilityBar.style.background = 'linear-gradient(90deg, #ffaa00, #ffe600)';
      this.uiStabilityBar.style.boxShadow = '0 0 10px rgba(255, 170, 0, 0.8)';
    } else {
      this.uiStabilityBar.style.background = 'linear-gradient(90deg, #00ff88, #00f0ff)';
      this.uiStabilityBar.style.boxShadow = '0 0 10px rgba(0, 255, 136, 0.5)';
    }

    this.uiPowerValue.textContent = `${Math.round(this.corePower)}%`;
    this.uiPowerBar.style.width = `${this.corePower}%`;
  }

  updateEmergencyBanner(emergency) {
    if (emergency.isTraining) {
      this.uiEmergencyPanel.className = 'emergency-panel training-mode';
    } else if (emergency.isNormal) {
      this.uiEmergencyPanel.className = 'emergency-panel status-normal';
    } else {
      this.uiEmergencyPanel.className = 'emergency-panel';
    }

    this.uiEmergencyIcon.textContent = emergency.icon || '⚠️';
    this.uiEmergencyName.textContent = emergency.name || 'EMERGENCY';
    this.uiEmergencyDesc.textContent = emergency.desc || '';
  }

  showFeedback(text, type = 'success') {
    this.feedbackBanner.textContent = text;
    this.feedbackBanner.className = `show ${type}`;

    if (this.feedbackTimeout) clearTimeout(this.feedbackTimeout);
    this.feedbackTimeout = setTimeout(() => {
      this.feedbackBanner.className = '';
    }, 2200);
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.modalPause.classList.remove('hidden');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.modalPause.classList.add('hidden');
      this.lastTime = performance.now();
    }
  }

  resumeFromPause() {
    if (this.state === 'PAUSED') {
      this.modalPause.classList.add('hidden');
      this.state = 'PLAYING';
      this.lastTime = performance.now();
    }
  }

  triggerLevelClear() {
    this.state = 'LEVEL_CLEAR';
    if (window.soundManager) window.soundManager.playLevelClear();

    this.levelModalScore.textContent = this.score;
    this.levelModalStability.textContent = `${Math.round(this.stability)}%`;

    if (this.level > this.maxLevel) {
      this.maxLevel = Math.min(20, this.level + 1);
      localStorage.setItem('echocore_max_level', this.maxLevel.toString());
    }

    if (this.level >= 20) {
      this.levelModalTitle.textContent = 'OMEGA ZERO CONTAINED!';
      this.levelModalDesc.textContent = 'Extraordinary piloting! You survived the full ECHOCORE continuum and preserved Neo-Aethel from total collapse!';
      this.btnNextLevel.textContent = 'RETURN TO MAIN MENU';
    } else {
      this.levelModalTitle.textContent = `SECTOR ${this.level} STABILIZED!`;
      this.levelModalDesc.textContent = `Excellent maneuvering, Controller! Prepare for Level ${this.level + 1}!`;
      this.btnNextLevel.textContent = `PROCEED TO LEVEL ${this.level + 1}`;
    }

    this.modalLevel.classList.remove('hidden');
  }

  triggerGameOver() {
    this.state = 'GAME_OVER';
    if (window.soundManager) window.soundManager.playGameOver();

    this.gameoverScore.textContent = this.score;
    this.gameoverLevel.textContent = this.level === 0 ? 'TRAINING' : this.level;
    this.gameoverBest.textContent = this.bestScore;
    this.modalGameOver.classList.remove('hidden');
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(currentTime) {
    const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    if (this.state === 'PLAYING') {
      this.update(dt);
    }

    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    const city = window.cityManager;
    const physics = window.physicsEngine;
    const emg = window.emergencyManager;

    // Core power regeneration
    const rechargeRate = this.activeDirection === 'NEUTRAL' ? 14 : 4;
    this.corePower = Math.min(100, this.corePower + rechargeRate * dt);
    this.updateHUD();

    // City atmosphere & physics update
    city.update(dt, this.activeDirection, physics.particleManager);

    physics.update(dt, city.cityBounds, (entityA, entityB, speed) => {
      emg.handleAccident(entityA, entityB, speed);
    });

    // Emergency timer & state update
    emg.update(dt);

    if (emg.activeEmergency) {
      const remaining = Math.max(0, emg.timer);
      this.uiEmergencyCountdown.textContent = `${remaining.toFixed(1)}s`;
      const pct = (remaining / emg.maxTime) * 100;
      this.uiEmergencyTimerBar.style.width = `${pct}%`;
      this.uiTimerValue.textContent = `${Math.ceil(remaining)}s`;

      // Low time visual warning (<= 20 seconds)
      if (remaining <= 20) {
        this.uiTimerValue.classList.add('low-time');
        this.warningSoundTimer += dt;
        if (this.warningSoundTimer >= 4.0 && window.soundManager) {
          this.warningSoundTimer = 0;
          window.soundManager.playWarning();
        }
      } else {
        this.uiTimerValue.classList.remove('low-time');
        this.warningSoundTimer = 0;
      }
    }
  }

  render() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.ctx.clearRect(0, 0, width, height);

    // 1. Draw City, Space backdrop, Zones, Guidance Arrows
    window.cityManager.draw(this.ctx, width, height, window.emergencyManager.activeEmergency);

    // 2. Draw Physics Entities & Particles
    window.physicsEngine.draw(this.ctx);
  }
}

// Start game instance on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
  window.game.start();
});
