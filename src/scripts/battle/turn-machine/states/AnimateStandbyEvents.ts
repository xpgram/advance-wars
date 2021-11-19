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
    const { boardEvents, mapCursor, camera } = this.assets;

    if (boardEvents.current) {
      const { location } = boardEvents.current;

      if (mapCursor.pos.notEqual(location))
        mapCursor.teleport(new Point(location));

      else if (!camera.subjectInView)
        return;

      else if (!boardEvents.current.playing)
        boardEvents.current.play();

      else if (boardEvents.current.finished)
        boardEvents.next();
        
    } else {
      this.advance();
    }

    // For each standby event:
    // - Move map cursor, or some other follow point
    // - Camera will suspend action until it arrives
    // - Display tile effect:
    //   - 'Supply' message to right or left
    //   - 'Repair' message to right or left
    //   - Ground explosion effect at tile center
    //   - Air explosion effect at tile center
    //   - Water explosion effect at tile center
    //   (accompanying sound effects)
    // - When effect returns 'finished', continue to next
    // - When next==none, advance to next turnstate.

    // this.assets has a reference to an event queue.
    // this iterates over events held by the event queue.
    // an event in the event queue can easily indicate the kind of vfx it is
    // but how do we actually create/play that effect?

    // new TileEvent({...})
    //   name: string
    //   location: Point          // BoardLocation, not absolute
    //   get finished: boolean
    //   play()                   // location is not reference until here
    //   update()
    //   destroy()                // Destroy is called by itself, when it's done.
    //
    // This is unnecessary, but this could be extended with extra information,
    // like damage numbers, etc.
    // I think... if I were to do *that*, I might want to give TileEffect
    // the TileEvent as an argument for construction over just a location.
    // Or maybe just combine the two of them since this information seems
    // inextricable from each other.

    // TODO Fix...
    // TileEventQueue has a reference to assets
    // TileEventType is forcibly passed a reference to assets
    // Unit gets resupplied.
    // Unit creates TileEventType.
    // Unit adds TileEventType to TileEventQueue.
    // How?
    // Unit needs a reference to assets to assets.boardEvents.add(event)
    // Okay.
    // The static solution is the necessary solution then.
    // When an event is created, in its constructor, it adds itself to the event queue.
    // The event queue, in its constructor, adds its reference to assets to a static value.
    // This makes it a singleton in essence, you couldn't have more than one.
    // I guess that's fine, though.

  }
  
}