import { ButtonState } from "./ButtonState";
import { Common } from "../CommonUtils";
import { PointPrimitive } from "../Common/Point";

/**  */
export class Axis2D {
    private _name: string | null;
    private _point: PointPrimitive;
    private _lastPoint: PointPrimitive;
    private _state: ButtonState;

    constructor(name: string | null) {
        this._name = name || null;
        this._point = {x: 0, y: 0};
        this._lastPoint = {x: 0, y: 0};
        this._state = ButtonState.Up;
    }

    get name() { return this._name; }
    get point() { return this._point; }

    /** A point representing relative changes to the dpad axis this frame. */
    get framePoint() {
        return {
            x: this._point.x - this._lastPoint.x,
            y: this._point.y - this._lastPoint.y,
        };
    }

    /** Returns true if this axis has a directional bias (non-neutral). */
    get roaming() { return this._state == ButtonState.Down || this.tilted; }
    /** Returns true if this axis is resting in its home position (0,0). */
    get neutral() { return this._state == ButtonState.Up || this.returned; }
    /** Returns true if this axis was engaged this frame. */
    get tilted() { return this._state == ButtonState.Pressed; }
    /** Returns true if this axis was disengaged this frame. */
    get returned() { return this._state == ButtonState.Released; }
    /** Returns true if this axis' engaged state was changed this frame. */
    get changed() { return this.tilted || this.returned; }

    /** Updates this axis with new values. Used by the parent-controller object. */
    update(input: PointPrimitive) {
        this._lastPoint.x = this._point.x;
        this._lastPoint.y = this._point.y;
        this._point.x = Common.clamp(input.x, -1, 1);
        this._point.y = Common.clamp(input.y, -1, 1);

        // Absolve single-frame states
        if (this.returned) this._state = ButtonState.Up;
        if (this.tilted) this._state = ButtonState.Down;

        // Affect state if there's been a change.
        let stickEngaged = (this._point.x != 0 || this._point.y != 0);
        if (this.neutral && stickEngaged)
            this._state = ButtonState.Pressed;
        if (this.roaming && !stickEngaged)
            this._state = ButtonState.Released;
    }

    /** Resets the axis state; sets its position to home, skipping the released state. */
    reset() {
        this._point = {x: 0, y: 0};
        this._lastPoint = {x: 0, y: 0};
    }
}