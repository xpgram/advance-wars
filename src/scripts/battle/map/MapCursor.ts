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

/**
 * @author Dei Valko
 */
export class MapCursor extends Observable {
  static readonly spritesheet = 'UISpritesheet';

  /** Cursor animation settings. */
  static readonly settings = {
    animSpeed: 1 / 2.5,
    targetAnimSpeed: 1 / 4,
    animSelectorPulseInterval: 40,
    animTargetPulseInterval: 40,
    selectorAnchor: new Point(),
    targetSelectorAnchor: new Point(),
    moveFirst: 15,
    moveRepeat: 3,
    // sel: wait → up/down → wait → up/down
    // tar: up → wait → down → wait → up
  }

  animPulsar = new Pulsar(
    MapCursor.settings.animSelectorPulseInterval,
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
    const showPointer = (mode !== 'target');
    const sets = this.cursorGraphics;
    const pointer =
      (mode === 'build')
        ? sets.constructPointer
        : (mode === 'ban')
          ? sets.banPointer
          : sets.arrowPointer;
    const cursor =
      (mode === 'target')
        ? sets.targetSelector
        : sets.selector;
    this.pointerSprite.textures = pointer;
    this.pointerSprite.visible = showPointer;
    this.cursorSprite.textures = cursor;
    const anchor =
      (showPointer)
      ? MapCursor.settings.selectorAnchor
      : MapCursor.settings.targetSelectorAnchor;
    this.cursorSprite.anchor.set(anchor.x, anchor.y);
    this.cursorSprite.animationSpeed = showPointer
      ? MapCursor.settings.animSpeed
      : MapCursor.settings.targetAnimSpeed;
    this._mode = mode;
  }
  private _mode: 'point' | 'build' | 'ban' | 'target' = 'point';

  /** Whether the cursor should listen for input from a controller. */
  private controlsEnabled = true;

  /** Where this cursor exists on the map it is selecting over. */
  get pos() {
    return this._pos.clone();
  }
  private _pos = new Point();

  /** Where this cursor was last. */
  private lastPos = new Point();

  /** Where this cursor exists graphically in the game world. */
  transform = new LowResTransform(new Point(this.pos));

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


  constructor(map: Map, gp: VirtualGamepad) {
    super();

    this.map = map;
    this.controller = gp;

    // Set up the cursor's imagery
    let sheet = Game.app.loader.resources[MapCursor.spritesheet].spritesheet as PIXI.Spritesheet;

    // Collect all cursor-variation textures
    this.cursorGraphics = {
      selector: sheet.animations['MapCursor/mapcursor'],
      targetSelector: sheet.animations['MapCursor/targetcursor'],
      arrowPointer: sheet.animations['MapCursor/mapcursor-arrow'],
      constructPointer: sheet.animations['MapCursor/mapcursor-wrench'],
      banPointer: sheet.animations['MapCursor/mapcursor-wrong'],
    }

    // Save anchor positions for different cursor sprite dimensions (dumb).
    const sel = (new AnimatedSprite(this.cursorGraphics.selector));
    const tsel = (new AnimatedSprite(this.cursorGraphics.targetSelector));
    MapCursor.settings.selectorAnchor = new Point(sel.anchor.x);
    MapCursor.settings.targetSelectorAnchor = new Point(tsel.anchor.x);
    MapCursor.settings.animTargetPulseInterval = tsel.textures.length / MapCursor.settings.targetAnimSpeed;

    // Build Cursor
    this.cursorSprite = new AnimatedSprite(this.cursorGraphics.selector);
    this.cursorSprite.animationSpeed = MapCursor.settings.animSpeed;
    this.cursorSprite.loop = false;    // Looping is off because we'll be pulsing over longer intervals.

    // Build Pointer
    this.pointerSprite = new AnimatedSprite(this.cursorGraphics.arrowPointer);
    this.pointerSprite.animationSpeed = MapCursor.settings.animSpeed;
    this.pointerSprite.loop = false;

    this.spriteLayer.addChild(this.cursorSprite);
    this.spriteLayer.addChild(this.pointerSprite);

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

  /** Triggers this object's animation to play once. */
  private triggerAnimation() {
    this.cursorSprite.gotoAndPlay(0);
    this.pointerSprite.gotoAndPlay(0);

    this.animPulsar.interval = (this.mode === 'target')
      ? MapCursor.settings.animTargetPulseInterval
      : MapCursor.settings.animSelectorPulseInterval;
  }

  /** Triggers this object's position to move according to the directional input of the dpad.
   * Also sets the next interval to a faster time. */
  private triggerMovement() {
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

    // Handle any frame input immediately.
    if (buttons.some( b => b.pressed || b.released )) {
      this.movementPulsar.reset();
      this.move(dpad.framePoint);
    }

    // QoL check: Reset move handler if held-dir intends to move beyond the movement map.
    const square = this.map.squareAt(this._pos);
    const nextSquare = this.map.squareAt(this._pos.add(dpad.point));
    const beyondMovementMap = (square.moveFlag && !nextSquare.moveFlag);
    const heldInput = this.movementPulsar.firstIntervalComplete;
    if (beyondMovementMap && heldInput)
      this.movementPulsar.reset();

    // Held input handler
    if (dpad.tilted)
      this.movementPulsar.start();
    if (dpad.returned)
      this.movementPulsar.stop();
  }

  /** Calculates the cursor's game world position and updates it as such. */
  private updateGameWorldPosition() {
    if (this.pos.equal(this.lastPos))
      return;

    if (this.slideAnimSlider.track != this.slideAnimSlider.max)
      this.slideAnimSlider.increment();
    else
      this.lastPos.set(this.pos); // Force skips in future calls.

    // Calculate intermediary distance between last position and current position.
    let tileSize = Game.display.standardLength;

    const pos = this.pos
      .subtract(this.lastPos)
      .multiply(tileSize)
      .multiply(this.slideAnimSlider.output)
      .add(
        this.lastPos.multiply(tileSize)
      );

    // Assign
    this.transform.pos = pos;
  }

  /** Moves the cursor's actual position while updating any listeners about this change. */
  private setCursorLocation(p: Point) {
    this._pos.set(p);
    this.updateListeners('move');
    Game.diagnosticLayer.cursorPos = this._pos.toString();
  }

  /** Moves this cursor's position on the game map relative to its current position.
   * Invokes cursor animation when new location is close enough. */
  move(dir: Point) {
    // Get new position and clamp it to board width and height.
    let newPos = this._pos.add(dir);
    newPos.x = Common.clamp(newPos.x, 0, this.map.width - 1);
    newPos.y = Common.clamp(newPos.y, 0, this.map.height - 1);

    // Get the distance between the current position and new.
    let distance = this._pos.distance(newPos);

    // These are the same point, skip.
    if (distance == 0)
      return;

    // New position is close enough to animate to
    else if (distance < 2) {
      let p = new Point(this.transform).multiply(1 / 16);   // Update lastPos to transform's 'board location'
      this.lastPos.set(p);                                // in case we're interrupting active movement.
      this.setCursorLocation(newPos);
      this.slideAnimSlider.setToMin();                    // Reset animation state
    }

    // New position is far enough to teleport to
    else
      this.teleport(newPos);
  }

  /** Moves this cursor's position directly to some other position on the game map.
   * Invokes cursor animation when new location is close enough. */
  moveTo(place: Point) {
    let relativePos = new Point(place).subtract(this.pos);
    this.move(relativePos);
  }

  teleport(place: Point) {
    // Clamp new cursor position to some place on the board.
    place.set(
      Common.clamp(place.x, 0, this.map.width - 1),
      Common.clamp(place.y, 0, this.map.height - 1)
    );

    this.lastPos.set(-1, -1);            // System maintenance: set the last cursor position to something invalid.
    this.slideAnimSlider.setToMax();    // Set cursor sprite to new location
    this.setCursorLocation(place);      // Place the cursor in new position
    this.updateGameWorldPosition();     // Update transform position now, not next cycle
  }
}