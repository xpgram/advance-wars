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

  protected ratify(): void {
    const { map, players } = this.options.assets;
    const { actor, terrain } = this.options;

    actor.captureBuilding();
    if (actor.buildingCaptured()) {
      actor.stopCapturing();
      terrain.faction = actor.faction;
      map.revealSightMapLocation(actor.boardLocation, players.perspective);
    }
  }

  protected create(): void {
    const { actor } = this.options;

    this.ratify();
    this.finish();
    return;

    const preCapture = actor.capture;
    actor.captureBuilding();
    const postCapture = actor.capture;

    const bg = new PIXI.Graphics();
    bg.beginFill(0);
    bg.drawRect(0,0,128,128);
    bg.endFill();

    const fill = new PIXI.Graphics();
    fill.beginFill(0xFFFFFF);
    fill.drawRect(0,0,24,24);
    fill.endFill();

    const setValue = (n: number) => {
      const r = n / 20;

    }
  }

  protected update(): void {
    
  }

  protected destroy(): void {
    
  }

}