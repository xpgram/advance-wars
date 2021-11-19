import { TurnState } from "../TurnState";

export class AnimateStandbyEvents extends TurnState {
  get type() { return AnimateStandbyEvents; }
  get name(): string { return "AnimateStandbyEvents"; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return true; }

  configureScene(): void {
    this.advance();
  }

  update(): void {
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

  }
  
}