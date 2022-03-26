import { Point } from "../../Common/Point";
import { ClickableContainer } from "../../controls/MouseInputWrapper";
import { ControlScript } from "../../ControlScript";
import { Map } from "../map/Map";
import { MapCursor } from "../map/MapCursor";
import { Square } from "../map/Square";
import { Terrain } from "../map/Terrain";
import { BattleSceneControllers } from "../turn-machine/BattleSceneControllers";


// I have decided.
// This will be the stage-pointer controller interface.
// Once could grab the stage pointer directly, but this does all the common
// things automatically, which is better for my aching carpal tunnel.

export class StagePointerInterface extends ControlScript {
  defaultEnabled(): boolean { return false; }

  private readonly stagePointer: ClickableContainer;
  private readonly map: Map;
  private readonly mapCursor: MapCursor;

  /** Function called every time this controller updates the map cursor's board location. */
  onMoveCursor?: (location: Point) => void;

  /** True if the controller is currently moving the map cursor. */
  get operatingCursor() { return this._operatingCursor; }
  private _operatingCursor = false;

  /** True if the controller is signalling an 'affirm' or 'progress' intent. */
  get affirmIntent() { return this._affirmIntent; }
  private _affirmIntent = false;

  /** A point equal to the board location for which the controller is signalling
   * an affirm intent, or generally the pointer's current position (but not always). */
  affirmIntentLocation() { return this._affirmIntentLocation.clone(); }
  private _affirmIntentLocation = new Point();

  /** True if the controller is signalling a 'cancel' or 'regress' intent. */
  get cancelIntent() { return this.mode === 'highlighted' && this._cancelIntent; }
  private _cancelIntent = false;

  /** Affects which tiles the controller will move the cursor to and which intents
   * it signals when a tile is clicked. Default: 'any'. */
  mode: 'any' | 'highlighted' = 'any';

  /** Whether 'affirm' should be signaled during a pointer-drag action. Default: false. */
  affirmOnPointerDrag = false;

  /** Whether 'affirm' should be signaled during a pointer-button release event. Default: false. */
  affirmOnRelease = false;

  /** Whether 'affirm' should be signaled during a pointer-button release event while pointer-dragging
   * is also true. Default: false. */
  affirmOnDragRelease = false;


  constructor(assets: BattleSceneControllers) {
    super(assets);
    this.stagePointer = assets.stagePointer;
    this.map = assets.map;
    this.mapCursor = assets.mapCursor;
  }

  protected enableScript(): void {
    
  }

  protected disableScript(): void {
    this.onMoveCursor = undefined;
    this._operatingCursor = false;
    this._affirmIntent = false;
    this._affirmIntentLocation.set(0,0);
    this._cancelIntent = false;
    this.mode = 'any';
    this.affirmOnPointerDrag = false;
    this.affirmOnRelease = false;
    this.affirmOnDragRelease = false;
  }

  protected updateScript(): void {
    const { map, mapCursor, stagePointer } = this;
    const { button } = stagePointer;

    const pointerClicked = stagePointer.clicked();

    const tileFlagged = (tile: Square) => (tile.moveFlag || tile.attackFlag || tile.targetFlag);

    const currentTile = map.squareFromWorldPoint(stagePointer.pointerLocation());
    const pressedTile = map.squareFromWorldPoint(stagePointer.pointerPressedLocation());

    const pointerOverPressed = currentTile.boardLocation.equal(pressedTile.boardLocation);
    const pointerOverCursor = currentTile.boardLocation.equal(mapCursor.boardLocation);

    const tileSelectable = (this.mode === 'any' || tileFlagged(currentTile));
    const currentTileValid = (currentTile.terrain.type !== Terrain.Void);
    const moveCursorIntent = (button.down && currentTileValid && !pointerOverCursor && tileSelectable);
    const moveCursorEndIntent = (button.up);

    const clickAffirm = (pointerClicked && pointerOverCursor && !this.operatingCursor);
    const dragAffirm = (stagePointer.pointerDragging && this.affirmOnPointerDrag);
    const releaseAffirm = (button.released && this.affirmOnRelease);
    const dragReleaseAffirm = (stagePointer.pointerDragStopped && this.affirmOnDragRelease);

    // Move cursor
    if (moveCursorIntent) {
      (button.pressed || stagePointer.pointerEntered)
        ? mapCursor.moveTo(currentTile.boardLocation)
        : mapCursor.animateTo(currentTile.boardLocation);
      if (this.onMoveCursor)
        this.onMoveCursor(mapCursor.boardLocation);
      this._operatingCursor = true;
    }
    if (moveCursorEndIntent)
      this._operatingCursor = false;

    // Affirm intent
    this._affirmIntent = (clickAffirm || dragAffirm || releaseAffirm || dragReleaseAffirm);
    this._affirmIntentLocation.set( ((dragAffirm) ? pressedTile : currentTile).boardLocation );

    // Cancel intent
    this._cancelIntent = (this.mode === 'highlighted' && pointerClicked && !tileFlagged(currentTile))
  }

}
