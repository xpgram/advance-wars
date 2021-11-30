import { Point } from "../../../Common/Point";
import { TurnState } from "../TurnState";

/** This step is a shorthand for collection of animation steps. */
export class AnimateEvents extends TurnState {
  get type() { return AnimateEvents; }
  get name(): string { return 'AnimateEvents'; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return true; }

  cursorPosSwap!: Point;

  configureScene(): void {
    const { mapCursor, trackCar } = this.assets;
    this.cursorPosSwap = mapCursor.pos;

    if (trackCar.started)   // Show acting unit if this is the 2nd standby event.
      trackCar.show();
  }

  update(): void {
    const { boardEvents, mapCursor, camera } = this.assets;

    if (boardEvents.current) {
      const { location } = boardEvents.current;

      if (mapCursor.pos.notEqual(location))
        mapCursor.teleport(new Point(location));

      if (camera.subjectInView && !boardEvents.current.playing && !boardEvents.current.finished)
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