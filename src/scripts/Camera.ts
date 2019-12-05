import * as PIXI from "pixi.js";
import { LowResTransform } from "./LowResTransform";
import { TransformContainer, Point } from "./CommonTypes";
import { Game } from "..";
import { Common } from "./CommonUtils";

/**
 * Takes control of a PIXI container, usually the global stage, and manipulates it
 * to simulate camera movement and other camera features.
 * 
 * // TODO: Camera Rect placed into game world, the same one it's manipulating.
 * // TODO: Fit Camera to Rect method.
 * // TODO: Follow Target method should be a function that accepts a coordinate/transform.
 * // TODO: Add update() to ticker
 * 
 * @author Dei Valko
 * @version 0.1.0
 */
export class Camera {

    private baseDimensions = {
        // TODO Make this settable from the constructor
        width: Game.display.renderWidth,
        height: Game.display.renderHeight
    }

    /** Represents the in-world (in-stage) coordinates of the camera.
     * An empty Sprite only because an empty Container wouldn't keep width/height values. */
    private frame = new PIXI.Sprite();

    private _stageTransform = new LowResTransform();
    /** Reference to the controlled stage's transform. */
    get stageTransform(): LowResTransform {
        return this._stageTransform;
    }
    set stageTransform(other) {
        this._stageTransform.copyFrom(other);
    }

    /** The object which the camera will try to keep in frame. If null, the camera does not follow. */
    followTarget: TransformContainer | null = null;

    /**
     * @param stage The 'world' container the camera will manipulate to pan, rotate and zoom.
     */
    constructor(stage: PIXI.Container) {
        this.stage = stage;

        this.frame.width = this.baseDimensions.width;
        this.frame.height = this.baseDimensions.height;
        
        Game.scene.ticker.add(this.update, this);
    }

    /** The world or layer the camera will move to simulate camera movement. */
    get stage(): PIXI.Container | null {
        return (this.stageTransform.object as PIXI.Container | null);
    }
    set stage(object) {
        // Remove view from last stage.
        if (this.stageTransform.object)
            //@ts-ignore
            this.stageTransform.object.removeChild(this.frame);

        this.stageTransform.object = object;

        // Add view to new stage.
        if (this.stageTransform.object)
            //@ts-ignore
            this.stageTransform.object.addChild(this.frame);
    }

    /** The camera's x-coordinate in 2D space, anchored in the top-left. */
    get x() { return this.frame.x; }
    set x(num) { this.frame.x = num; }
    /** The camera's y-coordinate in 2D space, anchored in the top-left. */
    get y() { return -this.frame.y; }
    set y(num) { this.frame.y = -num; }

    /** A point object representing the camera's position in 2D space, anchored in the top-left. */
    get pos(): Point { return {x: this.x, y: this.y} };
    set pos(point) {
        this.x = point.x;
        this.y = point.y;
    }

    /** The length in pixels (as game-world units of distance) of the camera's width. */
    get width() { return this.frame.width; }
    set width(num) {
        this.frame.width = num;
        this._center.x = num / 2;
    }

    /** The length in pixels (as game-world units of distance) of the camera's height. */
    get height() { return this.frame.height; }
    set height(num) {
        this.frame.height = num;
        this._center.y = num / 2;
    }

    /** The camera's height to width ratio. */
    get aspectRatio() { return this.width / this.height; }

    private _center: Point = {x: 0, y: 0};
    /** A point representing the camera's center-of-frame coordinates. */
    get center(): Point { return ((parent: Camera) => { return {
        /** The camera-center's x-coordinate. */
        get x() { return parent.x + parent._center.x; },
        set x(num) { parent.x = num - parent._center.x; },
        
        /** The camera-center's y-coordinate. */
        get y() { return parent.y + parent._center.y; },
        set y(num) { parent.y = num - parent._center.y; },
    }})(this)};
    set center(point) {
        this.center.x = point.x;
        this.center.y = point.y;
    }
 
    /** The camera's zoom level by magnification of lengths.
     * Note that setting this necessarily adjusts the view's pixel density. */
    get zoom() {
        return this.baseDimensions.width / this.frame.width;
    }
    set zoom(n: number) {
        this.frame.width = this.baseDimensions.width / n;
        this.frame.height = this.baseDimensions.height / n;
    }

    /** The camera's zoom level by magnification of areas.
     * Note that settings this necessarily adjusts the view's pixel density. */
    get magnification() {
        return Math.pow(this.zoom, 2);
    }
    set magnification(n: number) {
        this.zoom = Math.sqrt(n);
    }

    /** The camera's angle of rotation. Expressed in radians. */
    get rotation(): number { return this.frame.rotation; }
    set rotation(num) { this.frame.rotation = num; }
    
    /** If camera has a follow target, it will move to keep that target in view. */
    update() {
        if (!this.followTarget)
            return;
    
        // TODO Softcode these somewhere, or at least meaningfully hardcode them.
        let border = 32 + 8;
        let focal = {
            x: this.followTarget.transform.exact.x + 8,
            y: this.followTarget.transform.exact.y + 8
        };

        // Find absolute values from the world origin for the camera's inner-frame's edges.
        let left = this.frame.x + border;
        let right = left + this.frame.width - border*2;
        let top = this.frame.y + border;
        let bottom = top + this.frame.height - border*2;

        let moveDist = {x:0, y:0};  // The distance we intend to travel this frame.

        // Horizontal distance
        if (focal.x > right)
            moveDist.x = focal.x - right;
        else if (focal.x < left)
            moveDist.x = focal.x - left;

        // Vertical distance
        if (focal.y > bottom)
            moveDist.y = focal.y - bottom;
        else if (focal.y < top)
            moveDist.y = focal.y - top;

        this.x += moveDist.x;
        this.y += moveDist.y;

        // Adjust the stage to fit the camera
        this.stageTransform.x = this.x;
        this.stageTransform.y = this.y;

        console.log(`${this.stageTransform.x},${this.stageTransform.y}`);
    }
}