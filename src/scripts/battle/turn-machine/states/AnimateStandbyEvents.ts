import { Point } from "../../../Common/Point";
import { TurnState } from "../TurnState";

export class AnimateStandbyEvents extends TurnState {
  get type() { return AnimateStandbyEvents; }
  get name(): string { return "AnimateStandbyEvents"; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return true; }

  configureScene(): void {

  }

  update(): void {
    const { boardEvents, mapCursor } = this.assets;

    if (boardEvents.current) {
      const { location } = boardEvents.current;

      if (mapCursor.pos.notEqual(location))
        mapCursor.teleport(new Point(location));

      else if (!boardEvents.current.playing && !boardEvents.current.finished)
        boardEvents.current.play();

      else if (boardEvents.current.finished)
        boardEvents.next();
        
    } else {
      this.advance();
    }
  }
  
}