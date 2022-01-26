import { Timer } from "./Timer";

/**  */
interface TimetableItem {
  time: number,
  callback: () => void;
  context?: object;
}

/**  */
export class Timetable {

  private dirty = false;      // Whether list needs to be sorted
  private lastTriggered = -1; // idx of last timetable called during last check

  private timer: Timer;
  private timetable: TimetableItem[];


  constructor() {

  }


  /** Adds new Timetable items to the itinerary. */
  schedule(...items: TimetableItem[]) {
    this.timetable.push(...items);
    this.dirty = true;
  }

  /**  */
  remove() {

  }

  /**  */
  clear() {

  }

  /** Mutates the timetable to be in chronological order. */
  private sortSchedule() {
    this.timetable.sort( (a,b) => a.time - b.time );
    const length = (this.timetable.length > 0)
      ? Math.max(...this.timetable.map( t => t.time ))
      : 0;
    this.timer = new Timer(length);
    this.dirty = false;

    this.timer.at(2, () => {}, this);
      // I think this is better.
      // I don't have to rewrite start or stop or other shit either.
      // this.timer.every(3, () => {}, this);
      // If new Timer() is not provided a length, it assumes stopwatch behavior.
      
  }

  /** Begin or resume the itinerary schedule. */
  start() {
    if (this.dirty)
      this.sortSchedule();
    this.timer.start();
  }

  /** Halt the itinerary schedule in place. */
  stop() {

  }

  /** Resets the clock to zero. Does not halt the clock. */
  reset() {

  }

  /** Resets the clock to zero, then starts it if it wasn't already. */
  startReset() {
    this.reset();
    this.start();
  }

  /** Halts the schedule clock, then resets it to zero. */
  stopReset() {
    this.stop();
    this.reset();
  }

  /** Calls all remaining timetable objects. Keep in mind, if those objects are
   * themselves timekept, this does nothing to skip their processes. */
  flush() {

  }

  // onCancel?
}