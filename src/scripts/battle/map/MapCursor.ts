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

/**
 * @author Dei Valko
 */
export class MapCursor extends Observable {
    static readonly spritesheet = 'UISpritesheet';

    /** Cursor animation settings. */
    static readonly animSettings = {
        animSpeed: 1 / 2.5,
        pulseInterval: 40,
    }

    /** Cursor movement interval settings. */
    static readonly movementSettings = {
        moveTime_first: 15,
        moveTime_repeated: 3
    }

    private cursorGraphics: {
        selector: PIXI.Texture[],
        //targetReticle: PIXI.Texture[],
        arrowPointer: PIXI.Texture[],
        constructPointer: PIXI.Texture[],
        banPointer: PIXI.Texture[]
    }

    /** Whether the cursor should listen for input from a controller. */
    private controlsEnabled = true;

    private _pos = new Point();
    /** Where this cursor exists on the map it is selecting over. */
    get pos() {
        let p = this._pos.clone();
        // Return immutable
        return {
            get x() { return p.x; },
            get y() { return p.y; }
        }
    }

    /** Where this cursor was last. */
    private lastPos = new Point();

    /** Where this cursor exists graphically in the game world. */
    transform = new LowResTransform(new Point(this.pos));
    // TODO Major refactor: introduce ReadonlyTransform or ImmutableTransform type to protect this one.

    /** A reference to the map object we are selecting over.
     * This is 'needed' so that this cursor knows where it can and can not be. */
    private mapRef: Map;

    /** A reference to the controller we are recieving input from. */
    private controller: VirtualGamepad;

    /** The container object representing this cursor graphically. */
    private spriteLayer = new PIXI.Container();

    /** The tile-selector sprite object representing the cursor itself. */
    private cursorSprite: PIXI.AnimatedSprite;

    /** The arrow-pointer sprite which accompanies the cursor. */
    private pointerSprite: PIXI.AnimatedSprite;

    /** The pulsar trigger-controller for animation pulses. */
    private animPulsar: Pulsar;

    /** The pulsar trigger-controller for movement pulses. */
    private movementPulsar: Pulsar;

    /** Guides the cursor's position on-screen as it animates its lateral movement. */
    private slideAnimSlider = new Slider({
        granularity: 1 / MapCursor.movementSettings.moveTime_repeated
    });

    constructor(map: Map, gp: VirtualGamepad) {
        super();

        this.mapRef = map;
        this.controller = gp;
        // TODO Get the controller from Game.player[0] or something.

        // Set up the cursor's imagery
        let sheet = Game.app.loader.resources[ MapCursor.spritesheet ].spritesheet as PIXI.Spritesheet;

        // Collect all cursor-variation textures
        this.cursorGraphics = {
            selector: sheet.animations['MapCursor/mapcursor'],
            //targetReticle: sheet.animations['MapCursor/mapcursor-reticle'],
            arrowPointer: sheet.animations['MapCursor/mapcursor-arrow'],
            constructPointer: sheet.animations['MapCursor/mapcursor-wrench'],
            banPointer: sheet.animations['MapCursor/mapcursor-wrong']
        }

        this.cursorSprite = new PIXI.AnimatedSprite(this.cursorGraphics.selector);
        this.cursorSprite.animationSpeed = MapCursor.animSettings.animSpeed;
        this.cursorSprite.loop = false;    // Looping is off because we'll be pulsing over longer intervals.

        this.pointerSprite = new PIXI.AnimatedSprite(this.cursorGraphics.arrowPointer);
        this.pointerSprite.animationSpeed = MapCursor.animSettings.animSpeed;
        this.pointerSprite.loop = false;

        this.spriteLayer.addChild(this.cursorSprite);
        this.spriteLayer.addChild(this.pointerSprite);

        // Add the created image layer to the relevant places
        this.transform.object = this.spriteLayer;
        this.transform.z = 100;     // TODO This needs to be somewhere much more accessible.
        MapLayer('ui').addChild(this.spriteLayer);

        // Initiate pulsars controlling animation and movement input.
        this.animPulsar = new Pulsar( MapCursor.animSettings.pulseInterval, this.triggerAnimation, this );
        this.animPulsar.start();
        this.movementPulsar = new Pulsar( MapCursor.movementSettings.moveTime_first, this.triggerMovement, this );

        // Add this object's controller input manager to the Game ticker.
        Game.scene.ticker.add( this.updateInput, this );
        Game.scene.ticker.add( this.updateGameWorldPosition, this );
    }

    /** Destroys this object's external references. */
    destroy() {
        this.clearListeners();
        this.transform.destroy();
        this.animPulsar.destroy();
        this.movementPulsar.destroy();
        this.spriteLayer.destroy({children: true});
        Game.scene.ticker.remove( this.updateInput, this );

        // TODO Add protections against trying to use a destroyed map cursor.
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
        this.movementPulsar.interval = MapCursor.movementSettings.moveTime_first;
    }

    /** Enables the player interactivity listener. */
    enable() {
        this.controlsEnabled = true;
    }

    /** Triggers this object's animation to play once. */
    private triggerAnimation() {
        this.spriteLayer.children.forEach( displayObj => {
            (displayObj as PIXI.AnimatedSprite).gotoAndPlay(0);
        });
    }

    /** Triggers this object's position to move according to the directional input of the dpad.
     * Also sets the next interval to a faster time. */
    private triggerMovement() {
        // Get held direction
        let travelDir = new Point(this.controller.axis.dpad.point);
        this.move(travelDir);
        this.movementPulsar.interval = MapCursor.movementSettings.moveTime_repeated;
    }

    /** Gathers an interperets controller input as movement. */
    private updateInput() {
        if (!this.controlsEnabled)
            return;

        let dirChangesThisFrame = Point.Origin;

        let resetInterval = () => {
            this.movementPulsar.reset();    // Resets the timer to avoid double-pressing.
            this.movementPulsar.interval = MapCursor.movementSettings.moveTime_first;
        }

        // Gather additive input changes this frame
        if (this.controller.button.dpadUp.pressed)    { dirChangesThisFrame.y += -1 }
        if (this.controller.button.dpadDown.pressed)  { dirChangesThisFrame.y +=  1 }
        if (this.controller.button.dpadLeft.pressed)  { dirChangesThisFrame.x += -1 }
        if (this.controller.button.dpadRight.pressed) { dirChangesThisFrame.x +=  1 }
        // If any input was released, reset the interval timer
        if (this.controller.button.dpadUp.released)    { resetInterval(); }
        if (this.controller.button.dpadDown.released)  { resetInterval(); }
        if (this.controller.button.dpadLeft.released)  { resetInterval(); }
        if (this.controller.button.dpadRight.released) { resetInterval(); }

        // If any directional changes were made this frame, handle them immediately.
        if (dirChangesThisFrame.x != 0 || dirChangesThisFrame.y != 0) {
            this.move(dirChangesThisFrame);
            resetInterval();
        }

        // Get held direction // TODO Remove this
        let travelDir = {
            x: this.controller.axis.dpad.point.x,
            y: this.controller.axis.dpad.point.y
        }

        // QoL check: Reset move handler if held-dir intends to move beyond the movement map.
        let square = this.mapRef.squareAt(this._pos);
        let nextSquare = this.mapRef.squareAt(this._pos.add(travelDir));
        let beyondMovementMap = (square.moveFlag && !nextSquare.moveFlag);
        let fastCursorTravel = (this.movementPulsar.interval == MapCursor.movementSettings.moveTime_repeated);
        if (beyondMovementMap && fastCursorTravel)
            resetInterval();

        // Held input handler
        if (this.controller.axis.dpad.roaming) {
            if (this.movementPulsar.active == false) {
                this.movementPulsar.start();
            }
        }
        else if (this.controller.axis.dpad.returned) {
            this.movementPulsar.stop();
            this.movementPulsar.interval = MapCursor.movementSettings.moveTime_first;
        }
    }

    /** Calculates the cursor's game world position and updates it as such. */
    private updateGameWorldPosition() {
        if (this.pos.x == this.lastPos.x && this.pos.y == this.lastPos.y)
            return; // Skip, nothing to do here.

        if (this.slideAnimSlider.track != this.slideAnimSlider.max)
            this.slideAnimSlider.increment();
        else
            this.lastPos.set(this.pos); // Force skips in future calls.

        // Calculate intermediary distance between last position and current position.
        let tileSize = Game.display.standardLength;

        let x = this.lastPos.x * tileSize;
        let y = this.lastPos.y * tileSize;
        let xDiff = (this.pos.x - this.lastPos.x) * tileSize;
        let yDiff = (this.pos.y - this.lastPos.y) * tileSize;
        x += xDiff * this.slideAnimSlider.output;
        y += yDiff * this.slideAnimSlider.output;

        // Assign
        this.transform.pos = new Point(x,y);
    }

    /** Moves the cursor's actual position while updating any listeners about this change. */
    private setCursorLocation(p: Point) {
        this._pos.set(p);
        this.updateListeners();
        Game.diagnosticLayer.cursorPos = this._pos.toString();
    }

    /** Moves this cursor's position on the game map relative to its current position.
     * Invokes cursor animation when new location is close enough. */
    move(dir: Point) {
        // Get new position and clamp it to board width and height.
        let newPos = this._pos.add(dir);
        newPos.x = Common.confine(newPos.x, 0, this.mapRef.width - 1);
        newPos.y = Common.confine(newPos.y, 0, this.mapRef.height - 1);

        // Get the distance between the current position and new.
        let distance = this._pos.distance(newPos);

        // These are the same point, skip.
        if (distance == 0)
            return;

        // New position is close enough to animate to
        else if (distance < 2) {
            let p = new Point(this.transform).multiply(1/16);   // Update lastPos to transform's 'board location'
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
            Common.confine(place.x, 0, this.mapRef.width - 1),
            Common.confine(place.y, 0, this.mapRef.height - 1)
        );
        
        this.lastPos.set(-1,-1);            // System maintenance: set the last cursor position to something invalid.
        this.slideAnimSlider.setToMax();    // Set cursor sprite to new location
        this.setCursorLocation(place);      // Place the cursor in new position
        this.updateGameWorldPosition();     // Update transform position now, not next cycle
    }
}