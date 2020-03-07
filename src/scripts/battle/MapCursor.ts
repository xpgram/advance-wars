import { Map } from "./Map";
import { Game } from "../..";
import { VirtualGamepad } from "../controls/VirtualGamepad";
import { Common } from "../CommonUtils";
import { LowResTransform } from "../LowResTransform";
import { MapLayers } from "./MapLayers";
import { Pulsar } from "../timer/Pulsar";
import { Slider } from "../Common/Slider";
import { PointPrimitive } from "../Common/Point";

/**
 * @author Dei Valko
 */
export class MapCursor {
    static readonly spritesheet = 'UISpritesheet';

    /** Cursor animation settings. */
    static readonly animSettings = {
        animSpeed: 1 / 2.5,
        pulseInterval: 40,
    }

    /** Cursor movement interval settings. */
    static readonly movementSettings = {
        moveTime_first: 12,
        moveTime_repeated: 3
    }

    /** Whether the cursor should listen for input from a controller. */
    private controlsEnabled = true;
    /** Where this cursor exists on the map it is selecting over. */
    pos: PointPrimitive;
    /** Where this cursor was last. */
    private lastPos: PointPrimitive;
    /** The direction of movement being held from last frame. */
    private travelDir: PointPrimitive;
    /** Where this cursor exists graphically in the game world. */
    transform: LowResTransform;
    /** A reference to the map object we are selecting over.
     * This is 'needed' so that this cursor knows where it can and can not be. */
    mapRef: Map;
    /** A reference to the controller we are recieving input from. */
    controller: VirtualGamepad;
    /** The container object representing this cursor graphically. */
    spriteLayer = new PIXI.Container();
    /** The pulsar trigger-controller for animation pulses. */
    animPulsar: Pulsar;
    /** The pulsar trigger-controller for movement pulses. */
    movementPulsar: Pulsar;
    /** Guides the cursor's position on-screen as it animates its lateral movement. */
    slideAnimSlider = new Slider({
        granularity: 1 / MapCursor.movementSettings.moveTime_repeated
    });

    constructor(map: Map, gp: VirtualGamepad) {
        this.pos = {x:0,y:0};
        this.lastPos = {x:0,y:0};
        this.travelDir = {x:0,y:0};
        this.transform = new LowResTransform(this.pos);
        this.mapRef = map;
        this.controller = gp;
        // TODO Get the controller from Game.player[0] or something.

        // Set up the cursor's imagery
        let sheet = Game.app.loader.resources[ MapCursor.spritesheet ].spritesheet;

        let cursor = new PIXI.AnimatedSprite(sheet.animations['MapCursor/mapcursor']);
        cursor.animationSpeed = MapCursor.animSettings.animSpeed;
        cursor.loop = false;    // Looping is off because we'll be pulsing over longer intervals.

        let arrow = new PIXI.AnimatedSprite(sheet.animations['MapCursor/mapcursor-arrow']);
        arrow.animationSpeed = MapCursor.animSettings.animSpeed;
        arrow.loop = false;

        this.spriteLayer.addChild(cursor);
        this.spriteLayer.addChild(arrow);

        // Add the created image layer to the relevant places
        this.transform.object = this.spriteLayer;
        this.transform.z = 100;     // TODO This needs to be somewhere much more accessible.
        MapLayers['ui'].addChild(this.spriteLayer);

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
        this.spriteLayer.visible = false;
        this.controlsEnabled = false;
    }

    /** Reveals the cursor's graphics and enables player controls. */
    show(): void {
        this.spriteLayer.visible = true;
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
        this.move(this.travelDir);
        this.movementPulsar.interval = MapCursor.movementSettings.moveTime_repeated;
    }

    /** Gathers an interperets controller input as movement. */
    private updateInput() {
        if (!this.controlsEnabled)
            return;

        let dirChangesThisFrame = {x:0,y:0};

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

        // Update held direction for the input pulsar
        this.travelDir.x = this.controller.axis.dpad.point.x;
        this.travelDir.y = this.controller.axis.dpad.point.y;

        // Held input handler
        if (this.controller.axis.dpad.roaming) {
            if (this.movementPulsar.active == false) {
                this.movementPulsar.start();
            }
        }
        else if (this.controller.axis.dpad.returned) {
            this.movementPulsar.stop();
            this.movementPulsar.interval = MapCursor.movementSettings.moveTime_first;
            this.travelDir.x = this.travelDir.y = 0;
        }
    }

    /** Calculates the cursor's game world position and updates it as such. */
    private updateGameWorldPosition() {
        if (this.pos.x == this.lastPos.x && this.pos.y == this.lastPos.y)
            return; // Skip, nothing to do here.

        if (this.slideAnimSlider.value != this.slideAnimSlider.max)
            this.slideAnimSlider.increment();
        else
            this.lastPos = {x: this.pos.x, y: this.pos.y};  // Force skips in future calls.

        // Calculate intermediary distance between last position and current position.
        let tileSize = Game.display.standardLength;

        let x = this.lastPos.x * tileSize;
        let y = this.lastPos.y * tileSize;
        let xDiff = (this.pos.x - this.lastPos.x) * tileSize;
        let yDiff = (this.pos.y - this.lastPos.y) * tileSize;
        x += xDiff * this.slideAnimSlider.value;
        y += yDiff * this.slideAnimSlider.value;
        let newPos = {x:x, y:y};

        // Assign
        this.transform.pos = newPos;
    }

    /** Moves this cursor's position on the game map and graphically in the game world. */
    move(dir: PointPrimitive) {
        // Calculate the new position
        let newPos = {
            x: this.pos.x + dir.x,
            y: this.pos.y + dir.y
        }
        // Clamp it to the board's width and height.
        newPos.x = Common.confine(newPos.x, 0, this.mapRef.width - 1);
        newPos.y = Common.confine(newPos.y, 0, this.mapRef.height - 1);

        // Continue only if this new position *is* a new position.
        if (this.pos.x != newPos.x || this.pos.y != newPos.y) {
            this.lastPos.x = this.transform.x / 16; // Use the transform in case we're
            this.lastPos.y = this.transform.y / 16; // interrupting active movement.

            this.pos.x = newPos.x;
            this.pos.y = newPos.y;

            // Reset the slide animator
            this.slideAnimSlider.setToMin();
        }
    }

    /** Moves this cursor's position directly (non-relatively) to some other position on the game map and graphically in the game world. */
    moveTo(place: PointPrimitive) {
        place = {
            x: Common.confine(place.x, 0, this.mapRef.width - 1),
            y: Common.confine(place.y, 0, this.mapRef.height - 1)
        }
        let relativePos = {x: place.x - this.pos.x, y: place.y - this.pos.y};

        // Using pythagorean theorem
        let distance = Math.sqrt(Math.pow(relativePos.x, 2) + Math.pow(relativePos.y, 2));

        // If we are already placed at this location.
        if (distance == 0)
            return;

        // If we are close enough to animate
        else if (distance < 2)
            this.move(relativePos);

        // We are far enough to teleport.
        else {
            this.lastPos.x = this.transform.x / 16;
            this.lastPos.y = this.transform.y / 16;
            this.slideAnimSlider.setToMax();

            this.pos.x = place.x;
            this.pos.y = place.y;
        }

        // TODO This *should* definitely be in move(), not here.
    }
}