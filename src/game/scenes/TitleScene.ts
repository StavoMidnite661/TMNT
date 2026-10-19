import Phaser from 'phaser';
import { hudBus } from '../hudBus';
import SoundSynth from '../utils/SoundSynth';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    // Reset the run state whenever we return to the title screen
    hudBus.reset();

    // Add title background
    const bg = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'title_bg_hq');
    bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);

    // Darken it slightly for text readability
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.4).setOrigin(0);

    // Rain for Title
    this.add.particles(0, 0, 'rain_drop', {
        x: { min: 0, max: this.scale.width },
        y: -10,
        lifespan: 2000,
        speedY: { min: 400, max: 600 },
        speedX: -20,
        scale: { start: 0.1, end: 0.2 },
        quantity: 2,
        alpha: 0.3
    });

    // Title Text (Retro Style with Shadow)
    const titleShadow = this.add.text(this.scale.width / 2 + 4, 150 + 4, 'SHELLS IN THE SHADOWS', {
      fontFamily: 'monospace',
      fontSize: '64px',
      color: '#000000',
      align: 'center'
    }).setOrigin(0.5).setAlpha(0.6);

    const title = this.add.text(this.scale.width / 2, 150, 'SHELLS IN THE SHADOWS', {
      fontFamily: 'monospace',
      fontSize: '64px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 8,
      align: 'center'
    }).setOrigin(0.5);

    this.tweens.add({
        targets: [title, titleShadow],
        y: '+=5',
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    const subtitle = this.add.text(this.scale.width / 2, 210, 'Back Alley Tales', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5);

    // "Press Start" flashing — touch devices tap, keyboards press
    const startLabel = this.sys.game.device.input.touch ? 'TAP TO START' : 'PRESS START';
    const startText = this.add.text(this.scale.width / 2, 500, startLabel, {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      yoyo: true,
      loop: -1
    });

    // Wishlist Fake Button
    const wishlist = this.add.text(this.scale.width / 2, 600, '[ WISHLIST ON STEAM ]', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#aaaaaa'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    wishlist.on('pointerover', () => wishlist.setColor('#ffffff'));
    wishlist.on('pointerout', () => wishlist.setColor('#aaaaaa'));

    // Input to start
    // Audio requires a user gesture — kick off the chiptune loop here
    const bootAudio = () => SoundSynth.startMusic();
    this.input.keyboard?.addCapture('SPACE,ENTER');
    this.input.keyboard?.on('keydown', bootAudio);
    this.input.on('pointerdown', bootAudio);

    this.input.keyboard?.on('keydown-ENTER', () => this.startSelect());
    this.input.keyboard?.on('keydown-SPACE', () => this.startSelect());
    this.input.on('pointerdown', () => this.startSelect());

    // CRT Effect Overlay (Simple scanlines)
    const scanlines = this.add.graphics();
    scanlines.lineStyle(1, 0x000000, 0.1);
    for (let i = 0; i < this.scale.height; i += 2) {
      scanlines.lineBetween(0, i, this.scale.width, i);
    }
    scanlines.setScrollFactor(0);
    scanlines.setDepth(100);
  }

  startSelect() {
    this.scene.start('CharacterSelectScene');
  }
}
