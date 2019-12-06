import * as PIXI from "pixi.js";
import { LowResTransform } from "./LowResTransform";
import { TransformContainer, Point } from "./CommonTypes";
import { Game } from "..";
import { Common } from "./CommonUtils";

/**
 * Takes control of a PIXI container, usually the global stage, and manipulates it
 * to simulate camera movement and other camera features.
 * 
 * @author Dei Valko
 * @version 0.1.0
 */
export class Camera {

    private baseDimensions = {
        // TODO Make this settable from the constructor
        // TODO Adjust it with the aspect ratio? Currently, zooming resets any funny business you've done with width/height back to these defaults.
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
    followTarget: TransformContainer | Point | null = null;

    /** Called on every update; determines how the camera should move to keep the follow target in frame. */
    followAlgorithm: ((camera: Camera) => void) | null = null;

    /**
     * @param stage The 'world' container the camera will manipulate to pan, rotate and zoom.
     */
    constructor(stage: PIXI.Container) {
        this.stage = stage;
        this.width = this.baseDimensions.width;
        this.height = this.baseDimensions.height;
        this.followAlgorithm = borderedScreenPush; // Defined at the bottom, outside the class.
        
        Game.scene.ticker.add(this.update, this, -1);
        // I presume priority -1 means this update happens last.
        // This is important such that the cursor doesn't move after the stage
        // has been adjusted to it but before the draw call.
    }

    /** The world or layer the camera will move to simulate camera movement. */
    get stage(): PIXI.Container | null {
        return (this.stageTransform.object as PIXI.Container | null);
    }
    set stage(object) {
        // Remove view from last stage.
        if (this.stageTransform.object)
            (this.stageTransform.object as PIXI.Container).removeChild(this.frame);

        // Add view to new stage.
        if (object)
            object.addChild(this.frame);

        // Assign the new 'stage' to the camera.
        this.stageTransform.object = object;
    }

    /** The camera's x-coordinate in 2D space, anchored in the top-left. */
    get x() { return this.frame.x; }
    set x(num) { this.frame.x = num; }
    /** The camera's y-coordinate in 2D space, anchored in the top-left. */
    get y() { return this.frame.y; }
    set y(num) { this.frame.y = num; }

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
        // Get the focal point to zoom in on.
        let focal = this.getFocalPoint();

        // Adjust camera coords to new coords that keep the focal point in the same screen position.
        this.x = focal.x - ((focal.x - this.x) * this.zoom / n);
        this.y = focal.y - ((focal.y - this.y) * this.zoom / n);

        // Adjust camera frame to reflect new zoomed dimensions.
        this.width = this.baseDimensions.width / n;
        this.height = this.baseDimensions.height / n;
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

    /** Returns a point corresponding either to the target of focus, or the center of the camera if none exists. */
    getFocalPoint() {
        let focal;

        let isPoint = (p: any): p is Point => {
            return typeof p.x === 'number' && typeof p.y === 'number';
        }

        if (this.followTarget) {
            focal = {
                x: isPoint(this.followTarget) ? this.followTarget.x : this.followTarget.transform.exact.x,
                y: isPoint(this.followTarget) ? this.followTarget.y : this.followTarget.transform.exact.y
            }
        }
        else {
            focal = {
                x: this.center.x,
                y: this.center.y
            }
        }
        return focal;
    }
    
    /** If camera has a follow target, it will move to keep that target in view. */
    private update() {
        // Follow the focused object, if an algorithm for doing so exists.
        if (this.followAlgorithm)
            this.followAlgorithm(this);

        // Adjust the stage to fit the camera — (Coordinates are un-zoomed to correctly translate to unmodified 2D space.)
        this.stageTransform.x = Math.round(-this.x * this.zoom);
        this.stageTransform.y = Math.round(-this.y * this.zoom);
        this.stageTransform.scale.x = this.zoom;
        this.stageTransform.scale.y = this.zoom;
    }
}

function borderedScreenPush(camera: Camera) {
    // TODO Softcode these somewhere, or at least meaningfully hardcode them.
    let border = 32;
    let tileSize = 16;
    let focal = camera.getFocalPoint();

    let cam = {
        x: Math.floor(camera.x),
        y: Math.floor(camera.y),
        width: camera.width,
        height: camera.height
    }

    // Find absolute values from the world origin for the camera's inner-frame's edges.
    let left = cam.x + border + tileSize/2;   // tileSize/2 feels nice since we're in super widescreen.
    let right = cam.x + cam.width - border - tileSize - tileSize/2;
    let top = cam.y + border;
    let bottom = cam.y + cam.height - border - tileSize;

    // The distance we intend to travel this frame.
    let moveDist = {x:0, y:0};

    // Get horizontal distance
    if (focal.x > right)
        moveDist.x = focal.x - right;
    else if (focal.x < left)
        moveDist.x = focal.x - left;

    // Get vertical distance
    if (focal.y > bottom)
        moveDist.y = focal.y - bottom;
    else if (focal.y < top)
        moveDist.y = focal.y - top;

    // Move the frame.
    camera.x += moveDist.x;
    camera.y += moveDist.y;
}