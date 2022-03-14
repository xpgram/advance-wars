import { Game } from "../..";
import { MapCursor } from "../battle/map/MapCursor";
import { Point } from "../Common/Point";


interface Options {
  readonly stage: PIXI.Container,
  readonly mapCursor: MapCursor;
}

// TODO This is currently located in src/scripts/system, and it's hard to want to move it.
// If it's going to be there (here), though, it needs to be generalized.
// This is a controller object much like VirtualGamepad and it needs to be integrated with
// the more global systems; BattleSceneControllers should add the cursor behavior, this
// script shouldn't be coupled.

// If the above is to be considered, however, what am I factoring out, exactly?
// Game.stage already has all the tools I need.
// What's needed isn't this managing class, it's an aptly named handle to alleviate
// vagueness in the code.

// 'mousemove' actually isn't a good option, either. Unless I drastically rethink implementation.
// - When zoomed in, the cursor still obeys the camera's subject rect.
// - The mouse might stay still beyond the subject rect, meaning:
//   - mousemove will cease firing
//   - mapcursor will *not* continue chasing the mouse
// - This completely neglects tap events.
//   - The user would rather tap and drag the map around, but there is no functionality
//     for that.
// - Truthfully, I would rather use mousewheel and ?? to scroll the camera than I would
//   have it chase my pointer; that feels hella weird.

export class WorldPointerController {

  private options: Options;

  // TODO Pass in MouseObserver so we may reference button state
  // TODO Make MouseObserver an extension of VirtualGamepad and just pass that in?
  //      Like, I could shift+click or shift+scroll if I allowed that.
  onClick?: (location: Point) => void;


  constructor(options: Options) {
    this.options = options;

    const { stage, mapCursor } = this.options;
    const tileSize = Game.display.standardLength;

    stage.addListener('mousemove', (e) => {
      if (!mapCursor.enabled)
        return;
      const pointer_raw = new Point(e.data.getLocalPosition(stage));
      const mapPos = pointer_raw.apply(n => Math.floor(n / tileSize));
      mapCursor.animateTo(mapPos);
    })
    stage.addListener('click', (e) => {
      if (!mapCursor.enabled || !this.onClick)
        return;
      const pointer_raw = new Point(e.data.getLocalPosition(stage));
      const mapPos = pointer_raw.apply(n => Math.floor(n / tileSize));
      mapCursor.teleportTo(mapPos);
      this.onClick(mapPos);
    })
  }

  destroy() {
    const { stage } = this.options;
    stage.interactive = false;
    stage.removeAllListeners(); // Am I the only one?

    //@ts-ignore
    this.options = undefined;

  }

  get enabled() { return this.options.stage.interactive; }
  set enabled(b) { this.options.stage.interactive = b; }

}