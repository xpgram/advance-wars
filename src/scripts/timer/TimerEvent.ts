import { EaseFunction, Ease } from "../Common/EaseMethod";
import { Common } from "../CommonUtils";
import { Tweenable } from "./Timer";

export type ProgressiveFunction = (n: number) => void;

export module TEvent {

  // TODO Shapes have been unimplemented, pretty much. What to do?
  // TODO Every max occurrences have been unimplemented. Whata do?

  export interface TimerEvent {
    time: number;
    until: number;
    interval: number;
    repeat: number;
    completed: boolean;   // Internal use
    action: ProgressiveFunction;
    context?: object;
    object?: Tweenable;
    snap?: Tweenable;     // Internal use
    target?: Tweenable;
    ease: EaseFunction;
  }

  export interface TimerEventOptions {
    time: number;         // Start time.
    until?: number;       // End time.
    interval?: number,    // How long to wait after until to repeat; =time by default
    repeat?: number,      // n<0 forever, n=0 single, n>0 specifies additional times
    action?: ProgressiveFunction; // n is proportional to current time and start/end
    context?: object;     // object context to call action() with
    object?: object;
    target?: object;      // target properties to ease object to
    ease?: EaseFunction;  // shape function for the input to action()
  }

  export function createTimerEvent(e: TimerEventOptions) {
    return Common.assignDefaults(e, {
      until: e.time,
      interval: e.time,
      repeat: 0,
      completed: false,
      action: () => {},
      object: e.object as Tweenable,  // Shuts up Typescript
      target: e.target as Tweenable,
      ease: Ease.linear.out,
    });
  }

  export function getSpan(e: TimerEvent | undefined) {
    return (e) ? e.until - e.time : 0;
  }

}