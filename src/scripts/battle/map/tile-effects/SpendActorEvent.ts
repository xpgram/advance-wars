import { Point } from "../../../Common/Point";
import { UnitObject } from "../../UnitObject";
import { TileEvent } from "./TileEvent";

interface SpendActorEventOptions {
  actor: UnitObject;
  location: Point;
}

export class SpendActorEvent extends TileEvent {

  private options: SpendActorEventOptions;

  constructor(options: SpendActorEventOptions) {
    super(options.location);
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