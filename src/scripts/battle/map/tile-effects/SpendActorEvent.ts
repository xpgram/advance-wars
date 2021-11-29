import { UnitObject } from "../../UnitObject";
import { TileEvent } from "./TileEvent";

interface SpendActorEventOptions {
  actor: UnitObject;
}

export class SpendActorEvent extends TileEvent {

  private options: SpendActorEventOptions;

  constructor(options: SpendActorEventOptions) {
    super(options.actor.boardLocation);
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