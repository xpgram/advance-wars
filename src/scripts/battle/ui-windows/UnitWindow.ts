import * as PIXI from "pixi.js";
import { fonts } from "./DisplayInfo";
import { SlidingWindow } from "./SlidingWindow";
import { RectBuilder } from "./RectBuilder";
import { UnitObject } from "../UnitObject";
import { DamageForecastPane } from "./DamageForecastPane";

export class UnitWindow extends SlidingWindow {

  /** Whether this window has a unit to describe. */
  private unitToDisplay = false;

  // Textures
  private ammoIcon = this.sheet.textures['icon-ammo.png'];
  private materialsIcon = this.sheet.textures['icon-material.png'];

  // Objects
  private thumbnail = new PIXI.Container();
  private name = new PIXI.BitmapText('', fonts.scriptOutlined);
  private hpMeter = new PIXI.Sprite(this.sheet.textures['icon-heart.png']);
  private hpMeterText = new PIXI.BitmapText('', fonts.scriptOutlined);
  private gasMeter = new PIXI.Sprite(this.sheet.textures['icon-gas.png']);
  private gasMeterText = new PIXI.BitmapText('', fonts.scriptOutlined);
  private ammoMeter = new PIXI.Sprite(this.sheet.textures['icon-ammo.png']);
  private ammoMeterText = new PIXI.BitmapText('', fonts.scriptOutlined);
  private firstLoad = new PIXI.Graphics();
  private secondLoad = new PIXI.Graphics();
  private damageForecast: DamageForecastPane;

  constructor(options: SlidingWindowOptions) {
    super(options);

    let background = RectBuilder({
      width: 88,
      height: 24,
      color: 0x000000,
      alpha: 0.5
    });

    // Unit Thumbnail
    this.thumbnail.x = this.thumbnail.y = 4;

    // Unit Name
    this.name.x = 24; this.name.y = 3;

    // Unit HP, Gas and Ammo Icons
    this.hpMeter.x = 24; this.hpMeter.y = 16;
    this.gasMeter.x = 48; this.gasMeter.y = 16;
    this.ammoMeter.x = 71; this.ammoMeter.y = 16;

    // Unit HP, Gas and Ammo numbers
    this.hpMeter.addChild(this.hpMeterText);
    this.gasMeter.addChild(this.gasMeterText);
    this.ammoMeter.addChild(this.ammoMeterText);

    this.hpMeterText.x = 22; this.hpMeterText.y = -3;
    this.gasMeterText.x = 22; this.gasMeterText.y = -3;
    this.ammoMeterText.x = 15; this.ammoMeterText.y = -3;

    (this.hpMeterText.anchor as PIXI.Point).x = 1;
    (this.gasMeterText.anchor as PIXI.Point).x = 1;
    (this.ammoMeterText.anchor as PIXI.Point).x = 1;

    // Unit first-loaded unit window
    this.firstLoad = RectBuilder({
      offset: { x: -1, y: -1 },
      width: 18,
      height: 17,
      color: 0x000000,
      alpha: 0.5
    });
    this.firstLoad.x = 2; this.firstLoad.y = -17;

    // Unit second-loaded unit window
    this.secondLoad = RectBuilder({
      offset: { x: -1, y: -1 },
      width: 18,
      height: 17,
      color: 0x000000,
      alpha: 0.5
    });
    this.secondLoad.x = 20; this.secondLoad.y = -17;

    // Damage Forecast
    this.damageForecast = new DamageForecastPane();
    this.damageForecast.container.position.set(0,-24);

    // Formal add
    this.displayContainer.addChild(background);
    this.displayContainer.addChild(this.thumbnail, this.name);
    this.displayContainer.addChild(this.hpMeter, this.gasMeter, this.ammoMeter);
    this.displayContainer.addChild(this.firstLoad, this.secondLoad);
    this.displayContainer.addChild(this.damageForecast.container);
  }

  destroy() {
    super.destroy();
    this.damageForecast.destroy();
  }

  /** Sets this UI window to visible only if a unit is present to describe. */
  setVisible() {
    this.opacitySlider.incrementFactor = (this.unitToDisplay) ? 1 : -1;
  }

  positionWindow(options = { skip: false }) {
    super.positionWindow(options);

    // Move the loaded units mini-window to the other side when displayed on the right edge of the screen.
    if (this.firstLoad) {   // ← This is a dumb bandaid solution. SlidingWindow probably shouldn't call positionWindow in its constructor. The window system can handle that.
      this.firstLoad.x = (this.onLeftSide) ? 2 : 70;
      this.secondLoad.x = (this.onLeftSide) ? 21 : 51;
    }

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

  private setHPMeterValue(value: number) {
    this.hpMeterText.text = value.toString();
  }

  private setGasMeterValue(value: number) {
    this.gasMeterText.text = value.toString();
  }

  private setAmmoMeterValue(value: number, max: number) {
    if (max == 0)
      this.ammoMeterText.text = '_';
    else
      this.ammoMeterText.text = value.toString().slice(0, 2);
    this.ammoMeter.texture = this.ammoIcon;
  }

  private setMaterialMeterValue(value: number) {
    this.ammoMeterText.text = value.toString().slice(0, 2);
    this.ammoMeter.texture = this.materialsIcon;
  }

  private setFirstLoadUnit(img: PIXI.Sprite | null) {
    this.firstLoad.removeChildren();
    this.firstLoad.visible = Boolean(img);
    if (img)
      this.firstLoad.addChild(img);
  }

  private setSecondLoadUnit(img: PIXI.Sprite | null) {
    this.secondLoad.removeChildren();
    this.secondLoad.visible = Boolean(img);
    if (img)
      this.secondLoad.addChild(img);
  }

  setDamageForecast(dmgOut?: number, dmgIn?: number) {
    if (dmgOut === undefined || dmgIn === undefined) {
      this.damageForecast.hide();
      return;
    }

    dmgOut = Math.round(dmgOut);
    dmgIn = Math.round(dmgIn);

    this.damageForecast.damage = dmgOut;
    this.damageForecast.mode =
      (dmgIn < 10)
      ? 'safe'
      : (dmgIn < 20)
      ? 'normal'
      : (dmgIn < 50)
      ? 'caution'
      : 'danger';
    this.damageForecast.show();
  }

  /** Updates window UI elements with details from the given unit object. */
  inspectUnit(unit?: UnitObject) {
    this.unitToDisplay = Boolean(unit);

    if (!unit)
      return;

    this.setThumbnail(unit.preview);
    this.setName(unit.name);
    this.setHPMeterValue(unit.displayHP);
    this.setGasMeterValue(unit.gas);
    (unit.materialsInsteadOfAmmo)
      ? this.setMaterialMeterValue(unit.ammo)
      : this.setAmmoMeterValue(unit.ammo, unit.maxAmmo);

    this.setFirstLoadUnit( (unit.loadedUnits.length > 0)
      ? unit.loadedUnits[0].cargoPreview
      : null);
    this.setSecondLoadUnit( (unit.loadedUnits.length > 1)
      ? unit.loadedUnits[1].cargoPreview
      : null);
  }
}