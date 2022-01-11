import { DayCounter } from "./DayCounter";
import { SlidingWindow } from "./SlidingWindow";


export class HudIndicators extends SlidingWindow {

  dayCounter = new DayCounter();

  // TODO I want to move this to a separate slider which doesn't rotate around
  // the view but is 'pushed' from the left by the one that does.

  constructor(options: SlidingWindowOptions) {
    super(options);
    this.dayCounter.container.x = 4;

    this.displayContainer.addChild(
      ...[
        this.dayCounter,
      ].map( e => e.container )
    );
  }

  destroy() {
    this.dayCounter.destroy();
  }
}