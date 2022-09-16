import { TurnState } from "../TurnState";
import { TextCutscene } from "./TextCutscene";
import { TurnStart } from "./TurnStart";

export class GameStart extends TurnState {
  get type() { return GameStart; }
  get name() { return 'GameStart'; }
  get revertible() { return false; }
  get skipOnUndo() { return false; }

  configureScene() {
    const { scenario, map } = this.assets;

    if (scenario.fogOfWar)
      map.hideSightMap();

    this.advance(TurnStart);
  }

}