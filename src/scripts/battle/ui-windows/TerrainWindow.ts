import * as PIXI from "pixi.js";
import { fonts } from "./DisplayInfo";
import { SlidingWindow } from "./SlidingWindow";
import { Common } from "../../CommonUtils";
import { RectBuilder } from "./RectBuilder";
import { TerrainObject } from "../map/TerrainObject";
import { Terrain } from "../map/Terrain";
import { UnitObject } from "../UnitObject";
import { UnitObjectConstants } from "../UnitObjectConstants";
import { DamageForecastPane } from "./DamageForecastPane";

export class TerrainWindow extends SlidingWindow {
  // Constants
  private readonly starSize = 8;

  // Objects
  private thumbnail = new PIXI.Container();
  private name = new PIXI.BitmapText('', fonts.scriptOutlined);
  private defenseStars = new PIXI.TilingSprite(this.sheet.textures['icon-star-empty.png'], this.starSize * 4, this.starSize);
  private defenseStarsFill = new PIXI.TilingSprite(this.sheet.textures['icon-star-full.png'], 0, this.starSize);
  private buildingIcon = new PIXI.Sprite(this.sheet.textures['icon-capture.png']);
  private heartIcon = new PIXI.Sprite(this.sheet.textures['icon-heart.png']);
  private numberMeterText = new PIXI.BitmapText('', fonts.scriptOutlined);
  private damageForecast: DamageForecastPane;


  constructor(options: SlidingWindowOptions) {
    super(options);

    let background = RectBuilder({
      width: 88,
      height: 24,
      color: 0x000000,
      alpha: 0.5
    });

    // Terrain Thumbnail
    this.thumbnail.x = this.thumbnail.y = 4;

    // Terrain Name
    this.name.x = 24; this.name.y = 3;

    // Defense Boost Meter
    this.defenseStars.x = 24; this.defenseStars.y = 16;
    this.defenseStars.addChild(this.defenseStarsFill);

    // Capture/MeteorHP Meter
    this.buildingIcon.x = 60; this.buildingIcon.y = 16;
    this.numberMeterText.x = 85; this.numberMeterText.y = 13;
    (this.numberMeterText.anchor as PIXI.Point).x = 1;  // Right aligned

    // Heart Meter alt.
    this.heartIcon.x = this.buildingIcon.x;
    this.heartIcon.y = this.buildingIcon.y;
    this.heartIcon.visible = false;

    // Damage Forecast
    this.damageForecast = new DamageForecastPane();
    this.damageForecast.container.position.set(0,-24);

    // Formal add
    this.displayContainer.addChild(background);
    this.displayContainer.addChild(this.thumbnail, this.name);
    this.displayContainer.addChild(this.defenseStars, this.buildingIcon, this.heartIcon, this.numberMeterText);
    this.displayContainer.addChild(this.damageForecast.container);
  }

  destroy() {
    super.destroy();
    this.damageForecast.destroy();
  }

  positionWindow(options = { skip: false }) {
    super.positionWindow(options);

    // Reposition damage forecast preview
    if (this.damageForecast) {
      this.damageForecast.container.x = (this.onLeftSide)
        ? this.displayContainer.width - this.damageForecast.container.width - 2
        : 2;
    }
  }

  private setThumbnail(container: PIXI.Container) {
    this.thumbnail.removeChildren();
    this.thumbnail.addChild(container);
  }

  private setName(name: string) {
    this.name.text = name;
  }

  private setDefenseMeter(value: number) {
    let stars = Common.confine(value, 0, 4);
    this.defenseStarsFill.width = this.starSize * stars;
  }

  private setCaptureMeter(value: number) {
    value = Common.confine(value, 0, 20);   // Keep displayable
    this.numberMeterText.text = value.toString();
    this.buildingIcon.visible = true;
    this.heartIcon.visible = false;
    this.numberMeterText.visible = true;
  }

  private setHPMeter(value: number) {
    value = Common.confine(value, 0, 99);   // Keep displayable
    this.numberMeterText.text = value.toString();
    this.heartIcon.visible = true;
    this.buildingIcon.visible = false;
    this.numberMeterText.visible = true;
  }

  private hideCaptureMeter() {
    this.heartIcon.visible = false;
    this.buildingIcon.visible = false;
    this.numberMeterText.visible = false;
  }

  setDamageForecast(dmgOut?: number) {
    if (dmgOut === undefined) {
      this.damageForecast.hide();
      return;
    }

    this.damageForecast.damage = Math.round(dmgOut);
    this.damageForecast.mode = 'safe';
    this.retriggerDamageForecastVisibility();
  }

  private _showDamageForecast = false;
  private retriggerDamageForecastVisibility() {
    if (this._showDamageForecast)
      this.damageForecast.show();
    else
      this.damageForecast.hide();
  }

  /** Updates window UI elements with given terrain object details. */
  inspectTerrain(terrain: TerrainObject, unit?: UnitObject, attackFlagged = false) {
    this.setName(terrain.name);
    this.setThumbnail(terrain.preview);
    this.setDefenseMeter(terrain.defenseRating);
    if (terrain.building) {
      this.setCaptureMeter(UnitObjectConstants.MaxCapture - (unit?.capture ?? 0));
    } else if (terrain.damageable)
      this.setHPMeter(terrain.value);
    else
      this.hideCaptureMeter();

    // TODO attackFlagged: the message passing here between this and IWS is bizarre.
    // I need that IWS refactor. This object should probably have a reference to the
    // forecast, its own copy or a pointer, that it can decide to show on its own
    // only if it isn't undefined.

    this._showDamageForecast = attackFlagged && !Boolean(unit) && terrain.damageable;
    this.retriggerDamageForecastVisibility();
  }
}
