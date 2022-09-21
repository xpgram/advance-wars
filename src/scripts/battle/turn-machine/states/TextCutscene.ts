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
    const { gamepad, mapCursor, multiplayer } = this.assets;

    const messages = multiplayer.getMessages();

    if (messages.length > 0) {
      this.textbox = new (Fadable(TextBox))(gamepad, Game.scene.visualLayers.hud,
        ...messages
      );
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