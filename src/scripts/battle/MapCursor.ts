import * as PIXI from "pixi.js";
import { Point } from "../CommonTypes";
import { Map } from "./Map";
import { Game } from "../..";
import { VirtualGamepad } from "../controls/VirtualGamepad";
import { Common } from "../CommonUtils";
import { LowResTransform } from "../LowResTransform";
import { MapLayers } from "./MapLayers";
import { Pulsar } from "../timer/Pulsar";

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

    /** Where this cursor exists on the map it is selecting over. */
    pos: Point;
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

    constructor(map: Map, gp: VirtualGamepad) {
        this.pos = {x:0,y:0};
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
        MapLayers['ui'].addChild(this.spriteLayer);

        // Initiate pulsars controlling animation and movement input.
        this.animPulsar = new Pulsar( MapCursor.animSettings.pulseInterval, this.triggerAnimation, this );
        this.animPulsar.start();
        this.movementPulsar = new Pulsar( MapCursor.movementSettings.moveTime_first, this.triggerMovement, this );

        // Add this object's controller input manager to the Game ticker.
        Game.scene.ticker.add( this.updateInput, this );
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

    /** Triggers this object's animation to play once. */
    private triggerAnimation() {
        this.spriteLayer.children.forEach( displayObj => {
            (displayObj as PIXI.AnimatedSprite).gotoAndPlay(0);
        });
    }

    /** Triggers this object's position to move according to the directional input of the dpad.
     * Also sets the next interval to a faster time. */
    private triggerMovement() {
        this.move(this.controller.axis.dpad.point);
        this.movementPulsar.interval = MapCursor.movementSettings.moveTime_repeated;
    }

    /** Gathers an interperets controller input as movement. */
    updateInput() {
        // Instantaneous cursor movement.
        let moveCursor = (dir: Point) => {
            this.move(dir);
            this.movementPulsar.reset();    // Resets the timer to avoid double-pressing.
            this.movementPulsar.interval = MapCursor.movementSettings.moveTime_first;
        }
        // Input correction: cursor should ~always~ move when a button is pressed.
        if (this.controller.button.dpadUp.pressed)    { moveCursor({x: 0, y:-1}); }
        if (this.controller.button.dpadDown.pressed)  { moveCursor({x: 0, y: 1}); }
        if (this.controller.button.dpadLeft.pressed)  { moveCursor({x:-1, y: 0}); }
        if (this.controller.button.dpadRight.pressed) { moveCursor({x: 1, y: 0}); }
        // Further correction: cursor should always pause/reset after a change in input.
        if (this.controller.button.dpadUp.released)    { moveCursor({x: 0, y: 0}); }
        if (this.controller.button.dpadDown.released)  { moveCursor({x: 0, y: 0}); }
        if (this.controller.button.dpadLeft.released)  { moveCursor({x: 0, y: 0}); }
        if (this.controller.button.dpadRight.released) { moveCursor({x: 0, y: 0}); }

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

    /** Moves this cursor's position on the game map and graphically in the game world. */
    move(dir: Point) {
        this.pos.x += dir.x;
        this.pos.y += dir.y;

        // Clamp this cursor's position to the board's width and height.
        this.pos.x = Common.confine(this.pos.x, 0, this.mapRef.width - 1);  // Confine's range is inclusive, and .width does not give the last index.
        this.pos.y = Common.confine(this.pos.y, 0, this.mapRef.height - 1);

        // Convert this cursor's board position into a new game-world position.
        let tileSize = Game.display.standardLength;
        let realPos = {x: this.pos.x * tileSize, y: this.pos.y * tileSize};
        this.transform.pos = realPos;
    }
}