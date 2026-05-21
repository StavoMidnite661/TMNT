import Phaser from 'phaser';
import SoundSynth from '../utils/SoundSynth';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  private health = 20;
  private isDead = false;
  private target?: Phaser.GameObjects.Sprite;
  private enemyType: 'thug' | 'foot_soldier' | 'drone';
  private lastAttackTime = 0;
  private attackCooldown = 1500;

  constructor(scene: Phaser.Scene, x: number, y: number, type: 'thug' | 'foot_soldier' | 'drone' = 'thug') {
    super(scene, x, y, type === 'drone' ? 'drone_sprite' : 'thug_ultra_sprites'); 
    this.enemyType = type;
    
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setBlendMode(Phaser.BlendModes.NORMAL);
    
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (type === 'drone') {
        this.health = 15;
        this.setScale(1.2);
        this.setOrigin(0.5, 0.5);
        body.setSize(32, 32);
        body.setOffset(16, 16);
        body.setAllowGravity(false); // Hovering/flying drone
        this.attackCooldown = 2200;
    } else if (type === 'foot_soldier') {
        this.health = 20;
        this.setScale(1.2, 1.4); // Taller, slim ninja physique
        this.setOrigin(0.5, 0.95);
        body.setSize(50, 20); // Accurate feet area for 2.5D
        body.setOffset(103, 230); 
        this.setTint(0x7c3aed); // Neon Purple clothing
        this.attackCooldown = 2400;
        this.createHQAnimations();
    } else {
        // Standard bulky street thug
        this.health = 30;
        this.setScale(1.5);
        this.setOrigin(0.5, 0.95);
        body.setSize(60, 20); 
        body.setOffset(98, 230); 
        this.attackCooldown = 1800;
        this.createHQAnimations();
    }
    
    this.setDepth(y);
  }

  setTarget(target: Phaser.GameObjects.Sprite) {
    this.target = target;
  }

  private createHQAnimations() {
    const anims = this.scene.anims;
    if (!anims.exists('thug_idle')) {
        anims.create({
            key: 'thug_idle',
            frames: anims.generateFrameNumbers('thug_ultra_sprites', { start: 0, end: 3 }),
            frameRate: 6, repeat: -1
        });
        anims.create({
            key: 'thug_walk',
            frames: anims.generateFrameNumbers('thug_ultra_sprites', { start: 4, end: 7 }),
            frameRate: 10, repeat: -1
        });
        anims.create({
            key: 'thug_attack',
            frames: anims.generateFrameNumbers('thug_ultra_sprites', { start: 8, end: 11 }),
            frameRate: 12, repeat: 0
        });
        anims.create({
            key: 'thug_hurt',
            frames: anims.generateFrameNumbers('thug_ultra_sprites', { start: 12, end: 15 }),
            frameRate: 12, repeat: 0
        });
    }
  }

  update() {
    if (this.isDead || !this.target) return;

    const now = this.scene.time.now;

    // --- CYBER DRONE BEHAVIOR ---
    if (this.enemyType === 'drone') {
        const baseIdealY = this.target.y - 80;
        const hoverY = baseIdealY + Math.sin(now / 180) * 12;
        const dy = hoverY - this.y;
        
        const targetDistX = this.target.x - this.x;
        const idealX = this.target.x + (targetDistX > 0 ? -180 : 180);
        const dx = idealX - this.x;
        
        // Flight physics steering
        this.setVelocityX(dx * 2);
        this.setVelocityY(dy * 3);
        
        this.flipX = targetDistX < 0;
        
        // Cyber Thruster Jet Flare Particle Exhaust
        if (Math.random() < 0.2) {
            const btX = this.x + (this.flipX ? 6 : -6);
            const btY = this.y + 14;
            const jet = this.scene.add.circle(btX, btY, 3, 0x00f3ff, 0.82);
            jet.setDepth(this.depth - 1);
            this.scene.tweens.add({
                targets: jet,
                y: btY + 25 + Math.random() * 12,
                x: btX + (Math.random() - 0.5) * 6,
                alpha: 0,
                scale: 0.1,
                duration: 220,
                onComplete: () => jet.destroy()
            });
        }
        
        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
        if (distance < 500 && now - this.lastAttackTime > this.attackCooldown) {
            this.lastAttackTime = now;
            this.fireDroneLaser();
        }
        return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // --- FOOT SOLDIER (NINJA) BEHAVIOR ---
    if (this.enemyType === 'foot_soldier') {
        if (distance < 550 && distance > 180) {
            // Highly agile ninja movement closing in or throwing projectiles
            const speedX = 180;
            const speedY = speedX * 0.6;
            this.setVelocityX(dx > 0 ? speedX : -speedX);
            this.setVelocityY(dy > 0 ? speedY : -speedY);
            this.flipX = dx < 0;
            this.play('thug_walk', true);

            // Shuriken Projectile thrown at mid-range
            if (now - this.lastAttackTime > this.attackCooldown) {
                this.lastAttackTime = now;
                this.throwNinjaShuriken();
            }
        } else if (distance <= 180 && distance > 55) {
            // Run inside to secure melee territory rapidly
            const speedX = 220;
            const speedY = speedX * 0.6;
            this.setVelocityX(dx > 0 ? speedX : -speedX);
            this.setVelocityY(dy > 0 ? speedY : -speedY);
            this.flipX = dx < 0;
            this.play('thug_walk', true);
        } else if (distance <= 55) {
            this.setVelocity(0);
            this.play('thug_idle', true);
            
            // Fast close combat ninja sweep
            if (now - this.lastAttackTime > this.attackCooldown) {
                this.lastAttackTime = now;
                this.play('thug_attack', true);
                (this.target as any).takeDamage(8);
                
                this.once('animationcomplete-thug_attack', () => {
                   if (!this.isDead) this.play('thug_idle', true);
                });
            }
        } else {
            this.setVelocity(0);
            this.play('thug_idle', true);
        }
    } 
    // --- CLASSIC BULKY THUG BEHAVIOR ---
    else {
        if (distance < 500 && distance > 50) {
          const speedX = 120;
          const speedY = speedX * 0.6;
          this.setVelocityX(dx > 0 ? speedX : -speedX);
          this.setVelocityY(dy > 0 ? speedY : -speedY);
          this.flipX = dx < 0;
          this.play('thug_walk', true);
        } else if (distance <= 50) {
          this.setVelocity(0);
          this.play('thug_idle', true);
          
          if (now - this.lastAttackTime > this.attackCooldown) {
              this.lastAttackTime = now;
              this.play('thug_attack', true);
              (this.target as any).takeDamage(5);
              
              this.once('animationcomplete-thug_attack', () => {
                 if (!this.isDead) this.play('thug_idle', true);
              });
          }
        } else {
          this.setVelocity(0);
          this.play('thug_idle', true);
        }
    }

    // Depth sorting based on feet/bottom of sprite
    this.setDepth(this.body!.y + this.body!.height);
  }

  private throwNinjaShuriken() {
    if (this.isDead || !this.target) return;

    this.setVelocity(0);
    this.play('thug_attack', true);

    this.scene.time.delayedCall(200, () => {
        if (this.isDead || !this.target) return;

        // Play shuriken throw whoosh whistle
        SoundSynth.playShuriken();

        const sx = this.x + (this.flipX ? -25 : 25);
        const sy = this.y - 45;
        const shurikenObj = this.scene.physics.add.sprite(sx, sy, 'shuriken_sprite');
        shurikenObj.setDepth(2000);

        // Spin shuriken continuously
        this.scene.tweens.add({
            targets: shurikenObj,
            angle: 360,
            repeat: -1,
            duration: 120
        });

        // Fast throw physics vector targeting the player
        const angle = Phaser.Math.Angle.Between(sx, sy, this.target.x, this.target.y);
        const speed = 460;
        shurikenObj.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

        const overlap = this.scene.physics.add.overlap(shurikenObj, this.target, (_shur, playerObj) => {
            (playerObj as any).takeDamage(7);

            // Shuriken metal sparkle glow
            const flash = this.scene.add.circle(shurikenObj.x, shurikenObj.y, 10, 0xffaa00, 0.7);
            flash.setDepth(2100);
            this.scene.tweens.add({
                targets: flash,
                scale: 3,
                alpha: 0,
                duration: 120,
                onComplete: () => flash.destroy()
            });

            shurikenObj.destroy();
            overlap.destroy();
        });

        // Auto clean shurikens that go off world bounds
        this.scene.time.delayedCall(3000, () => {
            if (shurikenObj.active) {
                shurikenObj.destroy();
                overlap.destroy();
            }
        });
    });

    this.once('animationcomplete-thug_attack', () => {
        if (!this.isDead) this.play('thug_idle', true);
    });
  }

  private fireDroneLaser() {
    if (this.isDead || !this.target) return;

    // Threat scanner red indicators glow
    this.setTint(0xff3b30);
    this.scene.time.delayedCall(200, () => {
        if (!this.isDead) this.clearTint();
    });

    // Play drone laser chirp
    SoundSynth.playLaser();

    const lx = this.x + (this.flipX ? 8 : -8);
    const ly = this.y + 10;
    const laserObj = this.scene.physics.add.sprite(lx, ly, 'plasma_bullet');
    laserObj.setDepth(2000);

    const angle = Phaser.Math.Angle.Between(lx, ly, this.target.x, this.target.y);
    const speed = 380;
    laserObj.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    laserObj.setRotation(angle);

    const overlap = this.scene.physics.add.overlap(laserObj, this.target, (_laser, playerObj) => {
        (playerObj as any).takeDamage(6);

        // Cyber energy impact flash
        const energyGlow = this.scene.add.circle(laserObj.x, laserObj.y, 12, 0x00f3ff, 0.85);
        energyGlow.setDepth(2100);
        this.scene.tweens.add({
            targets: energyGlow,
            scale: 3.5,
            alpha: 0,
            duration: 150,
            onComplete: () => energyGlow.destroy()
        });

        laserObj.destroy();
        overlap.destroy();
    });

    this.scene.time.delayedCall(3200, () => {
        if (laserObj.active) {
            laserObj.destroy();
            overlap.destroy();
        }
    });
  }

  takeDamage(amount: number) {
    if (this.isDead) return;
    this.health -= amount;
    this.setTint(0xff0000);
    this.scene.time.delayedCall(150, () => this.clearTint());

    if (this.enemyType !== 'drone') {
        this.play('thug_hurt', true);
        const knockbackDir = this.target ? (this.x > this.target.x ? 1 : -1) : 0;
        this.setVelocityX(knockbackDir * 300);
        this.scene.time.delayedCall(200, () => {
            if (!this.isDead) this.setVelocityX(0);
        });
    } else {
        // Drone hit jolt
        const flipDir = this.target ? (this.x > this.target.x ? 1 : -1) : 0;
        this.x += flipDir * 16;
    }

    if (this.health <= 0) {
      this.die();
    }
  }

  public getHealth() { return this.health; }

  private die() {
    this.isDead = true;
    this.setVelocity(0);
    this.body!.enable = false;
    
    // Play sci-fi drone explosion or physical thug punchout dynamic audio
    SoundSynth.playEnemyDeath();
    
    // Flyback direction calculation
    const dir = this.target ? (this.x > this.target.x ? 1 : -1) : 0;
    this.setVelocityX(dir * 350);
    this.setVelocityY(-260);

    // Dynamic exploding elements for the robot drone
    if (this.enemyType === 'drone') {
        const boomGlow = this.scene.add.circle(this.x, this.y, 35, 0x00ffff, 0.8);
        boomGlow.setDepth(2500);
        this.scene.tweens.add({
            targets: boomGlow,
            scale: 2.8,
            alpha: 0,
            duration: 250,
            onComplete: () => boomGlow.destroy()
        });

        // 12 robotic metal scrap particles flying in vectors
        for (let i = 0; i < 12; i++) {
            const metalScrap = this.scene.add.circle(this.x, this.y, Math.random() * 3 + 1.5, 0x94a3b8, 1);
            metalScrap.setDepth(2400);
            this.scene.physics.add.existing(metalScrap);
            const mBody = metalScrap.body as Phaser.Physics.Arcade.Body;
            mBody.setVelocity((Math.random() - 0.5) * 380, (Math.random() * -300) - 100);
            mBody.setGravityY(800);
            
            this.scene.tweens.add({
                targets: metalScrap,
                alpha: 0,
                duration: 650,
                delay: 150,
                onComplete: () => metalScrap.destroy()
            });
        }
    }
    
    this.scene.tweens.add({
        targets: this,
        alpha: 0,
        scale: this.enemyType === 'drone' ? 1.8 : 2.2,
        angle: 180 * (this.flipX ? -1 : 1),
        duration: 800,
        ease: 'Power2',
        onComplete: () => this.destroy()
    });
  }
}
