import * as PIXI from "pixi.js";
import { fonts } from "./DisplayInfo";
import { SlidingWindow } from "./SlidingWindow";
import { Common } from "../../CommonUtils";
import { RectBuilder } from "./RectBuilder";

export class TerrainWindow extends SlidingWindow {
    // Constants
    private readonly starSize = 8;

    // Textures
    private buildingIcon = this.sheet.textures['icon-capture.png'];
    private heartIcon = this.sheet.textures['icon-heart.png'];

    // Objects
    private thumbnail = new PIXI.Container();
    private name = new PIXI.BitmapText('', fonts.scriptOutlined);
    private defenseStars = new PIXI.TilingSprite( this.sheet.textures['icon-star-empty.png'], this.starSize*4, this.starSize );
    private defenseStarsFill = new PIXI.TilingSprite( this.sheet.textures['icon-star-full.png'], 0, this.starSize );
    private numberMeter = new PIXI.Sprite(this.buildingIcon);
    private numberMeterText = new PIXI.BitmapText('', fonts.scriptOutlined);

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
        this.defenseStars.addChild( this.defenseStarsFill );

        // Capture/MeteorHP Meter
        this.numberMeter.x = 60; this.numberMeter.y = 16;
        this.numberMeter.addChild( this.numberMeterText );
        this.numberMeterText.x = 25; this.numberMeterText.y = -3;   // y must be adjusted because the font's origin is 0,0; every letter is like 14px high or something.
        (this.numberMeterText.anchor as PIXI.Point).x = 1;  // Right aligned

        // Formal add
        this.displayContainer.addChild(background);
        this.displayContainer.addChild(this.thumbnail, this.name);
        this.displayContainer.addChild(this.defenseStars, this.numberMeter);
    }

    setThumbnail(container: PIXI.Container) {
        this.thumbnail.removeChildren();
        this.thumbnail.addChild(container);
    }

    setName(name: string) {
        this.name.text = name;
    }

    setDefenseMeter(value: number) {
        let stars = Common.confine(value, 0, 4);
        this.defenseStarsFill.width = this.starSize * stars;
    }

    setCaptureMeter(value: string) {
        this.numberMeterText.text = value.slice(0,2);
        this.numberMeter.texture = this.buildingIcon;
        this.numberMeter.visible = true;
    }

    setHPMeter(value: string) {
        this.numberMeterText.text = value.slice(0,2);
        this.numberMeter.texture = this.heartIcon;
        this.numberMeter.visible = true;
    }

    hideCaptureMeter() {
        this.numberMeter.visible = false;
    }
}