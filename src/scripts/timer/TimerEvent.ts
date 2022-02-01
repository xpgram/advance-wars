import { EaseFunction, Ease } from "../Common/EaseMethod";
import { Common } from "../CommonUtils";

export type ProgressiveFunction = (n: number) => void;

export module TEvent {

  // TODO Shapes have been unimplemented, pretty much. What to do?
  // TODO Every max occurrences have been unimplemented. Whata do?

  export interface TimerEvent {
    time: number;
    until: number;
    interval: number;
    repeat: number;
    completed: boolean;
    action: ProgressiveFunction;
    shape: EaseFunction;
    context?: object;
  }

  interface TimerEventNew {
    time: number;
    until: number;
    interval: number;
    repeat: number;

    completed: boolean;   // Whether this event is done calculating; for culling.

    snapshot?: object;    // The start point from which tweens are calculating.
    target?: object;      // The end point to which tweens are calculating.
    ease?: EaseFunction;  // The shape by which snap is tweened to target. Default linear.

    action?: ProgressiveFunction;   // Function callback, with added n for... no purpose.
    context?: object;     // Object bound to action() call.
  }

  export interface TimerEventOptions {
    time: number;         // Start time.
    until?: number;       // End time.
    interval?: number,    // How long to wait after until to repeat; =time by default
    repeat?: number,      // n<0 forever, n=0 single, n>0 specifies additional times
    action: ProgressiveFunction;  // n is proportional to current time and start/end
    shape?: EaseFunction;  // shape function for the input to action()
    context?: object;       // object context to call action() with
  }

  export function createTimerEvent(e: TimerEventOptions) {
    return Common.assignDefaults(e, {
      until: e.time,
      interval: e.time,
      repeat: 0,
      shape: Ease.linear.out,
      completed: false,
    });
  }

  export function getSpan(e: TimerEvent | undefined) {
    return (e) ? e.until - e.time : 0;
  }

}