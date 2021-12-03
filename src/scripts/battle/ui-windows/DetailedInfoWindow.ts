import * as PIXI from "pixi.js";
import { fonts } from "./DisplayInfo";
import { SlidingWindow } from "./SlidingWindow";
import { RectBuilder } from "./RectBuilder";
import { TerrainObject } from "../map/TerrainObject";
import { ArmorTypeString, MoveTypeString, UnitClass } from "../EnumTypes";
import { UnitObject } from "../UnitObject";
import { Point } from "../../Common/Point";
import { BitmapText } from "@pixi/text-bitmap";
import { StringDictionary } from "../../CommonTypes";
import { Slider } from "../../Common/Slider";
import { VirtualGamepad } from "../../controls/VirtualGamepad";
import { Game } from "../../..";
import { TerrainProperties } from "../map/Terrain";


/**  */
export class DetailedInfoWindow extends SlidingWindow {

  gamepad?: VirtualGamepad;

  private terrain!: TerrainObject;
  private unit?: UnitObject;

  /** Whether this window should display, even if able. */
  get visible() { return this.displayContainer.visible; }
  set visible(b) { this.displayContainer.visible = b; }

  /** Which details window pane to show: terrain, unit1 or unit2. */
  private tabSlider = new Slider({
    max: 3,
    granularity: 1,
    looping: true,
    shape: v => (this.unit) ? v : 0,
  });

  /** Which details window pane to show (during forced unit details). */
  private shopTabSlider = new Slider({
    max: 2,
    granularity: 1,
    looping: true,
    shape: v => (this.unit) ? v+1 : 0,
  });

  // Objects
  private header = new Header(new Point(5, 4));
  private illustration = new Illustration(new Point(8, 18));
  private description = new Description(new Point(8, 62), this.width - 16);
  private income = new Income(
    new Point(8,119,),
    new PIXI.Sprite(this.sheet.textures['icon-funds.png'])
  );
  private repairType = new RepairType(
    new Point(46, 120)
  );
  private moveCostTable = new MoveCostTable(new Point(8, 130));


  private unitMoveType = new IconText(
    new Point(8, 124),
    new PIXI.Sprite(this.sheet.textures['icon-stats-movement.png'])
  )
  private unitArmorType = new IconText(
    new Point(46, 124),
    new PIXI.Sprite(this.sheet.textures['icon-stats-defense.png'])
  )
  private unitGas = new LabelValue(new Point(8,135), 'Gas');
  private unitAmmo = new LabelValue(new Point(8,143), 'Amu');
  private unitMobility = new LabelValue(new Point(8,151), 'Mob');
  private unitVision = new LabelValue(new Point(46,135), 'Vis');
  private unitRange = new LabelRange(new Point(46,143), 'Rng');


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

    // Assemble components
    this.displayContainer.addChild(
      background,
      this.mask,
      ...[
        this.illustration,
        this.header,
        this.description,
        this.income,
        this.repairType,
        this.moveCostTable,

        this.unitMoveType,
        this.unitArmorType,
        this.unitGas,
        this.unitAmmo,
        this.unitMobility,
        this.unitVision,
        this.unitRange,
      ].map( e => e.container ),
    )

    Game.scene.ticker.add(this.getInput, this);
  }

  destroy() {
    this.gamepad = undefined;
    Game.scene.ticker.remove(this.getInput, this);
  }

  private getInput() {
    if (this.gamepad?.button.X.pressed) {
      this.tabSlider.increment();
      this.inspectTerrain(this.terrain, this.unit);
    }
  }

  /** Updates window UI elements with details from the given terrain object. */
  inspectTerrain(terrain: TerrainObject, unit?: UnitObject) {
    this.terrain = terrain;
    this.unit = unit;

    const showingUnit = (this.tabSlider.output > 0);
    const showingUnit2 = (this.tabSlider.output === 2);

    /* Main */
    
    this.header.text = (unit && showingUnit) ? unit.name : terrain.name;
    this.description.text = (unit && showingUnit) ? unit.description : terrain.description;
    this.illustration.setIllustration(terrain, unit, showingUnit);
    this.illustration.focusUnit = showingUnit;

    /* Terrain Details */

    const incomeValue = (terrain.generatesIncome) ? 1000 : 0;
      // TODO income value needs to be obtained from the scenario.
    this.income.setValue(incomeValue);
    this.repairType.setState(terrain.repairType);
    this.moveCostTable.setTable(terrain);

    [  // Set visibility
      this.income,
      this.repairType,
      this.moveCostTable
    ].forEach(
      e => e.container.visible = !showingUnit
    );

    /* Unit1 Details */

    this.unitMoveType.text = (unit) ? MoveTypeString(unit.moveType) : '';
    this.unitArmorType.text = (unit) ? ArmorTypeString(unit.armorType) : '';
    this.unitGas.setValue(unit?.maxGas);
    this.unitAmmo.setValue(unit?.maxAmmo);
    this.unitMobility.setValue(unit?.maxMovementPoints);
    this.unitVision.setValue(unit?.vision);
    this.unitRange.setRange(unit?.range);

    [  // Set visibility
      this.unitMoveType,
      this.unitArmorType,
      this.unitGas,
      this.unitAmmo,
      this.unitMobility,
      this.unitVision,
      this.unitRange,
    ].forEach(
      e => e.container.visible = showingUnit && !showingUnit2
    );

    // Special visibility case
    this.description.container.visible = !showingUnit2;

    /* Unit2 Details */

  }
}


abstract class UiComponent {
  container = new PIXI.Container();
  constructor(p: Point) {
    this.container.position.set(p.x, p.y);
  }
}

abstract class TextComponent extends UiComponent {
  protected elem: BitmapText;
  get text() { return this.elem.text; }
  set text(t) { this.elem.text = t; }

  constructor(p: Point, font: typeof fonts.list) {
    super(p);
    this.elem = new BitmapText('', font);
    this.container.addChild(this.elem as BitmapText);
  }
}

class Header extends TextComponent {
  constructor(p: Point) {
    super(p, fonts.title);
  }
}

class Description extends TextComponent {
  set text(t: string) { this.elem.text = t.replace(/\//g, ''); }
    // '/' were going to denote colored text, but I don't know how to do that yet.
  constructor(p: Point, maxWidth: number) {
    super(p, fonts.script);
    this.elem.maxWidth = maxWidth;
  }
}

class Illustration {
  container = new PIXI.Container();
  private unit = new PIXI.Container();
  
  get focusUnit() { return this._focusUnit; }
  set focusUnit(b) { 
    this._focusUnit = b;
    this.unit.alpha = (this._focusUnit) ? 1 : .3;
  }
  private _focusUnit = false;

  constructor(p: Point) {
    this.container.position.set(p.x, p.y);
  }
  
  setIllustration(terrain: TerrainObject, unit?: UnitObject, showAirUnit?: boolean) {
    const sheet = TerrainProperties.infoPortraitSheet;
    const skyLandscape = new PIXI.Sprite(sheet.textures['sky-landscape.png']);

    const airUnit = (unit && unit.unitClass === UnitClass.Air);
    const landscape = (airUnit && showAirUnit) ? skyLandscape : terrain.landscape;

    const nullIllustration = new PIXI.Container();
    const unitIllustration = (airUnit && !showAirUnit) ? nullIllustration : unit?.illustration || nullIllustration;
    // TODO It's weird that air units aren't visible.
    // I want to put a line at the top that indicates there's something high up.

    this.unit = unitIllustration;
    this.focusUnit = false;

    this.container.removeChildren();
    this.container.addChild(landscape, this.unit);
    return this;
  }
}

class Income extends TextComponent {
  constructor(p: Point, icon: PIXI.Container) {
    super(p, fonts.list);
    this.elem.position.set(34, 1);
    this.elem.anchor.set(1, 0);
    this.container.addChild(icon);
  }

  setValue(n: number) {
    this.text = n.toString().slice(0,4);
    if (this.text === '0') this.text = '-';
  }
}

class IconText extends TextComponent {
  constructor(p: Point, icon: PIXI.Container) {
    super(p, fonts.list);
    this.elem.position.set(icon.width + 2 + .5*(34 - icon.width), 1);
    this.elem.anchor.set(.5,0);
    this.container.addChild(icon);
  }
}

class LabelValue extends TextComponent {
  constructor(p: Point, label: string) {
    super(p, fonts.list);
    this.elem.position.set(35,1);
    this.elem.anchor.set(1,0);

    const labelText = new BitmapText(label, fonts.list);
    labelText.position.set(1);

    const rect = RectBuilder({
      width: 17,
      height: 8,
      color: 0x0,
      alpha: .35,
    });
    rect.addChild(labelText);

    this.container.addChild(rect);
  }

  setValue(n?: number) {
    this.text = n?.toString().slice(0,2) || '0';
    if (this.text === '0') this.text = '-';
  }
}

class LabelRange extends LabelValue {
  // TODO But setValue is still public... uh...
  setRange(r?: {min: number, max: number}) {
    if (!r || r.min < 1 || r.max < 1) {
      this.text = '-';
      return;
    }

    if (r.min === r.max)
      this.text = `${r.min}`;
    else
      this.text = `${r.min}-${r.max}`;
  }
}

class RepairType extends UiComponent {
  private rep = new BitmapText('Rep', fonts.list);
  private typeG = new BitmapText('G', fonts.list);
  private typeN = new BitmapText('N', fonts.list);
  private typeA = new BitmapText('A', fonts.list);

  constructor(p: Point) {
    super(p);
    const x = 18, w = 6;
    this.typeG.x = x;
    this.typeN.x = x + w;
    this.typeA.x = x + 2*w;
    this.container.addChild(this.rep, this.typeG, this.typeN, this.typeA);
  }

  setState(unitClass: UnitClass) {
    const bright = 0xDDDDDD;
    const dim = 0x888888;
    this.typeG.tint = (unitClass === UnitClass.Ground) ? bright : dim;
    this.typeN.tint = (unitClass === UnitClass.Naval) ? bright : dim;
    this.typeA.tint = (unitClass === UnitClass.Air) ? bright : dim;
  }
}

class MoveCostTable extends UiComponent {
  private table = {
    infantry: {
      label: new BitmapText('Inf', fonts.list),
      value: new BitmapText('', fonts.list),
    },
    tireA: {
      label: new BitmapText('TireA', fonts.list),
      value: new BitmapText('', fonts.list),
    },
    tireB: {
      label: new BitmapText('TireB', fonts.list),
      value: new BitmapText('', fonts.list),
    },
    ship: {
      label: new BitmapText('Ship', fonts.list),
      value: new BitmapText('', fonts.list),
    },
    mech: {
      label: new BitmapText('Mech', fonts.list),
      value: new BitmapText('', fonts.list),
    },
    tread: {
      label: new BitmapText('Tank', fonts.list),
      value: new BitmapText('', fonts.list),
    },
    air: {
      label: new BitmapText('Air', fonts.list),
      value: new BitmapText('', fonts.list),
    },
    transport: {
      label: new BitmapText('Trpt', fonts.list),
      value: new BitmapText('', fonts.list),
    }
  }

  constructor(p: Point) {
    super(p);

    const tableItems = Object.values(this.table);
    const halfLen = Math.ceil(tableItems.length / 2);

    const columnShift = 38;
    const lineHeight = 8;
    const columnRight = 34;

    tableItems.forEach( (item,idx) => {
      let colShift = (idx < halfLen) ? 0 : columnShift;
      let rowShift = (idx % halfLen) * lineHeight;
      item.label.position.set(colShift, rowShift);
      item.value.position.set(colShift + columnRight, rowShift);
      item.value.anchor.set(1,0);

      this.container.addChild(item.label, item.value);
    });
  }

  setTable(terrain: TerrainObject) {
    type Entry = typeof this.table.infantry;
    const format = (n: number) => (n === 0) ? '-' : n.toString().slice(0,1);

    Object.entries(terrain.movementCost).forEach( item => {
      const [key, cost] = item;
      const entry = (this.table as StringDictionary<Entry>)[key];
      if (entry)
        entry.value.text = format(cost);
    });
  }
}