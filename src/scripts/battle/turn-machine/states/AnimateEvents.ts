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
    this.cursorPosSwap = mapCursor.boardLocation;

    if (trackCar.started)   // Show acting unit if this is the 2nd standby event.
      trackCar.show();
  }

  update(): void {
    const { boardEvents, mapCursor, camera } = this.assets;

    if (boardEvents.eventsInQueue) {
      const location = boardEvents.boardLocation || mapCursor.boardLocation;

      if (mapCursor.boardLocation.notEqual(location))
        mapCursor.teleportTo(new Point(location));

      if (camera.subjectInView && !boardEvents.batchPlaying && !boardEvents.batchFinished)
        boardEvents.batchPlay();

      else if (boardEvents.batchFinished)
        boardEvents.next();
        
    } else {
      this.advance();
    }
  }

  close(): void {
    const { mapCursor } = this.assets;
    mapCursor.teleportTo(this.cursorPosSwap);
    //@ts-expect-error
    this.cursorPosSwap = undefined;
  }

}