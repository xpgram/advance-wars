import { Game } from "../../../..";
import { TurnState } from "../TurnState";
import { RatifyIssuedOrder } from "./RatifyIssuedOrder";
import { TurnEnd } from "./TurnEnd";


export class WaitForNextInstruction extends TurnState {
  get type() { return WaitForNextInstruction; }
  get name(): string { return "WaitForNextInstruction"; }
  get revertible(): boolean { return false; }
  get skipOnUndo(): boolean { return false; }

  
  protected configureScene(): void {
    const { mapCursor, uiSystem, players, scripts } = this.assets;

    // Blank the instruction. Probably not necessary, but good sanity insurance.
    this.assets.resetCommandInstruction();

    players.all.forEach(player => player.scanCapturedProperties());
    
    mapCursor.show();
    uiSystem.show();
    uiSystem.inspectPlayers();

    // enable control scripts..?
    // scripts.?
  }

  update() {

    const troopEvent = Game.online.instructionQueue.shift();
    if (troopEvent) {
      this.assets.instruction = troopEvent;
      this.advance(RatifyIssuedOrder);
      return;
    }

    if (Game.online.turnSignal) {
      Game.online.turnSignal = false; // consume message
      this.advance(TurnEnd);
      return;
    }

    // TODO Allow access to FieldMenu, but disable 'End Turn'

  }

}