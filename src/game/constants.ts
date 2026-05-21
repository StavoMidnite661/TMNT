export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720; 

export const SCALES = {
  PRELOAD: 'PreloadScene',
  TITLE: 'TitleScene',
  CHARACTER_SELECT: 'CharacterSelectScene',
  GAME: 'MainScene',
  UI: 'UIScene',
  CUTSCENE: 'CutsceneScene'
};

export const TURTLES = {
  LEONARDO: {
    name: 'Leonardo',
    color: 0x0055ff,
    weapon: 'Katana',
    portraitIndex: 0,
    stats: { speed: 3, power: 3, range: 4 }
  },
  RAPHAEL: {
    name: 'Raphael',
    color: 0xff0000,
    weapon: 'Sai',
    portraitIndex: 1,
    spritesheet: 'raph_ultra_sprites',
    stats: { speed: 2, power: 5, range: 2 }
  },
  MICHELANGELO: {
    name: 'Michelangelo',
    color: 0xffa500,
    weapon: 'Nunchaku',
    portraitIndex: 2,
    stats: { speed: 5, power: 2, range: 3 }
  },
  DONATELLO: {
    name: 'Donatello',
    color: 0x800080,
    weapon: 'Bo Staff',
    portraitIndex: 3,
    stats: { speed: 2, power: 3, range: 5 }
  }
};
