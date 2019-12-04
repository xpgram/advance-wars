import * as PIXI from "pixi.js";
import { Transformable, Point, Point3D } from "./CommonTypes";

/**
 * Represents the translational, rotational and proportional transform of a 2-dimensional
 * object relative to its parent container, but while forcing rounded-integers on the
 * object-transform it's controlling to preserve strict "pixel" positioning.
 * 
 * @author Dei Valko
 * @version 2.0.0
 */
export class LowResTransform {
    private _object: Transformable | null = null;
    private _pos: PIXI.ObservablePoint = new PIXI.ObservablePoint(this.updateObjectPosition, this, 0,0);
    private _zIndex: number = 0;
    private _rotation: number = 0;
    private _scale: PIXI.ObservablePoint = new PIXI.ObservablePoint(this.updateObjectScale, this, 1,1);

    constructor(pos?: Point, object?: Transformable) {
        this.pos = pos || {x: 0, y: 0};
        this.object = object || null;
    }

    /** Removes all references from the object pool. */
    destroy() {
        this.object = null;
    }

    /** A handle for the transformable object to be controlled. */
    get object(): Transformable | null {
        return this._object;
    }
    set object(object) {
        this._object = object;
        if (object)
            this.updateObjectTransform();
            // TODO: Apply a filter to PIXI.Sprite objects which mimic low-res pixel interpolation (nearest neighbor).
    }

    /** This transform's position in 2D space on the horizontal axis. */
    get x(): number {
        return this._pos.x;
    }
    set x(num) {
        this._pos.x = num;
    }

    /** This transform's position in 2D space on the vertical axis. */
    get y(): number {
        return this._pos.y;
    }
    set y(num) {
        this._pos.y = num;
    }

    /** An alias for LowResTransform.zIndex. Describes this transform's ordinal in layer draw order. */
    get z(): number {
        return this.zIndex;
    }
    set z(num) {
        this.zIndex = num;
    }

    /** Describes this transform's odrinal in layer draw order. */
    get zIndex(): number {
        return this._zIndex;
    }
    set zIndex(num) {
        this._zIndex = num;
        this.updateObjectPosition();
    }

    /** A point which represents the transform's position in 2D space. */
    get pos(): Point {
        return this._pos;
    }
    set pos(point) {
        this._pos.set(point.x, point.y);
    }

    /** A point which utilizes sprite zIndex to represent the transform's position in 3D space. */
    get pos3D(): Point3D {
        return {x: this._pos.x, y: this._pos.y, z: this.zIndex};
    }
    set pos3D(point) {
        this._pos.set(point.x, point.y);
        this.z = point.z;
    }

    /** This transform's angle of rotation. Expressed in radians. */
    get rotation(): number {
        return this._rotation;
    }
    set rotation(num) {
        this._rotation = num;
        this.updateObjectRotation();
    }

    /** An accessor for this transform's scale properties. */
    readonly scale = ((parent: LowResTransform) => { return {
        /** This transform's scale ratio along the horizontal axis. Default: 1 */
        get x (): number {
            return parent._scale.x;
        },
        set x (num) {
            parent._scale.x = num;
        },

        /** This transform's scale ratio along the vertical axis. Default: 1 */
        get y (): number {
            return parent._scale.y;
        },
        set y (num) {
            parent._scale.y = num;
        },
        
        /** Sets object scale linearly; scale.x = scale.y = value */
        set(num: number) {
            parent._scale.set(num, num);
        }
    }})(this);

    /** Contains accessor methods for the exact details of the object on screen. */
    readonly exact = ((parent: LowResTransform) => { return {
        get x() { return (parent.object) ? parent.object.x : parent.x; },
        get y() { return (parent.object) ? parent.object.y : parent.y; },
        get z() { return (parent.object) ? parent.object.zIndex : parent.zIndex; }
        // TODO Expand this? X and Y are currently the only relevant properties.
    }})(this);

    /** Conforms the controlled object to this transform. Used once only when a new object is assigned. */
    private updateObjectTransform() {
        this.updateObjectPosition();
        this.updateObjectRotation();
        this.updateObjectScale();
    }

    /** Conforms the controlled object to this transform's positional values. */
    private updateObjectPosition() {
        if (this.object == null)
            return;
        let object = this.object;
        object.x = Math.floor(this.x);
        object.y = Math.floor(this.y);
        object.zIndex = Math.floor(this.z);
    }

    /** Conforms the controlled object to this transform's rotational values. */
    private updateObjectRotation() {
        if (this.object == null)
            return;
        this.object.rotation = this.rotation;
    }

    /** Conforms the controlled object to this transform's proportional values. */
    private updateObjectScale() {
        if (this.object == null)
            return;
        let object = this.object;
        object.scale.x = this.scale.x;
        object.scale.y = this.scale.y;
        object.width = Math.floor(object.width);    // Confines the transform to a nice, rounded-integer, pixel-block size.
        object.height = Math.floor(object.height);  // Does not force low-res image interpolation, however.
    }

    /** Copies the properties of another LowResTransform object, ignoring the controlled object. */
    copyFrom(other: LowResTransform) {
        this._pos.copyFrom(other._pos);
        this._rotation = other._rotation;
        this._scale.copyFrom(other._scale);
        this.updateObjectTransform();
    }
}