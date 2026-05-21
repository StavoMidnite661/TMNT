import Phaser from 'phaser';

export default class CutsceneScene extends Phaser.Scene {
  private dialogue: any[] = [];
  private dialogueIndex = 0;
  private nameText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;

  constructor() {
    super('CutsceneScene');
  }

  async init(data: any) {
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000).setOrigin(0);
    const loading = this.add.text(this.scale.width / 2, this.scale.height / 2, 'CONNECTING...', {
       fontFamily: 'monospace', fontSize: '12px'
    }).setOrigin(0.5);

    try {
      const response = await fetch('/api/cutscene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneContext: `The turtle ${data.character.name} has cleared the back alley gangs. They approach a shady industrial terminal.`,
          playerChoice: 'Infiltrate'
        })
      });
      const result = await response.json();
      this.dialogue = result.dialogue || [{ name: 'System', text: 'Connection lost...' }];
      loading.destroy();
      this.showDialogue();
    } catch (e) {
      this.dialogue = [{ name: 'Error', text: 'The shadows are too deep right now.' }];
      loading.destroy();
      this.showDialogue();
    }
  }

  showDialogue() {
    const box = this.add.rectangle(this.scale.width / 2, 210, this.scale.width - 40, 80, 0x111111, 0.9).setOrigin(0.5);
    box.setStrokeStyle(2, 0x444444);

    this.nameText = this.add.text(40, 180, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#ffff00'
    });

    this.messageText = this.add.text(40, 200, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffffff', wordWrap: { width: this.scale.width - 80 }
    });

    this.input.on('pointerdown', () => this.nextStep());
    this.input.keyboard?.on('keydown-SPACE', () => this.nextStep());
    this.input.keyboard?.on('keydown-ENTER', () => this.nextStep());

    this.updateContent();
  }

  nextStep() {
    this.dialogueIndex++;
    if (this.dialogueIndex < this.dialogue.length) {
      this.updateContent();
    } else {
      this.scene.start('TitleScene'); // End for now
    }
  }

  updateContent() {
    const d = this.dialogue[this.dialogueIndex];
    this.nameText.setText(`[ ${d.name} ]`);
    this.messageText.setText(d.text);
  }
}
