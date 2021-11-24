import { Point } from "../../../Common/Point";
import { TurnState } from "../TurnState";

export class AnimateStandbyEvents extends TurnState {
  get type() { return AnimateStandbyEvents; }
  get name(): string { return "AnimateStandbyEvents"; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return true; }

  cursorPosSwap!: Point;

  configureScene(): void {
    const { mapCursor } = this.assets;
    this.cursorPosSwap = mapCursor.pos;
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

  close(): void {
    const { mapCursor } = this.assets;
    mapCursor.teleport(this.cursorPosSwap);
    //@ts-expect-error
    this.cursorPosSwap = undefined;
  }
  
}