import { EaseFunction, EaseMethod } from "../Common/EaseMethod";
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
      shape: (n: number) => EaseMethod.linear.out(n),
      completed: false,
    });
  }

  export function getSpan(e: TimerEvent | undefined) {
    return (e) ? e.until - e.time : 0;
  }

}