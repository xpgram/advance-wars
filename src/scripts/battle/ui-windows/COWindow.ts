import * as PIXI from "pixi.js";
import { SlidingWindow } from "./SlidingWindow";
import { RectBuilder } from "./RectBuilder";
import { fonts } from "./DisplayInfo";
import { Common } from "../../CommonUtils";

export class COWindow extends SlidingWindow {

    // Objects
    private commanderImage = new PIXI.Sprite();
    private powerMeter1 = new PIXI.Sprite( this.sheet.textures['power-meter.png'] );
    private powerMeter1Fill = new PIXI.TilingSprite( this.sheet.textures['power-meter-full.png'], 0, 4 );
    private powerMeter2 = new PIXI.Sprite( this.sheet.textures['power-meter.png'] );
    private powerMeter2Fill = new PIXI.TilingSprite( this.sheet.textures['power-meter-full.png'], 0, 4 );
    private insignia = new PIXI.Sprite( this.sheet.textures['insignia-13th-battalion.png']);
    private cityIcon = new PIXI.Sprite( this.sheet.textures['icon-building-large.png']);
    private funds = new PIXI.Sprite( this.sheet.textures['icon-funds.png']);
    private fundsText = new PIXI.BitmapText('', fonts.scriptOutlined);
    private armyCountText = new PIXI.BitmapText('', fonts.scriptOutlined);
    private cityCountText = new PIXI.BitmapText('', fonts.scriptOutlined);

    constructor(options: SlidingWindowOptions, player: number) {
        super(options);
        console.assert((player >= 0 && player < 4), `CO Window: Given player number was not valid: ${player}`);

        let colors = [0x943142, 0x294a9c, 0x736321, 0x4a424a];  // Red, Blue, Yellow, Black tints
        let color = colors[player];
        let background = RectBuilder({
            width: 88,
            height: 31,
            color: color,
            alpha: 1,
            border: {
                color: 0x29424a,
                top: 1,
                bottom: 1,
                left: 2,
                right: 2
            }
        });

        // CO Image
        this.commanderImage.x = 41; this.commanderImage.y = 2;
        // TODO Pick the CO image

        // CO Power Meter, Leftmost
        this.powerMeter1.x = 42; this.powerMeter1.y = 16;
        this.powerMeter1.addChild(this.powerMeter1Fill);
        this.powerMeter1Fill.x = 21;
        // Rightmost
        this.powerMeter2.x = 64; this.powerMeter2.y = this.powerMeter1.y;
        this.powerMeter2.addChild(this.powerMeter2Fill);
        this.powerMeter2Fill.x = 21;

        // Insignia
        this.insignia.x = 4; this.insignia.y = 1;
        this.insignia.tint = 0xFFCCCC;
        // TODO Pick Insignia

        // City Icon
        this.cityIcon.x = 4; this.cityIcon.y = 16;
        this.cityIcon.tint = 0xFFCCCC;
        // TODO Pick or properly tint city icon

        // Funds
        this.funds.x = 22; this.funds.y = 21;
        this.funds.addChild(this.fundsText);
        this.fundsText.x = 62; this.fundsText.y = -3;
        (this.fundsText.anchor as PIXI.Point).x = 1;

        // Army Count
        this.armyCountText.x = 39; this.armyCountText.y = 0;
        (this.armyCountText.anchor as PIXI.Point).x = 1;

        // City Count
        this.cityCountText.x = 39; this.cityCountText.y = 9;
        (this.cityCountText.anchor as PIXI.Point).x = 1;

        // Formal add
        this.displayContainer.addChild(background);
        this.displayContainer.addChild(this.commanderImage, this.powerMeter1, this.powerMeter2);
        this.displayContainer.addChild(this.insignia, this.cityIcon);
        this.displayContainer.addChild(this.funds, this.armyCountText, this.cityCountText);
    }

    setPowerMeterValue(value: number) {
        let valueToWidth = (v: number) => {
            v *= 3;     // Convert to pixels
            v += 2;     // Accomodate borders
            v *= -1;    // Fill extends leftward
            return v;
        }

        let v1 = Common.confine(value, 0, 6);
        let v2 = Common.confine(value - 6, 0, 6);
        
        this.powerMeter2Fill.width = valueToWidth(v1);
        this.powerMeter1Fill.width = valueToWidth(v2);
    }

    setFundsValue(value: number) {
        this.fundsText.text = value.toString().slice(-7);   // Last 7 chars only
    }

    setArmyCountValue(value: number) {
        this.armyCountText.text = value.toString().slice(-2);
    }

    setCityCountValue(value: number) {
        this.cityCountText.text = value.toString().slice(-2);
    }
}