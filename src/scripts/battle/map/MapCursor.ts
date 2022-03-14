import { Map } from "./Map";
import { Game } from "../../..";
import { VirtualGamepad } from "../../controls/VirtualGamepad";
import { Common } from "../../CommonUtils";
import { LowResTransform } from "../../LowResTransform";
import { MapLayer } from "./MapLayers";
import { Pulsar } from "../../timer/Pulsar";
import { Slider } from "../../Common/Slider";
import { Point } from "../../Common/Point";
import { Observable } from "../../Observable";
import { AnimatedSprite } from "@pixi/sprite-animated";
import { RegionMap } from "../unit-actions/RegionMap";
import { buildBoundedRegionMapObject } from "../unit-actions/GraphicalRegionMap";


// TODO Update discrepancy: MapCursor and ArrowPath
// MapCursor updates its board position instantly, but not its graphical position.
// ArrowPath, driven by MoveUnit (turnstate), sees this board position change
// instantly and updates itself graphically before MapCursor's graphics can catch up.
// This is fine, but occasionally looks weird; the arrow appears to lead the cursor
// sometimes.
//
// To fix this, I need to add another layer to the MapCursor board position system.
// MapCursor will need to know where it is going first and will update its listeners
// and its public board position later.
// 
// My only concern is in introducing a race condition where an object might retrieve
// the cursor position during a transition, pass some validation step which yields
// control to a new state, which in turn misses the location update a few frames later,
// retrieves the cursor position again and ends up with invalid data.
// 
// To be fair, I probably shouldn't retrieve MapCursor twice. Sensitive information
// of that kind should be stored as a constant. I'm not certain my system doesn't
// depend on multiple-access of the cursor, though.
//
// May the simplest solution is to add an aligned() check which returns true if
// the cursor is ready for some kind of update? MoveUnit would have to reconfirm
// the arrow-path on A-press to be certain it's frame correct, but that's a small
// price, tbh.


/**
 * @author Dei Valko
 */
export class MapCursor extends Observable() {
  static readonly spritesheet = 'UISpritesheet';

  /** Cursor animation settings. */
  static readonly settings = {
    animSpeed: 1 / 2.5,
    reticleSpeed: 1 / 4,
    animPulseInterval: 40,
    moveFirst: 15,
    moveRepeat: 3,
  }

  animPulsar = new Pulsar(
    MapCursor.settings.animPulseInterval,
    this.triggerAnimation,
    this
  )

  movementPulsar = new Pulsar(
    {
      firstInterval: MapCursor.settings.moveFirst,
      interval: MapCursor.settings.moveRepeat,
    },
    this.triggerMovement,
    this
  )

  private cursorGraphics: {
    selector: PIXI.Texture[],
    targetSelector: PIXI.Texture[],
    arrowPointer: PIXI.Texture[],
    constructPointer: PIXI.Texture[],
    banPointer: PIXI.Texture[]
  }

  /** Guides the cursor's position on-screen as it animates its lateral movement. */
  private slideAnimSlider = new Slider({
    granularity: 1 / MapCursor.settings.moveRepeat,
  });

  /** Sets this cursor's graphics by context. */
  get mode() { return this._mode; }
  set mode(mode) {
    const targetMode = (mode === 'target');
    const sets = this.cursorGraphics;
    const pointer =
      (mode === 'build')
        ? sets.constructPointer
        : (mode === 'ban')
          ? sets.banPointer
          : sets.arrowPointer;
    this.pointerSprite.textures = pointer;

    this.pointerSprite.visible = !targetMode;
    this.cursorSprite.visible = !targetMode;
    this.reticleSprite.visible = targetMode;
    
    this._mode = mode;
  }
  private _mode: 'point' | 'build' | 'ban' | 'target' = 'point';

  /** The map describing the area-of-effect surrounding the cursor. */
  get regionMap() { return this._areaReticle; }
  set regionMap(map) {
    this._areaReticle = map;
    
    // Deconstruct the old map, if any
    this.areaOfEffectLayer.removeChildren();
    if (!this._areaReticle)
      return;
    
    // Reconstruct the area map graphically
    const length = Game.display.standardLength;
    this.areaOfEffectLayer.addChild(
      buildBoundedRegionMapObject(this._areaReticle, length)
    );
  }
  private _areaReticle?: RegionMap;

  /** Whether to render the cursor's surrounding AoE region map. True by
   * default as null region maps cannot be rendered anyway. */
  get showAreaOfEffectMap() { return this.areaOfEffectLayer.visible; }
  set showAreaOfEffectMap(b) { this.areaOfEffectLayer.visible = b; }

  /** Whether the cursor should listen for input from a controller. */
  private controlsEnabled = true;

  /** World position as a point object. Not editable. */
  get position() { 
    return new Point(this.transform.exact);
  }

  /** Where this cursor exists on the map it is selecting over. */
  get boardLocation() {
    return this._boardLocation.clone();
  }
  private _boardLocation = new Point();

  /** A point representing the maximum location values for the current map. */
  private get coordinateLimits() {
    return new Point(this.map.width - 1, this.map.height - 1);
  }

  /** Where this cursor was last. */
  private lastPos = new Point();

  /** Where this cursor exists graphically in the game world. */
  transform = new LowResTransform(new Point(this.boardLocation));

  /** A reference to the map object we are selecting over.
   * This is 'needed' so that this cursor knows where it can and can not be. */
  private map: Map;

  /** A reference to the controller we are recieving input from. */
  private controller: VirtualGamepad;

  /** The container object representing this cursor graphically. */
  private spriteLayer = new PIXI.Container();

  /** The tile-selector sprite object representing the cursor itself. */
  private cursorSprite: AnimatedSprite;

  /** The arrow-pointer sprite which accompanies the cursor. */
  private pointerSprite: AnimatedSprite;

  /** The tile-selector sprite object used over actionable locations in place of the cursor. */
  private reticleSprite: AnimatedSprite;

  /** The drawn map indicating the area of effect surrounding the cursor's position. */
  private areaOfEffectLayer = new PIXI.Container;


  constructor(map: Map, gp: VirtualGamepad) {
    super();

    this.map = map;
    this.controller = gp;

    // Set up the cursor's imagery
    let sheet = Game.loader.resources[MapCursor.spritesheet].spritesheet as PIXI.Spritesheet;

    // Collect all cursor-variation textures
    this.cursorGraphics = {
      selector: sheet.animations['MapCursor/mapcursor'],
      targetSelector: sheet.animations['MapCursor/targetcursor'],
      arrowPointer: sheet.animations['MapCursor/mapcursor-arrow'],
      constructPointer: sheet.animations['MapCursor/mapcursor-wrench'],
      banPointer: sheet.animations['MapCursor/mapcursor-wrong'],
    }

    // Build Cursor
    this.cursorSprite = new AnimatedSprite(this.cursorGraphics.selector);
    this.cursorSprite.animationSpeed = MapCursor.settings.animSpeed;
    this.cursorSprite.loop = false;    // Looping is off because we'll be pulsing over longer intervals.

    // Build Pointer
    this.pointerSprite = new AnimatedSprite(this.cursorGraphics.arrowPointer);
    this.pointerSprite.animationSpeed = MapCursor.settings.animSpeed;
    this.pointerSprite.loop = false;

    // Build target reticle
    this.reticleSprite = new AnimatedSprite(this.cursorGraphics.targetSelector);
    this.reticleSprite.animationSpeed = MapCursor.settings.reticleSpeed;
    this.reticleSprite.loop = true;
    this.reticleSprite.visible = false;
    this.reticleSprite.play();

    this.spriteLayer.addChild(
      this.cursorSprite,
      this.pointerSprite,
      this.reticleSprite,
      this.areaOfEffectLayer,
    );

    // Add the created image layer to the relevant places
    this.transform.object = this.spriteLayer;
    this.transform.z = 100;     // TODO This needs to be somewhere much more accessible.
    MapLayer('ui').addChild(this.spriteLayer);

    // Initiate pulsars controlling animation and movement input.
    this.animPulsar.start();

    // Add this object's controller input manager to the Game ticker.
    Game.scene.ticker.add(this.updateInput, this);
    Game.scene.ticker.add(this.updateGameWorldPosition, this);
  }

  /** Destroys this object's external references. */
  destroy() {
    this.clearListeners();
    this.transform.destroy();
    this.animPulsar.destroy();
    this.movementPulsar.destroy();
    this.spriteLayer.destroy({ children: true });
    Game.scene.ticker.remove(this.updateInput, this);

    //@ts-ignore
    this.mapRef = null;
    //@ts-ignore
    this.controller = null;
  }

  /** Re-normalizes all cursor settings to their defaults. */
  resetSettings() {
    this.mode = 'point';
    this.regionMap = undefined;
    this.showAreaOfEffectMap = true;
  }

  /** Hides the cursor's graphics and disables player controls. */
  hide(): void {
    this.disable();
    this.spriteLayer.visible = false;
  }

  // TODO I should separate these, huh? Controls and visibility. The confusion will cause problems.
  /** Reveals the cursor's graphics and enables player controls. */
  show(): void {
    this.enable();
    this.spriteLayer.visible = true;
  }

  /** Whether this cursor is invisible and uninteractable. */
  get hidden() {
    return (!this.spriteLayer.visible);
  }

  /** Disables the player interactivity listener. */
  disable() {
    this.controlsEnabled = false;
    this.movementPulsar.stop();
  }

  /** Enables the player interactivity listener. */
  enable() {
    this.controlsEnabled = true;
  }

  /** True if the player-interactivity listener is active. */
  get enabled() { return this.controlsEnabled = true; }

  /** Triggers this object's animation to play once. */
  private triggerAnimation() {
    this.cursorSprite.gotoAndPlay(0);
    this.pointerSprite.gotoAndPlay(0);
  }

  /** Triggers this object's position to move according to the directional input of the dpad. */
  private triggerMovement() {
    // TODO The DPad is fine, but this would not work as-is with sticks.
    if (this.controller.axis.dpad.framePoint.notEqual(Point.Origin))
      return;
      
    let travelDir = new Point(this.controller.axis.dpad.point);
    this.move(travelDir);
  }

  /** Gathers an interperets controller input as movement. */
  private updateInput() {
    if (!this.controlsEnabled)
      return;

    const dpad = this.controller.axis.dpad;
    const { dpadUp, dpadDown, dpadLeft, dpadRight } = this.controller.button;
    const buttons = [dpadUp, dpadDown, dpadLeft, dpadRight];

    const dpadDirChanged = (buttons.some( b => b.pressed || b.released ))
    const dpadTilted = (dpad.roaming && !this.movementPulsar.active);

    // Handle any frame input immediately.
    if (dpadDirChanged) {
      const point = (dpadTilted)
        ? dpad.point
        : dpad.framePoint;
      this.move(point);
    }

    // QoL check: Reset move handler if held-dir intends to move beyond the movement map.
    const square = this.map.squareAt(this._boardLocation);
    const nextSquare = this.map.squareAt(this._boardLocation.add(dpad.point));
    const beyondMovementMap = (square.moveFlag && !nextSquare.moveFlag);
    const heldInput = this.movementPulsar.firstIntervalComplete;
    if (beyondMovementMap && heldInput)
      this.movementPulsar.reset();

    // Held input handler
    if (dpadDirChanged || dpadTilted)
      this.movementPulsar.startReset();
    if (dpad.returned)
      this.movementPulsar.stop();
  }

  /** Calculates the cursor's game world position and updates it as such. */
  private updateGameWorldPosition() {
    if (this.boardLocation.equal(this.lastPos))
      return;

    if (this.slideAnimSlider.track != this.slideAnimSlider.max)
      this.slideAnimSlider.increment();
    else
      this.lastPos.set(this.boardLocation); // Force skips in future calls.

    // Calculate intermediary distance between last position and current position.
    let tileSize = Game.display.standardLength;

    const pos = this.boardLocation
      .subtract(this.lastPos)
      .multiply(tileSize)
      .multiply(this.slideAnimSlider.output)
      .add(
        this.lastPos.multiply(tileSize)
      );

    // Assign
    this.transform.position = pos;
  }

  /** Moves the cursor's actual position while updating any listeners about this change. */
  private setCursorLocation(p: Point) {
    this._boardLocation.set(p);
    this.updateListeners('move');
    Game.diagnosticLayer.cursorPos = this._boardLocation.toString();
  }

  /** Moves this cursor's position directly to some other position on the game map.
   * Always animates. */
  animateTo(place: Point) {
    const newLocation = place.clamp(this.coordinateLimits);

    const oldLocation = new Point(this.transform).multiply(1/16);
    this.lastPos.set(oldLocation);
    this.setCursorLocation(newLocation);
    this.slideAnimSlider.setToMin();
  }

  /** Moves this cursor's position directly to some other position on the game map.
   * Skips animation. */
  teleportTo(place: Point) {
    const newLocation = place.clamp(this.coordinateLimits);

    this.lastPos.set(-1, -1);             // System maintenance: set the last cursor position to something invalid.
    this.slideAnimSlider.setToMax();      // Set cursor sprite to new location
    this.setCursorLocation(newLocation);  // Place the cursor in new position
    this.updateGameWorldPosition();       // Update transform position now, not next cycle
  }

  /** Moves this cursor's position directly to some other position on the game map.
   * Invokes cursor animation when new location is close enough. */
  moveTo(place: Point) {
    const newLocation = place.clamp(this.coordinateLimits);
    const distance = this._boardLocation.distance(newLocation);

    if (distance == 0)
      return;
    else if (distance < 2)
      this.animateTo(newLocation);
    else
      this.teleportTo(newLocation);
  }

  /** Moves this cursor's position on the game map relative to its current position.
   * Invokes cursor animation when new location is close enough. */
  move(dir: Point) {
    const newLocation = this._boardLocation.add(dir);
    this.moveTo(newLocation);    
  }

}
