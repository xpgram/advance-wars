import { BattleSceneControllers } from "../../turn-machine/BattleSceneControllers";
import { UnitObject } from "../../UnitObject";
import { Terrain } from "../Terrain";
import { TerrainObject, TerrainType } from "../TerrainObject";
import { CapturePropertyEvent } from "./CapturePropertyEvent";


interface BuildTempPortEventOptions {
  actor: UnitObject,
  terrain: TerrainObject,
  assets: BattleSceneControllers,
}

export class BuildTempPortEvent extends CapturePropertyEvent {

  protected newTerrType: TerrainType;

  constructor(options: BuildTempPortEventOptions) {
    super(options);
    this.newTerrType = (options.terrain.type === Terrain.Beach) ? Terrain.TempPort : Terrain.TempAirpt;
    this.illustration = new this.newTerrType().illustration;
    this.terrainName = this.newTerrType.name;
  }
  
  protected captureProperty(): void {
    const { map, players } = this.options.assets;
    const { actor } = this.options;

    if (actor.buildingCaptured()) {
      actor.stopCapturing();
      const square = map.changeTile(actor.boardLocation, this.newTerrType);
      square.terrain.faction = actor.faction;
      map.revealSightMapLocation(actor.boardLocation, players.perspective);
      actor.ammo -= 1;
    }
  }

}