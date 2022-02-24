import { Game } from "../../../..";
import { Rectangle } from "../../../Common/Rectangle";
import { Timer } from "../../../timer/Timer";
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

  private captureProperty(): void {
    const { map, players } = this.options.assets;
    const { actor, terrain } = this.options;

    if (actor.buildingCaptured()) {
      actor.stopCapturing();
      terrain.faction = actor.faction;
      map.revealSightMapLocation(actor.boardLocation, players.perspective);
    }
  }

  protected ratify(): void {
    const { actor } = this.options;

    actor.captureBuilding();
    this.captureProperty();
  }

  protected create(): void {
    const { actor } = this.options;

    // Ratify immediate changes; record changes for animation
    const preCapture = actor.capture;
    actor.captureBuilding();
    const postCapture = actor.capture;

    // Setup UI element definitions
    const windowRect = new Rectangle(0,0,80,64);

    const barSep = 3;
    const bar = new Rectangle(
      windowRect.width-18,
      windowRect.height-barSep-1,
      16,
      barSep-1
    );

    const drawRect = (g: PIXI.Graphics, r: Rectangle, c: number, a: number) => {
      g.beginFill(c,a);
      g.drawRect(r.x, r.y, r.width, r.height);
      g.endFill();
    }

    // Assemble UI elements
    const bg = new PIXI.Graphics();
    drawRect(bg, windowRect, 0, .5);
    bg.position.set(
      Game.display.renderWidth/2,
      Game.display.renderHeight/2,
    )
    bg.pivot.set(
      bg.width/2,
      bg.height/2,
    )

    const meter = new PIXI.Graphics();
    for (let i = 0; i < 20; i++)
      drawRect(meter, bar.move(0, -barSep*i), 0x444444, 1);

    const meterFill = new PIXI.Graphics();
    for (let i = 0; i < preCapture; i++)
      drawRect(meterFill, bar.move(0, -barSep*i), 0x888888, 1);
    
    // Add to scene
    bg.addChild(meter, meterFill);
    Game.hud.addChild(bg);

    // Animation schedule
    const timer = Timer.at(.15);
    
    let timeSep = .05;
    for (let i = preCapture; i < postCapture; i++) {
      timer
        .do(n => drawRect(meterFill, bar.move(0, -barSep*i), 0x888888, 1))
        .wait(timeSep);
    }

    timer
      .at('end')
      .wait(.5)
      .do(this.captureProperty, this)
      .do(n => bg.destroy({children: true}))
      .do(this.finish, this);
  }

  protected update(): void {
    
  }

  protected destroy(): void {
    
  }

}
