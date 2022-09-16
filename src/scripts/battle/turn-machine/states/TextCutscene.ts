import { Game } from "../../../..";
import { Point } from "../../../Common/Point";
import { Fadable } from "../../../system/ui-components/Fadable";
import { TextBox } from "../../../system/ui-components/text-box/TextBox";
import { TurnState, TurnStateConstructor } from "../TurnState";



export class TextCutscene extends TurnState {
  get type(): TurnStateConstructor { return TextCutscene; }
  get name(): string { return 'TextCutscene'; }
  get revertible(): boolean { return false; }
  get skipOnUndo(): boolean { return true; }

  textbox?: TextBox;

  protected configureScene(): void {
    const { gamepad, mapCursor } = this.assets;

    // REMOVE This is a test cutscene demonstrating script and scripted-actions
    // this.textbox = new (Fadable(TextBox))(gamepad, Game.scene.visualLayers.hud,
    //   `Hello.`,
    //   `This is a test of the cutscene feature.`,
    //   `Currently, I can't modify the script. The state-machine that controls the battle system is less sophisticated than the generic one I wrote.`,
    //   `I haven't even started the migration yet. But I think this feature will require it.`,
    //   `Also, check this out:`,
    //   () => {
    //     mapCursor.teleportTo(new Point(0,0))
    //   },
    //   `I can script the movement of scene assets.`,
    //   `Of course, this only works if the assets are accessible, so...\nwhere this script data is kept is something I'll have to think about.`,
    // )

    if (Game.online.messageQueue.length > 0) {
      this.textbox = new (Fadable(TextBox))(gamepad, Game.scene.visualLayers.hud,
        ...Game.online.messageQueue
      );
      Game.online.messageQueue = [];  // Clear the queue.
    }
    else  // If no messages, just move on
      this.advance();
  }

  update(): void {
    if (this.textbox?.finished)
      this.advance();
  }

  close(): void {
    this.textbox?.destroy();
  }

}