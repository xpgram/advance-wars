import { LowResTransform } from "./LowResTransform";
import { TransformContainer, Point } from "./CommonTypes";
import { Game } from "..";

/**
 * Takes control of a PIXI container, usually the global stage, and manipulates it
 * to simulate camera movement and other camera features.
 * 
 * TODO: Add followTarget support.
 * TODO: Finish followTarget framing (focused objects should never be considered 'framed correctly' at the edges of the screen)
 * 
 * @author Dei Valko
 * @version 0.1.0
 */
export class Camera {
    private _transform = new LowResTransform();
    /** Reference to the camera's transform. */
    get transform(): LowResTransform {
        return this._transform;
    }
    set transform(other) {
        this._transform.copyFrom(other);
    }

    /** The object which the camera will try to keep in frame. If null, the camera does not follow. */
    followTarget: TransformContainer | null = null;

    /**
     * @param stage The 'world' container the camera will manipulate to pan, rotate and zoom.
     */
    constructor(stage: PIXI.Container) {
        this.stage = stage;
    }

    /** The world or layer the camera will move to simulate camera movement. */
    get stage(): PIXI.Container | null {
        return this.transform.object;
    }
    set stage(object) {
        this.transform.object = object;
    }

    /** The camera's x-coordinate in 2D space, anchored in the top-left. */
    get x() { return -this.transform.x; }
    set x(num) { this.transform.x = -num; }
    /** The camera's y-coordinate in 2D space, anchored in the top-left. */
    get y() { return -this.transform.y; }
    set y(num) { this.transform.y = -num; }

    /** A point object representing the camera's position in 2D space, anchored in the top-left. */
    get pos(): Point { return {x: this.x, y: this.y} };
    set pos(point) {
        this.x = point.x;
        this.y = point.y;
    }

    /** A point representing the camera's center-of-frame as placed in 2D space. */
    // center() returns a point-like object with functions deriving values from Camera's other properties.
    get center(): Point { return ((parent: Camera) => { return {
        /** The camera-center's x-coordinate in 2D space. */
        get x() { return parent.x + parent.frame.center.x; },
        set x(num) { parent.x = num - parent.frame.center.x; },
        
        /** The camera-center's y-coordinate in 2D space. */
        get y() { return parent.y + parent.frame.center.y; },
        set y(num) { parent.y = num - parent.frame.center.y; },
    }})(this)};
    set center(point) {
        this.center.x = point.x;
        this.center.y = point.y;
    }
 
    /** Describes properties of the camera's view of the game world. */
    get frame() {
        return ((parent: Camera) => { return {
            /** The width in 'pixels' of the camera's view into the game world. Setting this cannot affect the game's aspect ratio. */
            get width(): number { return Game.display.renderWidth * parent.zoom; },
            set width(num) { parent.zoom = num / Game.display.renderWidth; },

            /** The height in 'pixels' of the camera's view into the game world. Setting this cannot affect the game's aspect ratio. */
            get height(): number { return Game.display.renderHeight * parent.zoom; },
            set height(num) { parent.zoom = num / Game.display.renderHeight; },

            /** A point representing the relative position of the camera's center in 2D space. */
            get center(): Point { return {x: this.width*0.5, y: this.height*0.5}; },

            /** Two points describing the box the camera will try to keep any followed targets inside. */
            focusBox: ((frame: any) => { return {
                x1: 0,              // Not sure what I want to do here.
                y1: 0,              // These should be settable, but there's some logic in making
                x2: frame.width,    // sure they aren't set up all stupid-like.
                y2: frame.height    // Also, "frame: any" up there, I wonder what I'm doing.
            }})(this)
        }})(this);
    }

    /** The camera's angle of rotation. Expressed in radians. */
    get rotation(): number { return -this.transform.rotation; }
    set rotation(num) { this.transform.rotation = -num; }

    /** The camera's zoom level, or scaling of the game world it is peering into.
     * Note that this necessarily adjusts the view's pixel density. */
    get zoom(): number { return this.transform.scale.x; }
    set zoom(num) {
        this.transform.scale.setSize(num);
    }
}