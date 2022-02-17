import { Point } from "../../../Common/Point";
import { TileEvent } from "./TileEvent";


interface SiloLaunchEventOptions {
  location: Point;
}

export class SiloLaunchEvent extends TileEvent {
  
  protected options: SiloLaunchEventOptions;
  private rocket!: PIXI.AnimatedSprite;

  constructor(options: SiloLaunchEventOptions) {
    super(options.location);
    this.options = options;
  }

  private ratify() {
    
  }

  protected create(): void {

  }

  protected update(): void {

  }

  protected destroy(): void {

  }

}