import { Point } from "../../../Common/Point";
import { UnitObject } from "../../UnitObject";
import { TileEvent } from "./TileEvent";

interface SpendActorEventOptions {
  actor: UnitObject;
}

export class SpendActorEvent extends TileEvent {

  private options: SpendActorEventOptions;

  constructor(options: SpendActorEventOptions) {
    super({
      // Retrieves wherever the unit is *now*. // TODO This doesn't cause a circular reference, does it?
      get x() { return options.actor.boardLocation.x; },
      get y() { return options.actor.boardLocation.y; },
    });
    this.options = options;
  }

  protected create(): void {
    const { actor } = this.options;
    actor.spent = true;
    this.finish();
  }

  protected update(): void {
  }

  protected destroy(): void {
  }
}