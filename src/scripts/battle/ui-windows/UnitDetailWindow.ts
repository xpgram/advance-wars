import { UnitObject } from "../UnitObject";
import { fonts } from "./DisplayInfo";
import { RectBuilder } from "./RectBuilder";
import { SlidingWindow } from "./SlidingWindow";

const BitmapText = PIXI.BitmapText;
const Container = PIXI.Container;

export class UnitDetailWindow extends SlidingWindow {

  // Objects
  private header = new BitmapText('', fonts.title);
  private illustration = new Container();
  private description = new BitmapText('', fonts.script);

  private maxGas = new BitmapText('', fonts.list);
  private maxAmmo = new BitmapText('', fonts.list);
  private mobility = new BitmapText('', fonts.list);
  private visibility = new BitmapText('', fonts.list);
  private range = new BitmapText('', fonts.list);

  private moveType = new BitmapText('', fonts.list);
  private unitClass = new BitmapText('', fonts.list);

  // Heuristics
  //  inftry ↑
  //  veh ↓
  //  air -
  //  heli ↓
  //  ship -
  //  sub -

  // Weapons
  //  Main  'Not Equipped'
  //  Sub   'Machine Gun'

  // ATK / DEF
  //  ↑ or ↓ when CO augment or CO power. I don't know the specifics.

  // Sheesh, man. I don't have room for all this shit.
  // I guess I could 1.5 size it or something, it would just open faster than detail.
  // I could also flip through 3 possible panes instead of 2.

  
  constructor(options: SlidingWindowOptions) {
    super(options);

    let background = RectBuilder({
      width: 88,
      height: 165,
      color: 0x000000,
      alpha: 0.5,
    });

    // Main
    this.header.position.set(5, 4);
    this.illustration.position.set(8, 18);
    this.description.position.set(8, 62);
    this.description.maxWidth = this.width - 16;

    // Details


    // Formal add
    this.displayContainer.addChild(background);
    this.displayContainer.addChild(this.illustration);
    this.displayContainer.addChild(this.header, this.description);
  }

  private setHeaderText(text: string) {
    this.header.text = text;
  }

  private setIllustration(img: PIXI.Container) {
    this.illustration.removeChildren();
    this.illustration.addChild(img);
  }

  private setDescriptionText(text: string) {
    text = text.replace(/\//g, ''); // '/' were going to denote colored text.
    this.description.text = text;
  }

  inspectUnit(unit?: UnitObject) {
    this.displayContainer.visible = (unit !== undefined);

    console.log('present', this.displayContainer.visible);

    if (!unit)
      return;

    this.setHeaderText(unit.name);
    // this.setIllustration(unit.illustration);
    this.setDescriptionText(unit.description);
  }
}