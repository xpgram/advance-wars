import * as PIXI from "pixi.js";
import { Game } from "../../..";
import { Common } from "../../CommonUtils";

/**
 * A container for graphical UI objects and accessors to change their display values.
 */
class DisplayInfo {
    static get sheet() { return Game.app.loader.resources['UISpritesheet'].spritesheet; }

    /** Standardized font accessor. This should probably be in Game.resources.font or something. */
    static readonly font = {
        title: {font: {name: 'font-label', size: 6}},
        scriptOutlined: {font: {name: 'font-map-ui', size: 14}},
        script: {font: {name: 'font-script', size: 10}},
        list: {font: {name: 'font-table-header', size: 6}},
        menu: {font: {name: 'font-menu', size: 14}},        // I don't know the correct size for this one
        tectac: {font: {name: 'TecTacRegular', size: 8}}
    }

    /** Contains all graphical UI objects. */
    displayObjects = {
        articleBody: new PIXI.BitmapText('', DisplayInfo.font.script),
        articleHeader: new PIXI.BitmapText('', DisplayInfo.font.title),
        articleIllustration: new PIXI.Container(),
        //articlePageButton: new PIXI.Sprite(DisplayInfo.sheet.textures['icon-x-button.png']),
        articleStats: {
            //repairType: new PIXI.Sprite( DisplayInfo.sheet.textures)
            income: new PIXI.BitmapText('', DisplayInfo.font.list),
            moveCost: {
                infantry: new PIXI.BitmapText('', DisplayInfo.font.list),
                mech: new PIXI.BitmapText('', DisplayInfo.font.list),
                tireA: new PIXI.BitmapText('', DisplayInfo.font.list),
                tireB: new PIXI.BitmapText('', DisplayInfo.font.list),
                tread: new PIXI.BitmapText('', DisplayInfo.font.list),
                air: new PIXI.BitmapText('', DisplayInfo.font.list),
                ship: new PIXI.BitmapText('', DisplayInfo.font.list),
                transport: new PIXI.BitmapText('', DisplayInfo.font.list),
            },
            moveCostLabel: {
                infantry: new PIXI.BitmapText('Inf', DisplayInfo.font.list),
                mech: new PIXI.BitmapText('Mech', DisplayInfo.font.list),
                tireA: new PIXI.BitmapText('TireA', DisplayInfo.font.list),
                tireB: new PIXI.BitmapText('TireB', DisplayInfo.font.list),
                tread: new PIXI.BitmapText('Tank', DisplayInfo.font.list),
                air: new PIXI.BitmapText('Air', DisplayInfo.font.list),
                ship: new PIXI.BitmapText('Ship', DisplayInfo.font.list),
                transport: new PIXI.BitmapText('Trpt', DisplayInfo.font.list),
            }
        },
        buildingIcon: new PIXI.Texture(DisplayInfo.sheet.textures['icon-capture.png']),
        captureMeter: new PIXI.Sprite(DisplayInfo.sheet.textures['icon-capture.png']),
        captureMeterText: new PIXI.BitmapText('', DisplayInfo.font.scriptOutlined),
        heartIcon: new PIXI.Texture(DisplayInfo.sheet.textures['icon-heart.png']),
        terrainDefenseStars: new PIXI.TilingSprite(DisplayInfo.sheet.textures['icon-star-empty.png'], 8*4, 8),
        terrainDefenseStarsFill: new PIXI.TilingSprite(DisplayInfo.sheet['icon-star-full.png'], 0, 8),
        terrainHPMeter: new PIXI.Sprite(DisplayInfo.sheet.textures['icon-heart.png']),
        terrainHPMeterText: new PIXI.BitmapText('', DisplayInfo.font.scriptOutlined),
        terrainName: new PIXI.BitmapText('', DisplayInfo.font.scriptOutlined),
        terrainThumbnail: new PIXI.Container(),
    }

    // Post-initialization setup of some elements
    constructor() {
        // Capture Meter
        this.displayObjects.captureMeter.addChild(this.displayObjects.captureMeterText);
        (this.displayObjects.captureMeterText.anchor as PIXI.Point).x = 1;
        this.displayObjects.captureMeterText.x = 25;
        // Defense Rating Meter
        this.displayObjects.terrainDefenseStars.addChild(this.displayObjects.terrainDefenseStarsFill);
        // Terrain HP Meter
        this.displayObjects.terrainHPMeter.addChild(this.displayObjects.terrainHPMeterText);
        (this.displayObjects.terrainHPMeterText.anchor as PIXI.Point).x = 1;
        this.displayObjects.terrainHPMeterText.x = 25;
    }

    /** The body text of the detail window article. */
    get articleBody() { return this.displayObjects.articleBody.text; }
    set articleBody(msg: string) { this.displayObjects.articleBody.text = msg; }

    /** The header text of the detail window article. */
    get articleHeader() { return this.displayObjects.articleHeader.text; }
    set articleHeader(name: string) { this.displayObjects.articleHeader.text = name; }

    /** The picture display used in the detail window article. */
    get articleIllustration(): PIXI.Container | null { return this.displayObjects.articleIllustration.getChildAt(0) as PIXI.Container; }
    set articleIllustration(img: PIXI.Container | null) {
        this.displayObjects.articleIllustration.removeChildren();
        if (img)
            this.displayObjects.articleIllustration.addChild(img);
    }

    /** The stat-info labels and numbers used in the detail window article. */
    articleStats = ((context: DisplayInfo) => { return {
        get income() { return context.displayObjects.articleStats.income.text; },
        set income(t: string) { context.displayObjects.articleStats.income.text = t; },

        moveCosts: ((context: DisplayInfo) => { return {
            get infantry() { return context.displayObjects.articleStats.moveCost.infantry.text; },
            set infantry(t: string) { context.displayObjects.articleStats.moveCost.infantry.text = t; },

            get mech() { return context.displayObjects.articleStats.moveCost.mech.text; },
            set mech(t: string) { context.displayObjects.articleStats.moveCost.mech.text = t; },

            get tireA() { return context.displayObjects.articleStats.moveCost.tireA.text; },
            set tireA(t: string) { context.displayObjects.articleStats.moveCost.tireA.text = t; },

            get tireB() { return context.displayObjects.articleStats.moveCost.tireB.text; },
            set tireB(t: string) { context.displayObjects.articleStats.moveCost.tireB.text = t; },

            get tread() { return context.displayObjects.articleStats.moveCost.tread.text; },
            set tread(t: string) { context.displayObjects.articleStats.moveCost.tread.text = t; },

            get air() { return context.displayObjects.articleStats.moveCost.air.text; },
            set air(t: string) { context.displayObjects.articleStats.moveCost.air.text = t; },

            get ship() { return context.displayObjects.articleStats.moveCost.ship.text; },
            set ship(t: string) { context.displayObjects.articleStats.moveCost.ship.text = t; },

            get transport() { return context.displayObjects.articleStats.moveCost.transport.text; },
            set transport(t: string) { context.displayObjects.articleStats.moveCost.transport.text = t; }
        }})(context),
    }})(this);

    get captureMeterValue() { return this.displayObjects.captureMeterText.text; }
    set captureMeterValue(text: string) { this.displayObjects.captureMeterText.text = text; }

    get captureMeterHidden() { return this.displayObjects.captureMeter.visible; }
    set captureMeterHidden(b: boolean) { this.displayObjects.captureMeter.visible = b; }

    get captureToHP() { return (this.displayObjects.captureMeter.texture === this.displayObjects.heartIcon); }
    set captureToHP(b: boolean) {
        if (b)
            this.displayObjects.captureMeter.texture = this.displayObjects.heartIcon;
        else
            this.displayObjects.captureMeter.texture = this.displayObjects.buildingIcon;
    }

    get terrainDefenseStarsValue() { return this.displayObjects.terrainDefenseStarsFill.width / 8; }
    set terrainDefenseStarsValue(value: number) {
        let def = Math.floor(Common.confine(value, 0, 4));
        this.displayObjects.terrainDefenseStarsFill.width = 8 * def;
    }

    get terrainName() { return this.displayObjects.terrainName.text; }
    set terrainName(name: string) { this.displayObjects.terrainName.text = name; }

    get terrainThumbnail(): PIXI.Container | null { return this.displayObjects.terrainThumbnail.getChildAt(0) as PIXI.Container; }
    set terrainThumbnail(img: PIXI.Container | null) {
        this.displayObjects.terrainThumbnail.removeChildren();
        if (img)
            this.displayObjects.terrainThumbnail.addChild(img);
    }
}

export const InfoUI = new DisplayInfo();

// This is calling DisplayInfo() too soon: at startup.
// I'm not sure what to do about this yet.