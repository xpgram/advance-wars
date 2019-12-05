import * as PIXI from "pixi.js";
import { fonts } from "./DisplayInfo";
import { SlidingWindow } from "./SlidingWindow";
import { RectBuilder } from "./RectBuilder";

export class TerrainDetailWindow extends SlidingWindow {

    // Objects
    private header = new PIXI.BitmapText('', fonts.title);
    private illustration = new PIXI.Container();
    private description = new PIXI.BitmapText('', fonts.script);

    private income = new PIXI.Sprite( this.sheet.textures['icon-funds.png'] );
    private incomeText = new PIXI.BitmapText('', fonts.list);

    private repairType = new PIXI.BitmapText('Rep', fonts.list);
    private repairTypeG = new PIXI.BitmapText('G', fonts.list);
    private repairTypeN = new PIXI.BitmapText('N', fonts.list);
    private repairTypeA = new PIXI.BitmapText('A', fonts.list);

    private moveCostTable = {
        infantry: {
            label: new PIXI.BitmapText('Inf', fonts.list),
            value: new PIXI.BitmapText('', fonts.list)
        },
        mech: {
            label: new PIXI.BitmapText('Mech', fonts.list),
            value: new PIXI.BitmapText('', fonts.list)
        },
        tireA: {
            label: new PIXI.BitmapText('TireA', fonts.list),
            value: new PIXI.BitmapText('', fonts.list)
        },
        tireB: {
            label: new PIXI.BitmapText('TireB', fonts.list),
            value: new PIXI.BitmapText('', fonts.list)
        },
        tread: {
            label: new PIXI.BitmapText('Tank', fonts.list),
            value: new PIXI.BitmapText('', fonts.list)
        },
        air: {
            label: new PIXI.BitmapText('Air', fonts.list),
            value: new PIXI.BitmapText('', fonts.list)
        },
        ship: {
            label: new PIXI.BitmapText('Ship', fonts.list),
            value: new PIXI.BitmapText('', fonts.list)
        },
        transport: {
            label: new PIXI.BitmapText('Trpt', fonts.list),
            value: new PIXI.BitmapText('', fonts.list)
        }
    };

    constructor(options: SlidingWindowOptions) {
        super(options);

        let background = RectBuilder({
            width: 88,
            height: 165,
            color: 0x000000,
            alpha: 0.5
        });

        //@ts-ignore
        this.mask = RectBuilder({
            width: 88,
            height: 165,
            color: 0xFFFFFF,
            alpha: 1
        });
        this.mask.x = (this.showOnLeftSide) ? options.width : -options.width;

        // Header
        this.header.x = 5; this.header.y = 4;

        // Illustration
        this.illustration.x = 8; this.illustration.y = 18;

        // Body Text
        this.description.x = 8; this.description.y = 62;
        this.description.maxWidth = this.width - 16;

        // Income
        this.income.x = 8; this.income.y = 119;
        this.income.addChild(this.incomeText);
        this.incomeText.x = 34; this.incomeText.y = 1;
        (this.incomeText.anchor as PIXI.Point).x = 1;

        // Repair Type
        this.repairType.x = 46; this.repairType.y = 120;
        this.repairType.addChild(this.repairTypeG);
        this.repairType.addChild(this.repairTypeN);
        this.repairType.addChild(this.repairTypeA);
        this.repairTypeG.x = 18;
        this.repairTypeN.x = 24;
        this.repairTypeA.x = 30;

        // Formal add
        this.displayContainer.addChild(background, this.mask);
        this.displayContainer.addChild(this.illustration);
        this.displayContainer.addChild(this.header);
        this.displayContainer.addChild(this.description);
        this.displayContainer.addChild(this.income);
        this.displayContainer.addChild(this.repairType);

        // Set up move cost table — Order is important to column organization (0–3: side A, 4–7: side B)
        let moveCosts = [
            this.moveCostTable.infantry,
            this.moveCostTable.tireA,
            this.moveCostTable.tireB,
            this.moveCostTable.ship,
            this.moveCostTable.mech,
            this.moveCostTable.tread,
            this.moveCostTable.air,
            this.moveCostTable.transport
        ];
        let tablePos = {x: 8, y: 130};
        let columnShift = 38;       // Column distance
        let lineHeight = 8;
        let keyValueShift = 34;     // Value-from-key distance
        for (let i = 0; i < moveCosts.length; i++) {
            let colShift = (i < moveCosts.length / 2) ? 0 : columnShift;    // Sets up two columns
            let rowShift = (i % 4) * lineHeight; 

            moveCosts[i].label.x = tablePos.x + colShift;
            moveCosts[i].label.y = tablePos.y + rowShift;
            moveCosts[i].value.x = moveCosts[i].label.x + keyValueShift;
            moveCosts[i].value.y = moveCosts[i].label.y;
            (moveCosts[i].value.anchor as PIXI.Point).x = 1;

            this.displayContainer.addChild(moveCosts[i].label);
            this.displayContainer.addChild(moveCosts[i].value);
        }
    }

    setHeaderText(text: string) {
        this.header.text = text;
    }

    setIllustration(img: PIXI.Container) {
        this.illustration.removeChildren();
        this.illustration.addChild(img);
    }

    setDescriptionText(text: string) {
        text = text.replace(/\//g, ''); // '/' were going to denote colored text, but I haven't figured out how to work that yet.
        this.description.text = text;
    }

    setIncomeValue(value: number) {
        let text = value.toString().slice(0,4);
        if (text === '0') text = '-';
        this.incomeText.text = text;
    }

    setRepType(ground: boolean, naval: boolean, air: boolean) {
        let bright = 0xDDDDDD, dimmed = 0x888888;
        this.repairTypeG.tint = (ground) ? bright : dimmed;
        this.repairTypeN.tint = (naval) ? bright : dimmed;
        this.repairTypeA.tint = (air) ? bright : dimmed;
    }

    setInfantryMoveCost(mc: number) { this.moveCostTable.infantry.value.text = (mc == 0) ? '-' : mc.toString().slice(0,1); }
    setMechMoveCost(mc: number)     { this.moveCostTable.mech.value.text    = (mc == 0) ? '-' : mc.toString().slice(0,1); }
    setTireAMoveCost(mc: number)    { this.moveCostTable.tireA.value.text   = (mc == 0) ? '-' : mc.toString().slice(0,1); }
    setTireBMoveCost(mc: number)    { this.moveCostTable.tireB.value.text   = (mc == 0) ? '-' : mc.toString().slice(0,1); }
    setTreadMoveCost(mc: number)    { this.moveCostTable.tread.value.text   = (mc == 0) ? '-' : mc.toString().slice(0,1); }
    setAirMoveCost(mc: number)      { this.moveCostTable.air.value.text     = (mc == 0) ? '-' : mc.toString().slice(0,1); }
    setShipMoveCost(mc: number)     { this.moveCostTable.ship.value.text    = (mc == 0) ? '-' : mc.toString().slice(0,1); }
    setTransportMoveCost(mc: number){ this.moveCostTable.transport.value.text = (mc == 0) ? '-' : mc.toString().slice(0,1); }
}