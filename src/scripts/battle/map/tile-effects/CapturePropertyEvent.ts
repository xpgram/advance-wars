import { PIXI } from "../../../../constants";
import { Game } from "../../../..";
import { Palette } from "../../../color/ColorPalette";
import { getFactionPalette } from "../../../color/PlayerFactionPalette";
import { PixiGraphics } from "../../../Common/PixiGraphics";
import { Rectangle } from "../../../Common/Rectangle";
import { Timer } from "../../../timer/Timer";
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

  protected options: CapturePropertyEventOptions;
  protected illustration: PIXI.Sprite;
  protected terrainName: string;


  constructor(options: CapturePropertyEventOptions) {
    super(options.actor.boardLocation);
    this.options = options;
    this.illustration = options.terrain.illustration;
    this.terrainName = options.terrain.name;
  }

  protected captureProperty(): void {
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
    const { drawRect } = PixiGraphics;
    const { actor, terrain } = this.options;
    const { illustration } = this;

    const curPalette = getFactionPalette(terrain.faction).propertyCapture;
    const capPalette = getFactionPalette(actor.faction).propertyCapture;

    const barColorEmpty = curPalette.meter;
    const barColorFull = capPalette.meter;
    const windowBgColor = Palette.gale_force1;

    // Ratify immediate changes; record changes for animation
    const preCapture = actor.capture;
    actor.captureBuilding();
    const postCapture = actor.capture;

    // TODO [x] Use terrain.illustration in big box
    // TODO [x] Put terrain.name in box beneath illustration
    // TODO [x] Captured property illustrations are tinted by faction
    // TODO [x] Illustrations are tinted at end of meter fill when captured
    // TODO [ ] At end of meter fill, ?? / 20 is displayed, or 'Captured'
    // TODO [x] Meter bg is color of controlling faciton
    // TODO [x] Meter fill is color of capturing faction
    //   TODO [x] I really think I need a BoardPlayer.palette field.
    //            Or at least a palette[BoardPlayer.faction] singleton.
    //   I suppose palette.factions[BoardPlayer.faction] is preferable
    //   since I also need palette.UI.windowBG and stuff like that.
    //   I can't keep fiddling with these feckign colors, dude.

    // Setup UI element definitions
    const windowRect = new Rectangle(0,0,88,61);

    const barSep = 3;
    const bar = new Rectangle(
      windowRect.width-17,
      windowRect.height-barSep,
      16,
      barSep-1
    );

    // Assemble UI elements

    illustration.position.set(1);  
    illustration.tint = curPalette.tint;
    illustration.scale.x = (windowRect.width - 3 - bar.width) / illustration.width;
    illustration.scale.y = (windowRect.height - 2 - 16) / illustration.height;

    // TODO This needs to start showing a little bit before the meter reaches its final
    // value. It also needs to fade-in and shrink, just like speech bubbles.
    const meterText = new PIXI.BitmapText(`${postCapture} / 20`, fonts.scriptOutlined);
    meterText.anchor.set(.4,.6);
    meterText.position.set(illustration.width/2, illustration.height/2);
    meterText.alpha = 0;

    const captureText = new PIXI.BitmapText(`Captured!`, fonts.title);
    captureText.anchor.set(.4,.6);
    captureText.position.set(illustration.width/2, illustration.height/2);
    captureText.alpha = 0;

    illustration.addChild(meterText, captureText);

    const tintOnCapture = () => {
      if (actor.buildingCaptured()) {
        illustration.tint = capPalette.tint;
        captureText.alpha = 1;
      } else {
        meterText.alpha = 1;
      }
    }

    const name = new PIXI.BitmapText(this.terrainName, fonts.title);
    name.anchor.set(.4, 0);
    name.position.set(
      illustration.width/2 + 2,
      illustration.y + illustration.height + 1,
    )

    const bg = new PIXI.Graphics();
    drawRect(bg, windowRect, windowBgColor);
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
      drawRect(meter, bar.move(0, -barSep*i), barColorEmpty);

    const meterFill = new PIXI.Graphics();
    for (let i = 0; i < preCapture; i++)
      drawRect(meterFill, bar.move(0, -barSep*i), barColorFull);
    
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
        .do(n => drawRect(meterFill, bar.move(0, -barSep*i), barColorFull));
    }

    timer
      .at('end')
      .do(tintOnCapture)
      .do(this.captureProperty, this)
      .wait(.65)
      .do(n => bg.destroy({children: true}))
      .do(this.finish, this);
  }

  protected update(): void {
    
  }

  protected destroy(): void {
    
  }

}
