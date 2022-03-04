import { Game } from "../../../..";
import { Color } from "../../../color/Color";
import { getFactionPalette } from "../../../color/PlayerFactionPalette";
import { Rectangle } from "../../../Common/Rectangle";
import { Timer } from "../../../timer/Timer";
import { FactionColors } from "../../EnumTypes";
import { BattleSceneControllers } from "../../turn-machine/BattleSceneControllers";
import { fonts } from "../../ui-windows/DisplayInfo";
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
    const { actor, terrain } = this.options;

    // TODO [ ] Use terrain.illustration in big box
    // TODO [ ] Put terrain.name in box beneath illustration
    // TODO [ ] Captured property illustrations are tinted by faction
    // TODO [ ] Illustrations are tinted at end of meter fill when captured
    // TODO [ ] At end of meter fill, ?? / 20 is displayed, or 'Captured'
    // TODO [ ] Meter bg is color of controlling faciton
    // TODO [ ] Meter fill is color of capturing faction
    //   TODO [ ] I really think I need a BoardPlayer.palette field.
    //            Or at least a palette[BoardPlayer.faction] singleton.
    //   I suppose palette.factions[BoardPlayer.faction] is preferable
    //   since I also need palette.UI.windowBG and stuff like that.
    //   I can't keep fiddling with these feckign colors, dude.

    // Ratify immediate changes; record changes for animation
    const preCapture = actor.capture;
    actor.captureBuilding();
    const postCapture = actor.capture;

    // Setup UI element definitions
    const windowRect = new Rectangle(0,0,88,63);

    const barSep = 3;
    const bar = new Rectangle(
      windowRect.width-18,
      windowRect.height-barSep-1,
      16,
      barSep-1
    );

    const curPalette = getFactionPalette(terrain.faction).propertyCapture;
    const capPalette = getFactionPalette(actor.faction).propertyCapture;

    const curMeterHSV = Color.getHSV(curPalette.meter);
    const barColorEmpty = Color.HSV(curMeterHSV.h, curMeterHSV.s*2/3, curMeterHSV.v*2/3);
    const barColorFull = capPalette.meter;

    const drawRect = (g: PIXI.Graphics, r: Rectangle, c: number, a: number) => {
      g.beginFill(c,a);
      g.drawRect(r.x, r.y, r.width, r.height);
      g.endFill();
    }

    // Assemble UI elements
    const illustration = terrain.illustration;
    illustration.position.set(2);  
    illustration.tint = curPalette.tint;
    illustration.scale.x = (windowRect.width - 6 - bar.width) / illustration.width;
    illustration.scale.y = (windowRect.height - 4 - 16) / illustration.height;

    const tintOnCapture = () => {
      if (actor.buildingCaptured())
        illustration.tint = capPalette.tint;
    }

    const name = new PIXI.BitmapText(terrain.name, fonts.title);
    name.anchor.set(.4, 0);
    name.position.set(
      illustration.width/2 + 2,
      illustration.y + illustration.height + 2
    )

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
      drawRect(meter, bar.move(0, -barSep*i), barColorEmpty, 1);

    const meterFill = new PIXI.Graphics();
    for (let i = 0; i < preCapture; i++)
      drawRect(meterFill, bar.move(0, -barSep*i), barColorFull, 1);
    
    // Add to scene
    bg.addChild(illustration, name);
    bg.addChild(meter, meterFill);
    Game.hud.addChild(bg);

    // Animation schedule
    const timer = Timer.wait();
    
    let timeSep = .05;
    for (let i = preCapture; i < postCapture; i++) {
      timer
        .wait(timeSep)
        .do(n => drawRect(meterFill, bar.move(0, -barSep*i), barColorFull, 1))
    }

    timer
      .at('end')
      .do(tintOnCapture)
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
