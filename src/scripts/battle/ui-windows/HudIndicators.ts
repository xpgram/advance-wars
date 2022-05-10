import { PIXI } from "../../../constants";
import { Game } from "../../..";
import { DayCounter } from "./DayCounter";
import { Fadable } from "./Fadable";


export class HudIndicators extends Fadable {

  readonly container = new PIXI.Container();

  dayCounter = new DayCounter();

  // TODO I want to move this to a separate slider which doesn't rotate around
  // the view but is 'pushed' from the left by the one that does.

  constructor() {
    super();

    this.container.addChild(
      ...[
        this.dayCounter,
      ].map( e => e.container )
    );

    Game.hud.addChild(this.container);
  }

  destroy() {
    this.dayCounter.destroy();
    this.container.destroy({children: true});
  }
}