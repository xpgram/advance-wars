import * as PIXI from "pixi.js";
import { fonts } from "./DisplayInfo";
import { SlidingWindow } from "./SlidingWindow";
import { Common } from "../../CommonUtils";
import { RectBuilder } from "./RectBuilder";

export class TerrainWindow extends SlidingWindow {
    // Constants
    private readonly starSize = 8;

    // Objects
    private thumbnail = new PIXI.Container();
    private name = new PIXI.BitmapText('', fonts.scriptOutlined);
    private defenseStars = new PIXI.TilingSprite( this.sheet.textures['icon-star-empty.png'], this.starSize*4, this.starSize );
    private defenseStarsFill = new PIXI.TilingSprite( this.sheet.textures['icon-star-full.png'], 0, this.starSize );
    private buildingIcon = new PIXI.Sprite( this.sheet.textures['icon-capture.png'] );
    private heartIcon = new PIXI.Sprite( this.sheet.textures['icon-heart.png'] );
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
        this.buildingIcon.x = 60; this.buildingIcon.y = 16;
        this.numberMeterText.x = 85; this.numberMeterText.y = 13;
        (this.numberMeterText.anchor as PIXI.Point).x = 1;  // Right aligned

        // Heart Meter alt.
        this.heartIcon.x = this.buildingIcon.x;
        this.heartIcon.y = this.buildingIcon.y;
        this.heartIcon.visible = false;

        // Formal add
        this.displayContainer.addChild(background);
        this.displayContainer.addChild(this.thumbnail, this.name);
        this.displayContainer.addChild(this.defenseStars, this.buildingIcon, this.heartIcon, this.numberMeterText);
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

    setCaptureMeter(value: number) {
        value = Common.confine(value, 0, 20);   // Keep displayable
        this.numberMeterText.text = value.toString();
        this.buildingIcon.visible = true;
        this.heartIcon.visible = false;
        this.numberMeterText.visible = true;
    }

    setHPMeter(value: number) {
        value = Common.confine(value, 0, 99);   // Keep displayable
        this.numberMeterText.text = value.toString();
        this.heartIcon.visible = true;
        this.buildingIcon.visible = false;
        this.numberMeterText.visible = true;
    }

    hideCaptureMeter() {
        this.heartIcon.visible = false;
        this.buildingIcon.visible = false;
        this.numberMeterText.visible = false;
    }
}