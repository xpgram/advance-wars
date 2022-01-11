import { DayCounter } from "./DayCounter";
import { SlidingWindow } from "./SlidingWindow";


export class HudIndicators extends SlidingWindow {

  dayCounter = new DayCounter();

  constructor(options: SlidingWindowOptions) {
    super(options);
    this.dayCounter.container.x = 4;

    const test1 = {container: new PIXI.Sprite(this.sheet.textures[`icon-orderable-bases.png`])};
    test1.container.position.set(24, 4);
    test1.container.scale.set(.5);
    const test2 = {container: new PIXI.Sprite(this.sheet.textures[`icon-orderable-units.png`])};
    test2.container.position.set(40, 4);
    test2.container.scale.set(.5);

    this.displayContainer.addChild(
      ...[
        this.dayCounter,
        test1,
        test2,
      ].map( e => e.container )
    );
  }

  destroy() {
    this.dayCounter.destroy();
  }
}