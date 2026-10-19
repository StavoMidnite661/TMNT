import Phaser from 'phaser';
import { hudBus } from '../hudBus';
import type { DialogueLine } from '../types';

const FALLBACK_DIALOGUE: DialogueLine[] = [
  { name: 'Splinter', text: 'The alley is quiet... too quiet. The Foot is gathering beyond the docks.' },
  { name: 'Raphael', text: "Quiet never stopped them before. Let's move." },
];

export default class CutsceneScene extends Phaser.Scene {
  private dialogue: DialogueLine[] = [];
  private dialogueIndex = 0;
  private nameText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private failed = false;

  constructor() {
    super('CutsceneScene');
  }

  async init(data: any) {
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000).setOrigin(0);
    this.statusText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'CONNECTING...', {
      fontFamily: 'monospace',
      fontSize: '12px',
    }).setOrigin(0.5);

    try {
      const response = await fetch('/api/cutscene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneContext: `The turtle ${data.character.name} has cleared the back alley gangs. They approach a shady industrial terminal.`,
          playerChoice: 'Infiltrate',
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      this.dialogue = Array.isArray(result.dialogue) && result.dialogue.length > 0 ? result.dialogue : FALLBACK_DIALOGUE;
      this.statusText.destroy();
      this.showDialogue();
    } catch (e) {
      console.warn('[Cutscene] AI dialogue unavailable, using fallback.', e);
      this.failed = true;
      this.dialogue = FALLBACK_DIALOGUE;
      this.statusText.setText('SIGNAL LOST — PRESS ANY KEY TO RETRY / CONTINUE');
      this.showDialogue();
    }
  }

  showDialogue() {
    const box = this.add.rectangle(this.scale.width / 2, 210, this.scale.width - 40, 80, 0x111111, 0.9).setOrigin(0.5);
    box.setStrokeStyle(2, 0x444444);

    this.nameText = this.add.text(40, 180, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffff00',
    });

    this.messageText = this.add.text(40, 200, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffffff',
      wordWrap: { width: this.scale.width - 80 },
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
    if (!d) return;
    this.nameText.setText(`[ ${d.name} ]`);
    this.messageText.setText(d.text);
    // Mirror the AI dialogue into the React HUD radio feed
    hudBus.set({ dialogue: d });
  }
}
