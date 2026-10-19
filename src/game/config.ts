import Phaser from 'phaser';
import PreloadScene from './scenes/PreloadScene';
import TitleScene from './scenes/TitleScene';
import CharacterSelectScene from './scenes/CharacterSelectScene';
import MainScene from './scenes/MainScene';
import CutsceneScene from './scenes/CutsceneScene';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';

export const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [PreloadScene, TitleScene, CharacterSelectScene, MainScene, CutsceneScene],
  // Suppress the browser context menu on long-press / right-click over the canvas
  disableContextMenu: true,
  input: {
    // Multi-touch: keep several fingers tracked (move + attack at once)
    activePointers: 3,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};
