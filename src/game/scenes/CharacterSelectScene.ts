import Phaser from 'phaser';
import { TURTLES } from '../constants';
import { hudBus } from '../hudBus';

export default class CharacterSelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private turtles = Object.values(TURTLES);
  private nameText!: Phaser.GameObjects.Text;
  private weaponText!: Phaser.GameObjects.Text;
  private statGroup!: Phaser.GameObjects.Group;
  private turtleSprites: Phaser.GameObjects.Image[] = [];

  constructor() {
    super('CharacterSelectScene');
  }

  create() {
    // Tell the React shell where we are (gates the virtual gamepad)
    hudBus.set({ screen: 'select' });

    // Cinematic background
    const bg = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'alley_bg_hq');
    bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height).setAlpha(0.6).setTint(0x4444ff);

    // Rain for Select Screen
    this.add.particles(0, 0, 'rain_drop', {
        x: { min: 0, max: this.scale.width },
        y: -10,
        lifespan: 2000,
        speedY: { min: 600, max: 900 },
        speedX: -30,
        scale: { start: 0.1, end: 0.2 },
        quantity: 3,
        alpha: 0.2
    });

    // Vignette
    const vignette = this.add.graphics();
    vignette.fillStyle(0x000000, 0.4);
    vignette.fillRect(0, 0, this.scale.width, this.scale.height);
    
    this.add.text(this.scale.width / 2, 80, 'CHOOSE YOUR BROTHER', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);

    // Display turtles
    const spacing = 220;
    const startX = (this.scale.width - (spacing * 3)) / 2;

    this.turtles.forEach((turtle, i) => {
      const x = startX + (i * spacing);
      const y = 300;

      // Card Background
      this.add.rectangle(x, y, 180, 260, 0x000000, 0.7).setStrokeStyle(4, 0x333333);

      // Portraits
      const portrait = this.add.image(x, y - 40, 'portraits_hq', i); // Use frame index i
      portrait.setDisplaySize(160, 160);
      portrait.setBlendMode(Phaser.BlendModes.NORMAL);
      
      // frame 0: Leo, 1: Raph, 2: Mikey, 3: Donnie (Matches final clean 2x2 grid)
      
      this.add.text(x, y + 80, turtle.name.toUpperCase(), {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
        align: 'center'
      }).setOrigin(0.5);

      portrait.setInteractive({ useHandCursor: true });
      portrait.on('pointerdown', () => {
        if (this.selectedIndex === i) {
          // Tapping the already-selected brother deploys — this is how the
          // game starts on touch devices (no keyboard required).
          this.startGame();
        } else {
          this.selectedIndex = i;
          this.updateSelection();
        }
      });

      this.turtleSprites.push(portrait);
    });

    // Info panel
    const infoBg = this.add.rectangle(this.scale.width / 2, 580, 600, 140, 0x000000, 0.8).setStrokeStyle(2, 0x444444);
    
    this.nameText = this.add.text(this.scale.width / 2, 540, '', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.weaponText = this.add.text(this.scale.width / 2, 575, '', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    this.statGroup = this.add.group();

    const prompt = this.add.text(this.scale.width / 2, 680, 'TAP SELECTED TURTLE • [SPACE] / [ENTER] TO INFILTRATE', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    prompt.on('pointerdown', () => this.startGame());
    prompt.on('pointerover', () => prompt.setColor('#ffffff'));
    prompt.on('pointerout', () => prompt.setColor('#ffff00'));
    this.tweens.add({ targets: prompt, alpha: 0.55, duration: 600, yoyo: true, repeat: -1 });

    // Controls
    this.input.keyboard?.addCapture('LEFT,RIGHT,SPACE,ENTER');
    this.input.keyboard?.on('keydown-LEFT', () => {
      this.selectedIndex = (this.selectedIndex - 1 + this.turtles.length) % this.turtles.length;
      this.updateSelection();
    });
    this.input.keyboard?.on('keydown-RIGHT', () => {
      this.selectedIndex = (this.selectedIndex + 1) % this.turtles.length;
      this.updateSelection();
    });
    this.input.keyboard?.on('keydown-ENTER', () => this.startGame());
    this.input.keyboard?.on('keydown-SPACE', () => this.startGame());

    this.selectedIndex = 1; // Start with Raph
    this.updateSelection();
  }

  updateSelection() {
    const turtle = this.turtles[this.selectedIndex];
    this.nameText.setText(turtle.name.toUpperCase()).setColor('#' + turtle.color.toString(16).padStart(6, '0'));
    this.weaponText.setText('PRIMARY: ' + turtle.weapon);

    // Highlight selected sprite
    this.turtleSprites.forEach((sprite, i) => {
      if (i === this.selectedIndex) {
        sprite.setAlpha(1).setScale(1.1).setTint(0xffffff);
      } else {
        sprite.setAlpha(0.4).setScale(1).setTint(0x888888);
      }
    });

    // Draw stats
    this.statGroup.clear(true, true);
    const stats = turtle.stats as any;
    let y = 610;
    Object.keys(stats).forEach(key => {
       const val = stats[key];
       const statName = this.add.text(this.scale.width / 2 - 280, y - 5, key.toUpperCase(), {
           fontFamily: 'monospace', fontSize: '10px', color: '#666666'
       });
       const bar = this.add.graphics();
       bar.fillStyle(0x222222);
       bar.fillRect(this.scale.width / 2 - 200, y, 400, 6);
       bar.fillStyle(turtle.color);
       bar.fillRect(this.scale.width / 2 - 200, y, val * 80, 6);
       this.statGroup.add(bar);
       this.statGroup.add(statName);
       y += 12;
    });
  }

  startGame() {
    const turtle = this.turtles[this.selectedIndex];
    // Pre-arm the React HUD with the chosen brother
    hudBus.set({
      characterName: turtle.name.toUpperCase(),
      characterColor: '#' + turtle.color.toString(16).padStart(6, '0'),
      portraitFrame: turtle.portraitIndex,
    });
    this.scene.start('MainScene', { character: turtle });
  }
}
