export interface TurtleStats {
  speed: number;
  power: number;
  range: number;
}

export interface TurtleCharacter {
  id: string;
  name: string;
  color: number;
  weapon: string;
  /** Frame index inside the `portraits_hq` spritesheet (2x2 grid). */
  portraitIndex: number;
  /** Optional HQ spritesheet key. Falls back to the legacy `turtle_sprites` sheet. */
  spritesheet?: string;
  stats: TurtleStats;
}

export interface DialogueLine {
  name: string;
  text: string;
}
