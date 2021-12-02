import { fonts } from "./DisplayInfo";

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

  
  constructor(options: SlidingWindowOptions) {
    super(options);

    
  }
}