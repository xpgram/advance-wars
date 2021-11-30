import * as PIXI from "pixi.js";
import { LowResTransform } from "./LowResTransform";
import { TransformContainer } from "./CommonTypes";
import { Game } from "..";
import { Point } from "./Common/Point";
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

    /** The camera's in-world coordinates: represents what it can see. */
    private frameRect = new PIXI.Rectangle(0,0,this.baseDimensions.width,this.baseDimensions.height);
    /** The camera's border's in-world coordinates: represents what it considers 'in-frame'. */
    private borderRect = this.frameRect.clone();
    // TODO This needs to be packageable and interchangeable, just like the follow algorithms.
    // TODO Setup a setFollow() that takes both algo? and border? as optional arguments.

    /** A rectangle in world-space representing what the camera can see. */
    get worldFrame() {
        let frameRect = this.frameRect.clone();
        return {
            get x() { return frameRect.x; },
            get y() { return frameRect.y; },
            get width() { return frameRect.width; },
            get height() { return frameRect.height; }
        };
    }

    /** The rectangle within frame-space that the camera considers 'in-focus' or 'in-view'. */
    get focalFrame() {
        let borderRect = this.borderRect.clone();
        return {
            get x() { return borderRect.x; },
            get y() { return borderRect.y; },
            get width() { return borderRect.width; },
            get height() { return borderRect.height; }
        };
    }

    /** A rectangle in world-space representing what the camera considers in-view. */
    get viewFrame() {
        const { x: fx, y: fy, width: fw, height: fh } = this.frameRect;
        const { x: bx, y: by, width: bw, height: bh } = this.borderRect;
        return {
            get x() { return bx + fx; },
            get y() { return by + fy; },
            get width() { return bw; },
            get height() { return bh; }
        };
    }

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
        // Assign the new 'stage' to the camera.
        this.stageTransform.object = object;
    }

    /** The camera's x-coordinate in 2D space, anchored in the top-left. */
    get x() { return this.worldFrame.x; }
    set x(num) { this.frameRect.x = num; }
    /** The camera's y-coordinate in 2D space, anchored in the top-left. */
    get y() { return this.worldFrame.y; }
    set y(num) { this.frameRect.y = num; }

    /** A point object representing the camera's position in 2D space, anchored in the top-left. */
    get pos(): Point { return new Point(this.x, this.y) };
    set pos(point) {
        this.x = point.x;
        this.y = point.y;
    }

    /** The length in pixels (as game-world units of distance) of the camera's width. */
    get width() { return this.worldFrame.width; }
    set width(num) {
        this.frameRect.width = num;
        this._center.x = num / 2;
    }

    /** The length in pixels (as game-world units of distance) of the camera's height. */
    get height() { return this.worldFrame.height; }
    set height(num) {
        this.frameRect.height = num;
        this._center.y = num / 2;
    }

    /** The camera's height to width ratio. */
    get aspectRatio() { return this.width / this.height; }

    private _center = new Point();
    /** A point representing the camera's center-of-frame coordinates. */
    get center(): Point {
        return new Point(this.x + this._center.x, this.y + this._center.y);
    }
    set center(point) {
        this.center.x = point.x - this._center.x;
        this.center.y = point.y - this._center.y;
    }
 
    /** The camera's zoom level by magnification of lengths. */
    get zoom() {
        return this.baseDimensions.width / this.worldFrame.width;
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

    /** The camera's zoom level by magnification of areas. */
    get magnification() {
        return Math.pow(this.zoom, 2);
    }
    set magnification(n: number) {
        this.zoom = Math.sqrt(n);
    }

    /** The camera's angle of rotation. Expressed in radians. */
    rotation = 0;

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

    /** True if the camera's focal point is inside the view bounds. */
    get subjectInView(): boolean {
        const focal = this.getFocalPoint();
        const rect = this.viewFrame;
        const hor = focal.x >= rect.x && focal.x <= rect.x + rect.width;
        const ver = focal.y >= rect.y && focal.y <= rect.y + rect.height;
        return hor && ver;
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
        this.stageTransform.rotation = -this.rotation;
    }
}

function borderedScreenPush(camera: Camera) {
    // TODO Softcode these somewhere, or at least meaningfully hardcode them.
    let border = 32;
    let tileSize = 16;
    let maxDist = tileSize * .5;

    // TODO This is obviously broken implementation.
    //@ts-ignore
    const borderRect = camera.borderRect;

    borderRect.x = border + 8;
    borderRect.y = border;
    borderRect.width = camera.worldFrame.width - 2*border - 8;
    borderRect.height = camera.worldFrame.height - 2*border;

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

    // TODO Use camera.viewBorder, or whatever we're calling it..

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

    moveDist.x = Common.clamp(moveDist.x, -maxDist, maxDist);
    moveDist.y = Common.clamp(moveDist.y, -maxDist, maxDist);

    // Move the frame.
    camera.x += moveDist.x;
    camera.y += moveDist.y;
}