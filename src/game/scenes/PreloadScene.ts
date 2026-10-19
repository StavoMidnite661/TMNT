import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // Backgrounds & Parallax
    this.load.image('title_bg_hq', 'assets/images/title_screen_ultra_hq_1779012772520.png');
    this.load.image('alley_bg_hq', 'assets/images/final_alley_bg_clean_1779188493968.png');
    this.load.image('cityscape_hq', 'assets/images/parallax_cityscape_hq_1779012808143.png');
    this.load.image('midground', 'assets/images/alley_wall_v4_clean_1779187840821.png');
    this.load.image('foreground', 'assets/images/parallax_foreground_1779012496463.png');

    // Portraits HQ
    this.load.spritesheet('portraits_hq', 'assets/images/final_portraits_clean_1779188542466.png', {
      frameWidth: 256,
      frameHeight: 256,
    });

    // Sprites Ultra HQ
    this.load.spritesheet('raph_ultra_sprites', 'assets/images/final_turtle_sprites_clean_1779188511270.png', {
      frameWidth: 256,
      frameHeight: 256,
    });

    this.load.spritesheet('thug_ultra_sprites', 'assets/images/final_thug_sprites_clean_1779188526765.png', {
      frameWidth: 256,
      frameHeight: 256,
    });

    // Keep legacy for safety or fallback
    this.load.spritesheet('turtle_sprites', 'assets/images/turtle_sprites_1779011800123.png', {
      frameWidth: 64,
      frameHeight: 64,
    });

    // Rain is generated procedurally below — no external runtime dependency.

    // Simple progress bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x4444ff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      this.createAnimations();
      progressBar.destroy();
      progressBox.destroy();
    });

    // Never leave the player stuck on a broken asset — fall back to the title.
    this.load.on('loaderror', (file: { src?: string }) => {
      console.warn('[Preload] Failed to load asset:', file?.src);
    });
  }

  create() {
    // 0. Clean Spritesheet Textures (Purging Background Alpha Artifacts)
    this.cleanTextureAlpha('raph_ultra_sprites');
    this.cleanTextureAlpha('thug_ultra_sprites');
    this.cleanTextureAlpha('portraits_hq');

    // Generate Procedural Textures for Rain, Drone, Bullet & Shuriken
    this.generateProceduralTextures();

    this.scene.start('TitleScene');
  }

  private generateProceduralTextures() {
    // 1. Rain drop streak (replaces the remote labs.phaser.io asset)
    const rainG = this.make.graphics({ x: 0, y: 0 });
    rainG.fillStyle(0x9fc8ff, 0.9);
    rainG.fillTriangle(4, 0, 12, 0, 8, 32);
    rainG.fillStyle(0xffffff, 0.5);
    rainG.fillTriangle(6, 0, 10, 0, 8, 32);
    rainG.generateTexture('rain_drop', 16, 32);
    rainG.destroy();

    // 2. Drone Texture (metallic steel body + glowing neon cyber core)
    const droneG = this.make.graphics({ x: 0, y: 0 });

    // Shadow under drone
    droneG.fillStyle(0x000000, 0.4);
    droneG.fillCircle(32, 32, 28);

    // Metallic outer Ring
    droneG.lineStyle(4, 0x475569, 1);
    droneG.fillStyle(0x1e293b, 1);
    droneG.fillCircle(32, 32, 22);
    droneG.strokeCircle(32, 32, 22);

    // Secondary mechanical shell elements (wings/antennae aesthetics)
    droneG.fillStyle(0x334155, 1);
    droneG.fillRect(8, 28, 6, 8); // Left thruster joint
    droneG.fillRect(50, 28, 6, 8); // Right thruster joint

    droneG.lineStyle(2, 0x00f0ff, 1);
    droneG.strokeLineShape(new Phaser.Geom.Line(14, 32, 50, 32));

    // Inner glass dome
    droneG.fillStyle(0x0f172a, 1);
    droneG.fillCircle(32, 32, 14);

    // Glowing Laser/Scanner Core
    droneG.lineStyle(1, 0xff0055, 0.5);
    droneG.fillStyle(0xff0000, 1);
    droneG.fillCircle(32, 32, 8);

    // Highlight
    droneG.fillStyle(0xffffff, 0.8);
    droneG.fillCircle(30, 30, 3);

    droneG.generateTexture('drone_sprite', 64, 64);
    droneG.destroy();

    // 3. Plasma Bullet Texture
    const bulletG = this.make.graphics({ x: 0, y: 0 });
    bulletG.fillStyle(0xffaa00, 0.4);
    bulletG.fillCircle(16, 16, 12);
    bulletG.fillStyle(0xffffff, 1);
    bulletG.fillCircle(16, 16, 6);
    bulletG.generateTexture('plasma_bullet', 32, 32);
    bulletG.destroy();

    // 4. Shuriken Texture
    const shurikenG = this.make.graphics({ x: 0, y: 0 });
    // Metallic center ring
    shurikenG.fillStyle(0x475569, 1);
    shurikenG.fillCircle(16, 16, 5);
    shurikenG.lineStyle(2, 0x94a3b8, 1);
    shurikenG.strokeCircle(16, 16, 5);

    // 4 sharp steel blades
    shurikenG.fillStyle(0x94a3b8, 1);
    shurikenG.fillTriangle(16, 6, 13, 16, 19, 16); // Top blade
    shurikenG.fillTriangle(16, 26, 13, 16, 19, 16); // Bottom blade
    shurikenG.fillTriangle(6, 16, 16, 13, 16, 19); // Left blade
    shurikenG.fillTriangle(26, 16, 16, 13, 16, 19); // Right blade

    // Steel highlights
    shurikenG.fillStyle(0xf1f5f9, 1);
    shurikenG.fillCircle(16, 16, 2);

    // 5. Pizza slice Texture (health pickup)
    const pizzaG = this.make.graphics({ x: 0, y: 0 });
    // Crust (tan outer triangle)
    pizzaG.fillStyle(0xd9a441, 1);
    pizzaG.fillTriangle(2, 4, 30, 4, 16, 30);
    // Cheese
    pizzaG.fillStyle(0xffd23f, 1);
    pizzaG.fillTriangle(6, 7, 26, 7, 16, 25);
    // Pepperoni
    pizzaG.fillStyle(0xc0392b, 1);
    pizzaG.fillCircle(12, 12, 2.5);
    pizzaG.fillCircle(20, 14, 2.5);
    pizzaG.fillCircle(16, 20, 2.5);
    pizzaG.generateTexture('pizza', 32, 32);
    pizzaG.destroy();

    shurikenG.generateTexture('shuriken_sprite', 32, 32);
    shurikenG.destroy();
  }

  /**
   * The source art is JPEG-compressed (no alpha channel), so sprites ship with
   * a solid near-black/near-white backdrop. Instead of globally keying every
   * dark/light pixel (which punched holes into white highlights and black
   * outlines), flood-fill from the image borders so only the background
   * connected to the edges becomes transparent.
   */
  private cleanTextureAlpha(textureKey: string) {
    const texture = this.textures.get(textureKey);
    if (!texture) return;

    const source = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | null;
    if (!source) return;

    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(source, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width;
    const h = canvas.height;

    const isBackgroundPixel = (i: number) => {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const isNearBlack = r < 45 && g < 45 && b < 45;
      const isNearWhite = r > 240 && g > 240 && b > 240;
      return isNearBlack || isNearWhite;
    };

    // Flood fill from every border pixel (iterative stack, no recursion limits).
    const visited = new Uint8Array(w * h);
    const stack: number[] = [];
    for (let x = 0; x < w; x++) {
      stack.push(x, (h - 1) * w + x);
    }
    for (let y = 0; y < h; y++) {
      stack.push(y * w, y * w + (w - 1));
    }

    while (stack.length > 0) {
      const p = stack.pop() as number;
      if (visited[p]) continue;
      visited[p] = 1;

      const i = p * 4;
      if (data[i + 3] === 0) continue; // already transparent
      if (!isBackgroundPixel(i)) continue; // foreground pixel — stop flooding here

      data[i + 3] = 0;

      const x = p % w;
      const y = (p / w) | 0;
      if (x > 0) stack.push(p - 1);
      if (x < w - 1) stack.push(p + 1);
      if (y > 0) stack.push(p - w);
      if (y < h - 1) stack.push(p + w);
    }

    ctx.putImageData(imageData, 0, 0);
    texture.setSource(canvas);
  }

  createAnimations() {
    const anims = this.anims;
    anims.create({
      key: 'idle',
      frames: anims.generateFrameNumbers('turtle_sprites', { start: 0, end: 1 }),
      frameRate: 4,
      repeat: -1,
    });
    anims.create({
      key: 'walk',
      frames: anims.generateFrameNumbers('turtle_sprites', { start: 2, end: 5 }),
      frameRate: 8,
      repeat: -1,
    });
    anims.create({
      key: 'attack',
      frames: anims.generateFrameNumbers('turtle_sprites', { start: 6, end: 9 }),
      frameRate: 15,
      repeat: 0,
    });
  }
}
