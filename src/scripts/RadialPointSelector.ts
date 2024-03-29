import { Game } from "..";
import { Point } from "./Common/Point";
import { Slider } from "./Common/Slider";
import { VirtualGamepad } from "./controls/VirtualGamepad";
import { Pulsar } from "./timer/Pulsar";
import { Timer } from "./timer/Timer";

interface Options {
  /** Reference to active player controls. */
  gamepad: VirtualGamepad;
  /** The point about which all points in the points list revolve. */
  origin: Point;
  /** The list of points to select over. */
  points: Point[];
  /** The point the selector mechanism should start on. */
  startingPoint?: Point,
  /** A vector describing the ideal angle the selected starting point should be closest to. */
  startingVector?: Point,
  /** Function to call any time the selection index is incremented. */
  onIncrement?: (p: Point) => void;
  /** The context object with which to call the listener. */
  context?: Object,
}

/** Handles the selection management of a list of points revolving about
 * an origin. Selection of the list increments in the clockwise direction,
 * but directional inputs prefer to move the cursor in the selfsame direction
 * when possible: left will always attempt to move left-ward first.
 */
export class RadialPointSelector {

  private gamepad: VirtualGamepad;
  private onIncrement: (p: Point) => void;
  private context?: Object;

  private origin: Point;
  private points: Point[];
  private index: Slider;
  private incrementDirection = 1;

  /** Used to preserve increment direction when quickly tapping. */
  private fastTapTimer = new Timer(.35).noSelfDestruct();
  /** Which directional input's increment direction is being preserved. */
  private lastTapVector?: Point;

  /** Manages directional input held behavior. */
  private holdPulsar = new Pulsar(
    {
      firstInterval: 20,
      interval: 6,
    },
    this.triggerIncrement,
    this
  )

  /** Increments the points selector and calls the listener function. */
  private triggerIncrement() {
    this.index.increment(this.incrementDirection);
    this.onIncrement.call(this.context, this.points[this.index.output]);
  }

  /** The current point selected. */
  get current() { return this.points[this.index.output]; }

  ////////////////////////////////////////
  constructor({gamepad, origin, points, startingPoint, startingVector, onIncrement, context}: Options) {
    if (points.length === 0)
      throw new Error(`Points list provided was length zero.`);

    // Sort points list — clockwise and farthest-first
    function sortAngle(p: Point) {
      const v = p.subtract(origin);
      const rad = -v.rotateByVector(Point.Up).polarAngle();
      const mag = v.magnitude();
      return rad*1000 + mag;
    }
    points.sort( (a,b) => sortAngle(a) - sortAngle(b) );

    // Bind object properties
    this.gamepad = gamepad;
    this.origin = origin;
    this.points = points;
    this.onIncrement = onIncrement || (p => {});
    this.context = context;

    // Build selector
    if (startingVector && !startingPoint) {
      const angleDifference = (p: Point) => startingVector.angleDifference(p.subtract(origin));
      startingPoint = points.reduce( (r, p) => (angleDifference(p) < angleDifference(r)) ? p : r );
    }

    let idx = (startingPoint)
      ? points.findIndex( p => p.equal(startingPoint) ) // ... This is a TypeScript bug.
      : 0;
    idx = (idx !== -1) ? idx : 0;

    this.index = new Slider({
      max: points.length,
      track: idx,
      granularity: 1,
      looping: true,
    })

    Game.scene.ticker.add(this.update, this);
  }

  destroy() {
    //@ts-expect-error
    this.onIncrement = undefined;
    this.fastTapTimer.destroy();
    this.holdPulsar.destroy();
    Game.scene.ticker.remove(this.update, this);
  }

  private update() {
    const { gamepad, holdPulsar, fastTapTimer } = this;

    const onButtonTap = () => {
      const { point, framePoint } = gamepad.axis.dpad;

      const newInput = (this.lastTapVector?.notEqual(framePoint));
      const reverseInput = (this.lastTapVector?.add(framePoint).equal(Point.Origin)) ? -1 : 1;
      this.lastTapVector = framePoint;

      // Update CW/CCW increment direction
      if (reverseInput === -1 && fastTapTimer.ticking)
        this.incrementDirection *= -1;

      else if (newInput || !fastTapTimer.ticking) {
        const intuitiveReverse = fastTapTimer.ticking ? -1 : 1;
        const vector = this.current.subtract(this.origin);
        const dir = vector.clockDirectionTo(point);
        this.incrementDirection =
          (dir !== 0) ? dir : this.incrementDirection; // * intuitiveReverse;  // I can't decide about this.
      }

      this.triggerIncrement();
    }

    // Manage hold button behavior
    if (gamepad.axis.dpad.returned) {
      fastTapTimer.startReset();
      holdPulsar.stop();
    }
    else if (gamepad.dpadButtons.some( b => b.pressed || b.released ))
      holdPulsar.startReset();

    // Manage tap button behavior
    if (gamepad.dpadButtons.some( b => b.pressed ))
      onButtonTap();
  }

  /** Sets the selector's index value to one whose data matches the point given.
   * If the given point cannot be found within the list, no change is made. */
  setIndexToPoint(loc: Point) {
    const idx = this.points.findIndex( (p) => p.equal(loc) );
    if (idx >= 0) {
      this.index.track = idx;
      this.onIncrement.call(this.context, this.points[this.index.output]);
    }
  }

}