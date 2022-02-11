import { BattleSceneControllers } from "../../turn-machine/BattleSceneControllers";
import { UnitObject } from "../../UnitObject";
import { TerrainObject } from "../TerrainObject";
import { TileEvent } from "./TileEvent";

interface CapturePropertyEventOptions {
  actor: UnitObject;
  terrain: TerrainObject;
  assets: BattleSceneControllers;
}

export class CapturePropertyEvent extends TileEvent {

  private options: CapturePropertyEventOptions;

  constructor(options: CapturePropertyEventOptions) {
    super(options.actor.boardLocation);
    this.options = options;
  }

  protected create(): void {
    const { map, players } = this.options.assets;
    const { actor, terrain } = this.options;

    actor.captureBuilding();
    if (actor.buildingCaptured()) {
      actor.stopCapturing();
      terrain.faction = actor.faction;
      map.revealSightMapLocation(actor.boardLocation, players.perspective);
    }

    this.finish();
  }

  protected update(): void {
    
  }

  protected destroy(): void {
    
  }

}