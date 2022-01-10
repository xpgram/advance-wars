import { DayCounter } from "./DayCounter";
import { SlidingWindow } from "./SlidingWindow";


export class HudIndicators extends SlidingWindow {

  dayCounter = new DayCounter();

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