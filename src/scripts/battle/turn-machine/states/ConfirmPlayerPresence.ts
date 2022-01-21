import { TurnState } from "../TurnState";



export class ConfirmPlayerPresence extends TurnState {
  get type() { return ConfirmPlayerPresence; }
  get name() { return 'ConfirmPlayerPresence'; }
  get revertible() { return false; }
  get skipOnUndo() { return false; }

  protected configureScene(): void {
    // TODO only proceed automatically if next player is AI or Internet
    this.advance();

    // TODO Enforce neutral view where all players' stealth units are hidden.
    // TODO On FoW, hide the screen entirely.
    // ---- Wait for button press in both cases.
    // TODO Include a visual prompt to press that button, though.
    // TODO Skip button press when next player is AI or Internet.
  }

  update() {
    const { gamepad } = this.assets;
    if (gamepad.button.A.pressed)
      this.advance();
  }

}