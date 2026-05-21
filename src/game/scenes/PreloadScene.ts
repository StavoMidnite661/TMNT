import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // Backgrounds & Parallax
    this.load.image('title_bg_hq', '/src/assets/images/title_screen_ultra_hq_1779012772520.png');
    this.load.image('alley_bg_hq', '/src/assets/images/final_alley_bg_clean_1779188493968.png');
    this.load.image('cityscape_hq', '/src/assets/images/parallax_cityscape_hq_1779012808143.png');
    this.load.image('midground', '/src/assets/images/alley_wall_v4_clean_1779187840821.png');
    
    // Portraits HQ
    this.load.spritesheet('portraits_hq', '/src/assets/images/final_portraits_clean_1779188542466.png', {
        frameWidth: 256,
        frameHeight: 256
    });

    // Sprites Ultra HQ
    this.load.spritesheet('raph_ultra_sprites', '/src/assets/images/final_turtle_sprites_clean_1779188511270.png', {
      frameWidth: 256,
      frameHeight: 256
    });

    this.load.spritesheet('thug_ultra_sprites', '/src/assets/images/final_thug_sprites_clean_1779188526765.png', {
      frameWidth: 256,
      frameHeight: 256
    });

    // Keep legacy for safety or fallback
    this.load.spritesheet('turtle_sprites', '/src/assets/images/turtle_sprites_1779011800123.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    
    // Effects
    this.load.image('rain_drop', 'https://labs.phaser.io/assets/sprites/rain.png');

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
  }

  create() {
    // 0. Clean Spritesheet Textures (Purging Background Alpha Artifacts)
    this.cleanTextureAlpha('raph_ultra_sprites');
    this.cleanTextureAlpha('thug_ultra_sprites');
    this.cleanTextureAlpha('portraits_hq');

    // Generate Procedural Textures for Drone, Bullet & Shuriken
    this.generateProceduralTextures();

    this.scene.start('TitleScene');
  }

  private generateProceduralTextures() {
    // 1. Drone Texture (metallic steel body + glowing neon cyber core)
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

    // 2. Plasma Bullet Texture
    const bulletG = this.make.graphics({ x: 0, y: 0 });
    bulletG.fillStyle(0xffaa00, 0.4);
    bulletG.fillCircle(16, 16, 12);
    bulletG.fillStyle(0xffffff, 1);
    bulletG.fillCircle(16, 16, 6);
    bulletG.generateTexture('plasma_bullet', 32, 32);
    bulletG.destroy();

    // 3. Shuriken Texture
    const shurikenG = this.make.graphics({ x: 0, y: 0 });
    // Metallic center ring
    shurikenG.fillStyle(0x475569, 1);
    shurikenG.fillCircle(16, 16, 5);
    shurikenG.lineStyle(2, 0x94a3b8, 1);
    shurikenG.strokeCircle(16, 16, 5);
    
    // 4 sharp steel blades
    shurikenG.fillStyle(0x94a3b8, 1);
    // Draw blade paths using standard geometry drawings
    shurikenG.fillTriangle(16, 6, 13, 16, 19, 16); // Top blade
    shurikenG.fillTriangle(16, 26, 13, 16, 19, 16); // Bottom blade
    shurikenG.fillTriangle(6, 16, 16, 13, 16, 19); // Left blade
    shurikenG.fillTriangle(26, 16, 16, 13, 16, 19); // Right blade
    
    // Steel highlights
    shurikenG.fillStyle(0xf1f5f9, 1);
    shurikenG.fillCircle(16, 16, 2);

    shurikenG.generateTexture('shuriken_sprite', 32, 32);
    shurikenG.destroy();
  }

  private cleanTextureAlpha(textureKey: string) {
    const texture = this.textures.get(textureKey);
    if (!texture) return;
    
    const source = texture.getSourceImage() as any;
    if (!source) return;

    // Create a temporary canvas to manipulate raw pixels
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(source, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Threshold and purge background artifacts (black/grey and white)
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Target near-black (grey/dark box) OR bright white background artifacts
        const isNearBlack = r < 45 && g < 45 && b < 45;
        const isNearWhite = r > 240 && g > 240 && b > 240;

        if ((isNearBlack || isNearWhite) && data[i + 3] > 0) {
            data[i + 3] = 0;
        }
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
      repeat: -1
    });
    anims.create({
      key: 'walk',
      frames: anims.generateFrameNumbers('turtle_sprites', { start: 2, end: 5 }),
      frameRate: 8,
      repeat: -1
    });
    anims.create({
      key: 'attack',
      frames: anims.generateFrameNumbers('turtle_sprites', { start: 6, end: 9 }),
      frameRate: 15,
      repeat: 0
    });
  }
}
