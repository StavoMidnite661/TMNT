import Phaser from 'phaser';
import Player from '../components/Player';
import Enemy from '../components/Enemy';
import SoundSynth from '../utils/SoundSynth';
import { hudBus } from '../hudBus';
import { HIGH_SCORE_KEY, WORLD_LENGTH_SCREENS } from '../constants';
import type { TurtleCharacter } from '../types';

export default class MainScene extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.GameObjects.Group;
  private pickups!: Phaser.GameObjects.Group;
  private cursors!: any;
  private characterData!: TurtleCharacter;
  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private healthBar!: Phaser.GameObjects.Graphics;
  private specialBar!: Phaser.GameObjects.Graphics;
  private currentLevel = 1;
  private lives = 3;
  private isTransitioning = false;
  private gameOver = false;
  private paused = false;
  private hudTimer = 0;
  private highScore = 0;
  private lastCombo = 0;
  private debrisParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private bloodParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private sparkParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private virtualControls = {
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false,
    dodge: false,
    jump: false,
    special: false,
  };

  constructor() {
    super('MainScene');
  }

  init(data: any) {
    this.characterData = data.character;
    this.highScore = Number(localStorage.getItem(HIGH_SCORE_KEY) || '0') || 0;
  }

  create() {
    this.isTransitioning = true; // Block level checks during initialization
    this.gameOver = false;
    this.paused = false;
    const worldWidth = this.scale.width * WORLD_LENGTH_SCREENS;

    // Parallax Layers (Deep to Front)
    // 1. Static Deep Sky
    this.add.image(0, 0, 'alley_bg_hq').setOrigin(0).setScrollFactor(0).setDisplaySize(this.scale.width, this.scale.height).setAlpha(0.8);

    // 2. Cityscape Silhouette
    this.add.tileSprite(0, 50, worldWidth, this.scale.height, 'cityscape_hq').setOrigin(0).setScrollFactor(0.05).setAlpha(0.3).setTint(0x222266);

    // 3. Middle Alley Wall Layer
    this.add.tileSprite(0, 0, worldWidth, 400, 'midground').setOrigin(0).setScrollFactor(0.2).setAlpha(0.6).setDisplaySize(worldWidth, 420);

    // 4. Floors
    const floor = this.add.rectangle(0, 420, worldWidth, 300, 0x050510).setOrigin(0).setScrollFactor(1);
    floor.setDepth(-10);

    // 5. Fast Foreground
    const fg = this.add.tileSprite(0, 550, worldWidth * 1.5, 200, 'foreground');
    fg.setOrigin(0).setScrollFactor(1.6).setAlpha(0.12).setDepth(2000).setTint(0x000000);

    // Floor physics bounds
    this.physics.world.setBounds(0, 480, worldWidth, 160);

    // Dynamic Rain (Ultra-Dense)
    this.add.particles(0, 0, 'rain_drop', {
      x: { min: 0, max: worldWidth },
      y: -20,
      lifespan: 1200,
      speedY: { min: 900, max: 1400 },
      speedX: -80,
      scale: { start: 0.1, end: 0.4 },
      quantity: 20,
      alpha: { start: 0.05, end: 0.25 },
      blendMode: 'SCREEN',
    }).setScrollFactor(1).setDepth(2000);

    // Player
    this.player = new Player(this, 300, 580, this.characterData);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1, 0, 100);
    this.cameras.main.setBounds(0, 0, worldWidth, this.scale.height);

    // Enemies
    this.enemies = this.add.group({ runChildUpdate: true });
    this.spawnEnemies();

    // Pickups (pizza heals, future power-ups)
    this.pickups = this.add.group();

    // Block progression for a moment to allow initialization
    this.isTransitioning = true;
    this.time.delayedCall(1500, () => {
      this.isTransitioning = false;
    });

    // Controls
    this.cursors = this.input.keyboard?.createCursorKeys();

    // UI
    this.createUI();

    // Particle Emitters for Combat
    this.bloodParticles = this.add.particles(0, 0, 'rain_drop', {
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      speed: { min: 100, max: 400 },
      lifespan: 400,
      tint: 0x880000,
      gravityY: 800,
      quantity: 0,
      blendMode: 'NORMAL',
    }).setDepth(1500);

    this.sparkParticles = this.add.particles(0, 0, 'rain_drop', {
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      speed: { min: 200, max: 600 },
      lifespan: 300,
      tint: [0xffffff, 0xffff00, 0xffaa00],
      blendMode: 'SCREEN',
      quantity: 0,
    }).setDepth(1600);

    this.debrisParticles = this.add.particles(0, 0, 'rain_drop', {
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      rotate: { min: 0, max: 360 },
      speed: { min: 200, max: 800 },
      lifespan: 800,
      tint: [0x333333, 0x111111, 0x444444],
      gravityY: 1000,
      quantity: 0,
    }).setDepth(1550);

    // Collisions
    this.physics.add.overlap(this.player, this.enemies, (p, e) => {
      const player = p as Player;
      const enemy = e as Enemy;
      const now = this.time.now;

      if (!enemy.canBeHit(now)) return; // one hit per swing

      const isAttacking = player.anims.currentAnim?.key.includes('attack') || player.anims.currentAnim?.key.includes('special');

      if (isAttacking && (player.anims.currentFrame?.index ?? 0) > 1) {
        enemy.markHit(now);
        const isCritical = player.anims.currentAnim?.key.includes('attack_2') || player.anims.currentAnim?.key.includes('special');
        const damage = isCritical ? 20 : 10;

        enemy.takeDamage(damage);
        player.addScore(isCritical ? 200 : 100);

        // Play dynamic punch/slash hits
        SoundSynth.playHit(isCritical);

        const isDead = enemy.getHealth() <= 0;

        // Juicy Combat Feedback
        const shakeIntensity = isDead ? 0.05 : (isCritical ? 0.025 : 0.01);
        this.cameras.main.shake(isDead ? 300 : 150, shakeIntensity);

        if (isDead) {
          this.cameras.main.flash(100, 255, 255, 255, true);
          this.debrisParticles.emitParticleAt(enemy.x, enemy.y - 40, 40);
          this.maybeDropPizza(enemy.x, enemy.y - 20);
        }

        // Hit-stop (Improved: brief freeze)
        player.anims.pause();
        enemy.anims.pause();
        this.time.delayedCall(isDead ? 200 : (isCritical ? 100 : 60), () => {
          if (player.active) player.anims.resume();
          if (enemy.active) enemy.anims.resume();
        });

        // Blood Sprays
        this.bloodParticles.emitParticleAt(enemy.x, enemy.y - 40, isDead ? 40 : (isCritical ? 20 : 10));

        // Impact Sparks
        this.sparkParticles.emitParticleAt(enemy.x, enemy.y - 60, isDead ? 30 : (isCritical ? 15 : 8));

        // Visible impact flash
        const hitFlash = this.add.circle(enemy.x, enemy.y - 60, isCritical ? 40 : 20, 0xffffff, 0.8);
        hitFlash.setDepth(1700).setBlendMode('SCREEN');
        this.tweens.add({
          targets: hitFlash,
          alpha: 0,
          scale: 2,
          duration: 100,
          onComplete: () => hitFlash.destroy(),
        });

        // Combo popup
        const combo = player.getCombo();
        if (combo >= 2 && combo > this.lastCombo) {
          this.spawnComboPopup(enemy.x, enemy.y - 120, combo);
        }
        this.lastCombo = combo;
      }
    });

    // Mobile Virtual Buttons
    this.events.on('v-control', (data: any) => {
      this.virtualControls = { ...this.virtualControls, ...data };
    });

    this.events.on('playerSpecial', () => {
      this.cameras.main.flash(500, 255, 255, 255);
      this.cameras.main.shake(500, 0.03);

      this.enemies.getChildren().forEach((e: any) => {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
        if (dist < 400) {
          e.takeDamage(50);
          const spark = this.add.circle(e.x, e.y, 20, 0x00ffff);
          spark.setDepth(200);
          this.tweens.add({ targets: spark, alpha: 0, scale: 5, duration: 500, onComplete: () => spark.destroy() });
        }
      });
    });

    // Life / death flow
    this.events.on('playerDied', () => this.onPlayerDied());

    // Pizza pickups — the classic beat-em-up health drop
    this.physics.add.overlap(this.player, this.pickups, (p, item) => {
      const pizza = item as Phaser.Physics.Arcade.Sprite;
      if (!pizza.active) return;
      pizza.destroy();
      this.player.heal(25);
      this.player.addScore(500);
      SoundSynth.playPizza();
      this.sparkParticles.emitParticleAt(pizza.x, pizza.y, 14);

      const label = this.add.text(pizza.x, pizza.y - 40, '+PIZZA', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffd23f',
        stroke: '#000000',
        strokeThickness: 5,
      }).setOrigin(0.5).setDepth(2600).setScrollFactor(0);
      this.tweens.add({
        targets: label,
        y: pizza.y - 100,
        alpha: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => label.destroy(),
      });
    });

    // Pause (Esc / P) — flag based so input keeps flowing for unpause
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard?.on('keydown-P', () => this.togglePause());

    // Auto-pause when the tab loses focus
    this.game.events.on('blur', () => {
      if (!this.gameOver) this.setPaused(true);
    });

    this.syncHud();
  }

  private spawnComboPopup(x: number, y: number, combo: number) {
    const label = combo >= 5 ? `x${combo} RAMPAGE!` : `x${combo} COMBO!`;
    const popup = this.add.text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: combo >= 5 ? '36px' : '24px',
      color: combo >= 5 ? '#ffff00' : '#00ffff',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(2500).setScrollFactor(0);
    this.tweens.add({
      targets: popup,
      y: y - 60,
      alpha: 0,
      scale: 1.4,
      duration: 700,
      ease: 'Power2',
      onComplete: () => popup.destroy(),
    });
  }

  private onPlayerDied() {
    if (this.gameOver) return;
    this.lives -= 1;
    this.syncHud();

    if (this.lives > 0) {
      // Freeze the brawl, then drop the turtle back into the alley
      this.enemies.getChildren().forEach((e: any) => {
        e.setVelocity(0, 0);
        e.play('thug_idle', true);
      });
      this.isTransitioning = true;
      this.time.delayedCall(1200, () => {
        this.player.respawn(Math.max(120, this.cameras.main.scrollX + 120));
        this.isTransitioning = false;
      });
    } else {
      this.gameOver = true;
      this.showGameOver();
    }
  }

  private showGameOver() {
    const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.75).setOrigin(0).setDepth(2900).setScrollFactor(0);

    const text = this.add.text(this.scale.width / 2, this.scale.height / 2 - 40, 'GAME OVER', {
      fontFamily: 'monospace',
      fontSize: '72px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 10,
    }).setOrigin(0.5).setDepth(3000).setScrollFactor(0);

    const scoreLine = this.add.text(this.scale.width / 2, this.scale.height / 2 + 40, `FINAL SCORE: ${this.player.getScore()}`, {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(3000).setScrollFactor(0);

    const retry = this.add.text(this.scale.width / 2, this.scale.height / 2 + 110, 'PRESS ENTER TO RETRY', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(3000).setScrollFactor(0);

    this.tweens.add({ targets: retry, alpha: 0, duration: 600, yoyo: true, repeat: -1 });

    const restart = () => {
      this.input.keyboard?.off('keydown-ENTER', restart);
      this.input.keyboard?.off('keydown-SPACE', restart);
      this.input.off('pointerdown', restart);
      overlay.destroy();
      text.destroy();
      scoreLine.destroy();
      retry.destroy();
      this.scene.restart({ character: this.characterData });
    };
    this.input.keyboard?.on('keydown-ENTER', restart);
    this.input.keyboard?.on('keydown-SPACE', restart);
    this.input.on('pointerdown', restart);

    hudBus.set({ gameOver: true });
  }

  private togglePause() {
    if (this.gameOver) return;
    this.setPaused(!this.paused);
  }

  private setPaused(value: boolean) {
    this.paused = value;
    hudBus.set({ paused: value });
    if (value) {
      this.add.text(this.scale.width / 2, this.scale.height / 2, 'PAUSED', {
        fontFamily: 'monospace',
        fontSize: '64px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 8,
      }).setOrigin(0.5).setDepth(3100).setScrollFactor(0).setName('pauseOverlay');
    } else {
      const overlay = this.children.getByName('pauseOverlay');
      overlay?.destroy();
    }
  }

  /** ~20% of slain enemies drop a healing pizza slice. */
  private maybeDropPizza(x: number, y: number) {
    if (Math.random() > 0.2) return;

    const pizza = this.physics.add.sprite(x, y, 'pizza');
    pizza.setScale(1.6);
    pizza.setDepth(y);
    pizza.setCollideWorldBounds(true);
    pizza.setCircle(11);
    this.pickups.add(pizza);

    const glow = this.add.circle(x, y - 8, 20, 0xffd23f, 0.22).setDepth(y - 1);
    this.tweens.add({ targets: glow, alpha: 0.04, duration: 550, yoyo: true, repeat: -1 });
    this.tweens.add({
      targets: pizza,
      y: y - 7,
      duration: 480,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.time.delayedCall(10000, () => {
      if (pizza.active) pizza.destroy();
      glow.destroy();
    });
  }

  spawnEnemies() {
    const enemyCount = 3 + (this.currentLevel * 2);
    for (let i = 0; i < enemyCount; i++) {
      const x = this.cameras.main.scrollX + this.scale.width + Math.random() * 400;
      const y = 480 + Math.random() * 100;

      // Calculate random enemy type based on current wave level
      let enemyType: 'thug' | 'foot_soldier' | 'drone' = 'thug';
      const rand = Math.random();

      if (this.currentLevel === 1) {
        if (rand < 0.7) enemyType = 'thug';
        else if (rand < 0.9) enemyType = 'drone';
        else enemyType = 'foot_soldier';
      } else if (this.currentLevel === 2) {
        if (rand < 0.45) enemyType = 'thug';
        else if (rand < 0.75) enemyType = 'drone';
        else enemyType = 'foot_soldier';
      } else {
        // Level 3+ (Tactical levels)
        if (rand < 0.3) enemyType = 'thug';
        else if (rand < 0.65) enemyType = 'drone';
        else enemyType = 'foot_soldier';
      }

      const enemy = new Enemy(this, x, y, enemyType);
      enemy.setTarget(this.player);
      this.enemies.add(enemy);
    }
  }

  nextLevel() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.currentLevel++;

    // Clear leftover pickups between sectors
    this.pickups.clear(true, true);

    // Play retro level-up/clear chime
    SoundSynth.playLevelUp();

    // Level Clear UI
    const clearText = this.add.text(this.scale.width / 2, this.scale.height / 2, `LEVEL ${this.currentLevel - 1} CLEAR`, {
      fontFamily: 'monospace',
      fontSize: '64px',
      color: '#00ffff',
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(3000);

    this.tweens.add({
      targets: clearText,
      scale: { from: 0.5, to: 1.2 },
      alpha: { from: 1, to: 0 },
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        clearText.destroy();
        this.isTransitioning = false;
        this.spawnEnemies();
        this.levelText.setText(`LEVEL ${this.currentLevel}`);

        // Refill some health on level up
        this.player.heal(20);
      },
    });

    this.cameras.main.flash(1000, 0, 255, 255);
  }

  createUI() {
    // No-op: HUD is now handled by App.tsx (React) via hudBus
    // We only create objects we need to reference
    this.scoreText = this.add.text(0, -100, '');
    this.levelText = this.add.text(0, -100, '');
    this.healthBar = this.add.graphics();
    this.specialBar = this.add.graphics();
  }

  /** Push the live game state into the React HUD (~10Hz). */
  private syncHud() {
    const score = this.player.getScore();
    if (score > this.highScore) {
      this.highScore = score;
      localStorage.setItem(HIGH_SCORE_KEY, String(this.highScore));
    }
    hudBus.set({
      characterName: this.characterData.name.toUpperCase(),
      characterColor: '#' + this.characterData.color.toString(16).padStart(6, '0'),
      portraitFrame: this.characterData.portraitIndex,
      health: this.player.getHealth(),
      lives: this.player.getLives(),
      score,
      highScore: this.highScore,
      gauge: this.player.getSpecialGauge(),
      level: this.currentLevel,
      combo: this.player.getCombo(),
      gameOver: this.gameOver,
      paused: this.paused,
    });
  }

  update() {
    if (this.gameOver) return;

    if (!this.paused) {
      this.player.update(this.cursors, this.virtualControls);
      this.enemies.runChildUpdate = true;
    } else {
      // Freeze the brawl in place while paused
      this.enemies.runChildUpdate = false;
      this.enemies.getChildren().forEach((e: any) => e.setVelocity?.(0, 0));
    }

    // Next Level / Victory condition
    if (this.enemies.countActive() === 0 && !this.isTransitioning && !this.paused) {
      this.nextLevel();
    }

    if (this.player.x > this.scale.width * (WORLD_LENGTH_SCREENS - 0.2)) {
      this.scene.start('CutsceneScene', { player: this.player, character: this.characterData });
    }

    const now = this.time.now;
    if (now - this.hudTimer > 100) {
      this.hudTimer = now;
      this.syncHud();
    }
  }
}
