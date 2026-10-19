import type { TurtleCharacter } from './types';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

/** World width multiplier — the alley is 5 screens long. */
export const WORLD_LENGTH_SCREENS = 5;

export const SCENES = {
  PRELOAD: 'PreloadScene',
  TITLE: 'TitleScene',
  CHARACTER_SELECT: 'CharacterSelectScene',
  GAME: 'MainScene',
  CUTSCENE: 'CutsceneScene',
} as const;

export const TURTLES: Record<string, TurtleCharacter> = {
  LEONARDO: {
    id: 'leo',
    name: 'Leonardo',
    color: 0x0055ff,
    weapon: 'Katana',
    portraitIndex: 0,
    stats: { speed: 3, power: 3, range: 4 },
  },
  RAPHAEL: {
    id: 'raph',
    name: 'Raphael',
    color: 0xff0000,
    weapon: 'Sai',
    portraitIndex: 1,
    spritesheet: 'raph_ultra_sprites',
    stats: { speed: 2, power: 5, range: 2 },
  },
  MICHELANGELO: {
    id: 'mikey',
    name: 'Michelangelo',
    color: 0xffa500,
    weapon: 'Nunchaku',
    portraitIndex: 2,
    stats: { speed: 5, power: 2, range: 3 },
  },
  DONATELLO: {
    id: 'donnie',
    name: 'Donatello',
    color: 0x800080,
    weapon: 'Bo Staff',
    portraitIndex: 3,
    stats: { speed: 2, power: 3, range: 5 },
  },
};

/** Frame order of the 2x2 portraits spritesheet, as CSS object-position pairs. */
export const PORTRAIT_POSITIONS = ['0% 0%', '100% 0%', '0% 100%', '100% 100%'] as const;

export const HIGH_SCORE_KEY = 'sits_highscore';
