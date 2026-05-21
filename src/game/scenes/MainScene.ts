import Phaser from 'phaser';
import Player from '../components/Player';
import Enemy from '../components/Enemy';
import SoundSynth from '../utils/SoundSynth';

export default class MainScene extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.GameObjects.Group;
  private cursors!: any;
  private characterData: any;
  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private healthBar!: Phaser.GameObjects.Graphics;
  private specialBar!: Phaser.GameObjects.Graphics;
  private currentLevel = 1;
  private isTransitioning = false;
  private debrisParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private bloodParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private sparkParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private virtualControls = {
    up: false, down: false, left: false, right: false, attack: false
  };

  constructor() {
    super('MainScene');
  }

  init(data: any) {
    this.characterData = data.character;
  }

  create() {
    this.isTransitioning = true; // Block level checks during initialization
    const worldWidth = this.scale.width * 5;

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

    // 6. Fast Foreground
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
        blendMode: 'SCREEN'
    }).setScrollFactor(1).setDepth(2000);

    // Player
    this.player = new Player(this, 300, 580, this.characterData);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1, 0, 100);
    this.cameras.main.setBounds(0, 0, worldWidth, this.scale.height);

    // Enemies
    this.enemies = this.add.group({ runChildUpdate: true });
    this.spawnEnemies();
    
    // Block progression for a moment to allow initialization
    this.isTransitioning = true;
    this.time.delayedCall(2000, () => {
        if (this.enemies.countActive() > 0) {
            this.isTransitioning = false;
        }
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
      blendMode: 'NORMAL'
    }).setDepth(1500);

    this.sparkParticles = this.add.particles(0, 0, 'rain_drop', {
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      speed: { min: 200, max: 600 },
      lifespan: 300,
      tint: [0xffffff, 0xffff00, 0xffaa00],
      blendMode: 'SCREEN',
      quantity: 0
    }).setDepth(1600);

    this.debrisParticles = this.add.particles(0, 0, 'rain_drop', {
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      rotate: { min: 0, max: 360 },
      speed: { min: 200, max: 800 },
      lifespan: 800,
      tint: [0x333333, 0x111111, 0x444444],
      gravityY: 1000,
      quantity: 0
    }).setDepth(1550);

    // Collisions
    this.physics.add.overlap(this.player, this.enemies, (p, e) => {
       const player = p as Player;
       const enemy = e as Enemy;
       
       const isAttacking = player.anims.currentAnim?.key.includes('attack') || player.anims.currentAnim?.key.includes('special');
       
       if (isAttacking && (player.anims.currentFrame?.index ?? 0) > 1) {
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
              onComplete: () => hitFlash.destroy()
          });
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
  }

  spawnEnemies() {
    const enemyCount = 3 + (this.currentLevel * 2);
    for (let i = 0; i < enemyCount; i++) {
       const x = this.cameras.main.scrollX + this.scale.width + (Math.random() * 400);
       const y = 480 + Math.random() * 100;
       
       // Calculate random enemy type based on current wave level
       let enemyType: 'thug' | 'foot_soldier' | 'drone' = 'thug';
       const rand = Math.random();
       
       if (this.currentLevel === 1) {
           if (rand < 0.70) enemyType = 'thug';
           else if (rand < 0.90) enemyType = 'drone';
           else enemyType = 'foot_soldier';
       } else if (this.currentLevel === 2) {
           if (rand < 0.45) enemyType = 'thug';
           else if (rand < 0.75) enemyType = 'drone';
           else enemyType = 'foot_soldier';
       } else {
           // Level 3+ (Tactical levels)
           if (rand < 0.30) enemyType = 'thug';
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

    // Play retro level-up/clear chime
    SoundSynth.playLevelUp();

    // Level Clear UI
    const clearText = this.add.text(this.scale.width / 2, this.scale.height / 2, `LEVEL ${this.currentLevel - 1} CLEAR`, {
        fontFamily: 'monospace',
        fontSize: '64px',
        color: '#00ffff',
        stroke: '#000000',
        strokeThickness: 8
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
        }
    });

    this.cameras.main.flash(1000, 0, 255, 255);
  }

  createUI() {
    // No-op: HUD is now handled by App.tsx (React)
    // We only create objects we need to reference
    this.scoreText = this.add.text(0, -100, ''); 
    this.levelText = this.add.text(0, -100, '');
    this.healthBar = this.add.graphics();
    this.specialBar = this.add.graphics();
  }

  update() {
    this.player.update(this.cursors, this.virtualControls);
    
    // Next Level / Victory condition
    if (this.enemies.countActive() === 0 && !this.isTransitioning) {
        this.nextLevel();
    }

    if (this.player.x > this.scale.width * 4.8) {
        this.scene.start('CutsceneScene', { player: this.player, character: this.characterData });
    }
  }
}
