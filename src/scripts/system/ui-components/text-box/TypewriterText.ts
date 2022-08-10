import { Sprite } from "pixi.js";
import { Game } from "../../../..";
import { PIXI } from "../../../../constants";
import { Point } from "../../../Common/Point";
import { UiComponent } from "../UiComponent";


export type TypewriterTextOptions = {
  font: BitmapFont;
  lines: number;
  lineSpacing?: number;
  maxWidth: number;
}

interface CharRenderData {
  texture: PIXI.Texture;
  line: number;
  charCode: number;
  position: Point;
  prevSpaces: number;
}

export class TypewriterText extends UiComponent {

  private lines: PIXI.Sprite[][] = [];

  private cursor = new Point();

  private time = 0;
  private timeMultiplier = 1;

  /**  */
  get pageFinished() { return this.cursor.y >= this.lines.length; }
    // cursor.x >= this.lines[n].length will always advance .y, so we'll just use .y to measure.


  constructor(op: TypewriterTextOptions) {
    super();

    // Acquire glyph sheet.
    const data = PIXI.BitmapFont.available[op.font.fontName];

    if (!PIXI.BitmapFont.available[op.font.fontName])
      throw new Error(`yuh. don exist bruv.`);

    const charCode = 83;
    const charData = data.chars[charCode];
    
    const tex = charData.texture;
    const spr = new Sprite(tex);

    this.container.addChild(spr);


    /*

    So, here's what I want to do, I think.

    BitmapText works by taking the textures taken from data.chars[charCode] and, with a little
    cursor and kerning magic, assembles them into a larger texture that is then cached and
    manipulated as a macro object, at least until .text is modified and it needs to re-render.

    I can do the same thing. Perhaps with less sophistication, and.. more slowly, but I can
    do this myself. *And* I'll have more control over the text itself. Meaning I can color
    code it.

    Whenever `text` is modified, I'll reset all the animation mechanics and put the text into
    a sieve, or a series of sieves.

    Delta time will accumulate and whenever it's >1 I'll take the floor (leaving the mantissa)
    and add that many chars to the big texture.

    The big texture, until a page advance, is a working canvas. It's an additive procedure.



    */
  }


  protected update() {
    this.time += Game.delta * this.timeMultiplier;

    if (this.time >= 1) {
      const addCount = Math.floor(this.time);
      this.time -= addCount;
      this.stampNewChars(addCount);
    }
  }

  private stampNewChars(n: number) {
    // using the cursor's position in the script and it's inferred position on the canvas,
    // stamp a new char-texture onto the working string texture. Do this n-times.
  }

}