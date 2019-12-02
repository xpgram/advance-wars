import * as PIXI from "pixi.js";
import { fonts } from "./DisplayInfo";
import { SlidingWindow } from "./SlidingWindow";
import { RectBuilder } from "./RectBuilder";

export class UnitWindow extends SlidingWindow {

    // Textures
    private ammoIcon = this.sheet.textures['icon-ammo.png'];
    private materialsIcon = this.sheet.textures['icon-material.png'];

    // Objects
    private thumbnail = new PIXI.Container();
    private name = new PIXI.BitmapText('', fonts.scriptOutlined);
    private hpMeter = new PIXI.Sprite( this.sheet.textures['icon-heart.png'] );
    private hpMeterText = new PIXI.BitmapText('', fonts.scriptOutlined);
    private gasMeter = new PIXI.Sprite( this.sheet.textures['icon-gas.png'] );
    private gasMeterText = new PIXI.BitmapText('', fonts.scriptOutlined);
    private ammoMeter = new PIXI.Sprite( this.sheet.textures['icon-ammo.png'] );
    private ammoMeterText = new PIXI.BitmapText('', fonts.scriptOutlined);
    private firstLoad = new PIXI.Graphics();
    private secondLoad = new PIXI.Graphics();

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

        this.hpMeterText.x = 22;   this.hpMeterText.y = -3;
        this.gasMeterText.x = 22;  this.gasMeterText.y = -3;
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
        this.firstLoad.x = 1; this.firstLoad.y = -16;

        // Unit second-loaded unit window
        this.secondLoad = RectBuilder({
            offset: { x: -1, y: -1 },
            width: 18,
            height: 17,
            color: 0x000000,
            alpha: 0.5
        });
        this.secondLoad.x = 19; this.secondLoad.y = -16;

        // Formal add
        this.displayContainer.addChild(background);
        this.displayContainer.addChild(this.thumbnail, this.name);
        this.displayContainer.addChild(this.hpMeter, this.gasMeter, this.ammoMeter);
        this.displayContainer.addChild(this.firstLoad, this.secondLoad);
    }

    positionWindow(options = {skip: false}) {
        super.positionWindow(options);

        // Move the loaded units mini-window to the other side when displayed on the right edge of the screen.
        if (this.firstLoad) {   // ← This is a dumb bandaid solution. SlidingWindow probably shouldn't call positionWindow in its constructor. The window system can handle that.
            this.firstLoad.x = (this.onLeftSide) ? 0 : 71;
            this.secondLoad.x = (this.onLeftSide) ? 18 : 53;
        }
    }

    setThumbnail(container: PIXI.Container) {
        this.thumbnail.removeChildren();
        this.thumbnail.addChild(container);
    }

    setName(name: string) {
        this.name.text = name;
    }

    setHPMeterValue(value: number) {
        this.hpMeterText.text = value.toString();
    }

    setGasMeterValue(value: number) {
        this.gasMeterText.text = value.toString();
    }

    setAmmoMeterValue(value: number, max: number) {
        if (max == 0)
            this.ammoMeterText.text = '_';
        else
            this.ammoMeterText.text = value.toString().slice(0,2);
        this.ammoMeter.texture = this.ammoIcon;
    }

    setMaterialMeterValue(value: number) {
        this.ammoMeterText.text = value.toString().slice(0,2);
        this.ammoMeter.texture = this.materialsIcon;
    }

    setFirstLoadUnit(img: PIXI.Sprite | null) {
        this.firstLoad.removeChildren();
        this.firstLoad.visible = Boolean(img);
        if (img)
            this.firstLoad.addChild(img);
    }

    setSecondLoadUnit(img: PIXI.Sprite | null) {
        this.secondLoad.removeChildren();
        this.secondLoad.visible = Boolean(img);
        if (img)
            this.secondLoad.addChild(img);
    }
}