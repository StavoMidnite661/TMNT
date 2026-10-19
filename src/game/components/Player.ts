import Phaser from 'phaser';
import SoundSynth from '../utils/SoundSynth';
import type { TurtleCharacter } from '../types';

/** Milliseconds of invulnerability after taking a hit. */
const HURT_IFRAMES_MS = 900;
/** Window in which consecutive hits keep the combo alive. */
const COMBO_WINDOW_MS = 1400;
/** Vertical hop impulse (pixels/sec) for the 2.5D jump. */
const JUMP_VELOCITY = 640;
const JUMP_GRAVITY = 1500;

export default class Player extends Phaser.Physics.Arcade.Sprite {
  private characterData: TurtleCharacter;
  private isAttacking = false;
  private isRolling = false;
  private rollCooldown = 0;
  private health = 100;
  private lives = 3;
  private score = 0;
  private specialGauge = 0;
  private comboStep = 0;
  private comboCount = 0;
  private lastAttackTime = 0;
  private lastHitTime = 0;
  private lastHurtTime = 0;
  private isDead = false;

  // 2.5D Movement Vars
  private zHeight = 0;
  private vzVelocity = 0;
  private gravity = JUMP_GRAVITY;
  private floorY = 0;
  private zKey: Phaser.Input.Keyboard.Key | undefined;
  private xKey: Phaser.Input.Keyboard.Key | undefined;

  constructor(scene: Phaser.Scene, x: number, y: number, characterData: TurtleCharacter) {
    const sheet = characterData.spritesheet || 'turtle_sprites';
    super(scene, x, y, sheet);
    this.characterData = characterData;
    this.floorY = y;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.zKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.xKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.X);

    this.setCollideWorldBounds(true);
    this.setScale(1.5);
    this.setBlendMode(Phaser.BlendModes.NORMAL);

    if (sheet === 'turtle_sprites') {
      this.setTint(characterData.color);
      this.setBlendMode(Phaser.BlendModes.NORMAL);
      this.setScale(2.2);
    }

    // Centering 256x256 frame character
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(60, 20); // Feet area for 2.5D depth
    body.setOffset(98, 230);
    this.setOrigin(0.5, 0.95);

    this.createHQAnimations(sheet);
  }

  private get isHQ(): boolean {
    return this.characterData.spritesheet === 'raph_ultra_sprites';
  }

  private createHQAnimations(sheet: string) {
    const anims = this.scene.anims;
    if (sheet === 'raph_ultra_sprites') {
      if (!anims.exists('raph_idle')) {
        anims.create({
          key: 'raph_idle',
          frames: anims.generateFrameNumbers('raph_ultra_sprites', { start: 0, end: 3 }),
          frameRate: 6,
          repeat: -1,
        });
        anims.create({
          key: 'raph_walk',
          frames: anims.generateFrameNumbers('raph_ultra_sprites', { start: 4, end: 7 }),
          frameRate: 10,
          repeat: -1,
        });
        anims.create({
          key: 'raph_attack_1',
          frames: anims.generateFrameNumbers('raph_ultra_sprites', { start: 8, end: 11 }),
          frameRate: 15,
          repeat: 0,
        });
        anims.create({
          key: 'raph_attack_2',
          frames: anims.generateFrameNumbers('raph_ultra_sprites', { start: 12, end: 15 }),
          frameRate: 12,
          repeat: 0,
        });
        anims.create({
          key: 'raph_special',
          frames: anims.generateFrameNumbers('raph_ultra_sprites', { start: 8, end: 15 }),
          frameRate: 20,
          repeat: 2,
        });
      }
    }
  }

  update(cursors: any, controls: any) {
    if (!this.active) return;

    // Invulnerability blink (i-frames) after taking damage
    const now = this.scene.time.now;
    if (now - this.lastHurtTime < HURT_IFRAMES_MS && !this.isDead) {
      this.setAlpha(Math.floor(now / 90) % 2 === 0 ? 0.35 : 1);
    } else if (!this.isDead) {
      this.setAlpha(1);
    }

    // Combo expiry
    if (this.comboCount > 0 && now - this.lastHitTime > COMBO_WINDOW_MS) {
      this.comboCount = 0;
    }

    if (this.isRolling || this.isAttacking) {
      this.handleJumpPhysics();
      this.setDepth(this.body!.y + this.body!.height);
      return;
    }

    const speedX = 220 + (this.characterData.stats.speed * 20);
    const speedY = speedX * 0.6; // Vertical movement is slower for perspective
    const body = this.body as Phaser.Physics.Arcade.Body;
    const walkAnim = this.isHQ ? 'raph_walk' : 'walk';
    const idleAnim = this.isHQ ? 'raph_idle' : 'idle';

    // Horizontal Movement
    if (cursors.left.isDown || controls.left) {
      body.setVelocityX(-speedX);
      this.flipX = true;
      if (this.zHeight === 0) this.play(walkAnim, true);
    } else if (cursors.right.isDown || controls.right) {
      body.setVelocityX(speedX);
      this.flipX = false;
      if (this.zHeight === 0) this.play(walkAnim, true);
    } else {
      body.setVelocityX(0);
    }

    // Vertical Movement (Lanes)
    if (cursors.up.isDown || controls.up) {
      body.setVelocityY(-speedY);
      if (this.zHeight === 0) this.play(walkAnim, true);
    } else if (cursors.down.isDown || controls.down) {
      body.setVelocityY(speedY);
      if (this.zHeight === 0) this.play(walkAnim, true);
    } else {
      body.setVelocityY(0);
      if (body.velocity.x === 0 && this.zHeight === 0) {
        this.play(idleAnim, true);
      }
    }

    // Dodge Roll (Shift / L or the mobile ROLL button)
    if (Phaser.Input.Keyboard.JustDown(cursors.shift) || controls.dodge) {
      this.dodge();
    }

    // Jump (X / I or the mobile JUMP button) — hops lanes and clears melee
    if ((this.xKey?.isDown || controls.jump) && this.zHeight === 0) {
      this.jump();
    }

    // Attack
    if (Phaser.Input.Keyboard.JustDown(cursors.space) || controls.attack) {
      this.attack(now);
    }

    if ((this.zKey?.isDown || controls.special) && this.specialGauge >= 100) {
      this.performSpecial();
    }

    this.handleJumpPhysics();
    // Depth sort by ground Y (feet), not visual Y (which changes during jumps)
    this.setDepth(this.body!.y + this.body!.height);
  }

  private handleJumpPhysics() {
    const dt = Math.min(this.scene.game.loop.delta / 1000, 0.05);
    if (this.zHeight > 0 || this.vzVelocity !== 0) {
      this.vzVelocity -= this.gravity * dt;
      this.zHeight += this.vzVelocity * dt;

      if (this.zHeight <= 0) {
        this.zHeight = 0;
        this.vzVelocity = 0;
      }
    }
    // Visually shift the sprite UP by Z
    this.setY(this.body!.y + this.body!.height - this.zHeight);
  }

  jump() {
    if (this.zHeight > 0 || this.isRolling) return;
    this.vzVelocity = JUMP_VELOCITY;
    SoundSynth.playDodge();
  }

  attack(time: number) {
    if (this.isAttacking || this.zHeight > 0) return;
    this.isAttacking = true;

    // Slight forward lunge on attack
    const lungeForce = 150;
    this.setVelocityX(this.flipX ? -lungeForce : lungeForce);
    this.scene.time.delayedCall(100, () => this.setVelocityX(0));

    // Combo Logic
    if (time - this.lastAttackTime < 600) {
      this.comboStep = (this.comboStep + 1) % 2;
    } else {
      this.comboStep = 0;
    }
    this.lastAttackTime = time;

    const attackAnim = this.isHQ ? (this.comboStep === 0 ? 'raph_attack_1' : 'raph_attack_2') : 'attack';
    const idleAnim = this.isHQ ? 'raph_idle' : 'idle';

    // Play attack sound swing slice
    SoundSynth.playSlice();

    this.play(attackAnim, true);

    this.once(`animationcomplete-${attackAnim}`, () => {
      this.isAttacking = false;
      if (!this.isDead) this.play(idleAnim, true);
    });
  }

  performSpecial() {
    if (this.isAttacking) return;
    this.isAttacking = true;
    this.specialGauge = 0;
    this.setVelocity(0);

    // Trigger special audio swell
    SoundSynth.playSpecial();
    this.scene.events.emit('playerSpecial');

    const specialAnim = this.isHQ ? 'raph_special' : 'attack';
    const idleAnim = this.isHQ ? 'raph_idle' : 'idle';

    this.play(specialAnim, true);

    this.once(`animationcomplete-${specialAnim}`, () => {
      this.isAttacking = false;
      if (!this.isDead) this.play(idleAnim, true);
    });
  }

  dodge() {
    if (this.isRolling || this.isAttacking || this.scene.time.now < this.rollCooldown) return;

    this.isRolling = true;
    this.rollCooldown = this.scene.time.now + 800; // 0.8s cooldown

    // Play dodge roll swoosh
    SoundSynth.playDodge();

    const body = this.body as Phaser.Physics.Arcade.Body;
    const idleAnim = this.isHQ ? 'raph_idle' : 'idle';

    // Direction boost
    const dir = this.flipX ? -1 : 1;
    body.setVelocityX(dir * 800);
    body.setVelocityY(0);

    // Visual effect: Squish and Rotate
    this.scene.tweens.add({
      targets: this,
      angle: 360 * dir,
      scaleY: 0.8,
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.isRolling = false;
        this.angle = 0;
        this.scaleY = this.characterData.spritesheet ? 1.5 : 2.2;
        if (!this.isDead) this.play(idleAnim, true);
      },
    });

    // Afterimage Effect
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 100, () => {
        if (!this.active) return;
        const ghost = this.scene.add.sprite(this.x, this.y, this.texture.key, this.frame.name);
        ghost.setScale(this.scaleX, this.scaleY).setFlipX(this.flipX).setAlpha(0.6).setTint(0x00ffff);
        ghost.setDepth(this.depth - 1);
        this.scene.tweens.add({
          targets: ghost,
          alpha: 0,
          duration: 300,
          onComplete: () => ghost.destroy(),
        });
      });
    }
  }

  /** Returns true when the hit lands (respects i-frames). */
  takeDamage(amount: number): boolean {
    const now = this.scene.time.now;
    if (this.isDead) return false;
    if (this.isRolling) return false; // Invulnerable while rolling
    if (now - this.lastHurtTime < HURT_IFRAMES_MS) return false; // i-frames
    this.lastHurtTime = now;

    this.health = Math.max(0, this.health - amount);
    this.setTint(0xff0000);
    this.scene.time.delayedCall(200, () => this.clearTint());

    // Visceral Damage FX: Camera shake and rapid red tint flash
    this.scene.cameras.main.shake(180, 0.016);
    this.scene.cameras.main.flash(100, 200, 0, 0, false);

    // Emit some blood particles at player coordinates
    const mainScene = this.scene as any;
    if (mainScene.bloodParticles) {
      mainScene.bloodParticles.emitParticleAt(this.x, this.y - 40, 8);
    }

    // Play grunt/impact SFX
    SoundSynth.playPlayerHurt();

    if (this.health <= 0) {
      this.die();
    }
    return true;
  }

  heal(amount: number) {
    this.health = Math.min(100, this.health + amount);
  }

  addScore(points: number) {
    this.score += points;
    this.specialGauge = Math.min(100, this.specialGauge + 5);
    const now = this.scene.time.now;
    this.comboCount += 1;
    this.lastHitTime = now;
  }

  /** Restore after losing a life. */
  respawn(x: number) {
    this.isDead = false;
    this.health = 60;
    this.setAlpha(1);
    this.setPosition(x, this.floorY);
    this.setVelocity(0, 0);
    this.zHeight = 0;
    this.vzVelocity = 0;
    this.isRolling = false;
    this.isAttacking = false;
    this.body!.enable = true;
    this.lastHurtTime = this.scene.time.now; // brief breathing room
    this.specialGauge = Math.min(100, this.specialGauge + 25);
    this.play(this.isHQ ? 'raph_idle' : 'idle', true);
  }

  loseLife() {
    this.lives = Math.max(0, this.lives - 1);
  }

  getHealth() {
    return this.health;
  }
  getLives() {
    return this.lives;
  }
  getScore() {
    return this.score;
  }
  getSpecialGauge() {
    return this.specialGauge;
  }
  getCombo() {
    return this.comboCount;
  }
  getPlayerIsDead() {
    return this.isDead;
  }

  private die() {
    if (this.isDead) return;
    this.isDead = true;
    this.setAlpha(0.5);
    this.body!.enable = false;
    this.scene.events.emit('playerDied');
  }
}
