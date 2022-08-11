import { Sprite } from "pixi.js";
import { Game } from "../../../..";
import { PIXI } from "../../../../constants";
import { Point } from "../../../Common/Point";
import { Common } from "../../../CommonUtils";
import { UiComponent } from "../UiComponent";


export type TypewriterTextOptions = {
  text?: string;
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

  private options: Readonly<TypewriterTextOptions>;

  // private renderTexture = new PIXI.RenderTexture(
  //   new PIXI.BaseRenderTexture({

  //   }),
  //   // new PIXI.Rectangle(0,0,
  //   //   Game.display.renderWidth,
  //   //   Game.display.renderHeight,
  //   // ),
  // );

  // TODO Use this to access individual chars; this way tweens can do sine waves and stuff.
  private letters: {sprite: PIXI.Sprite, position: Point}[] = [];

  private typeface: PIXI.BitmapFont[];

  /** The next char to reveal. */
  private typewriterCursor = 0;

  private time = 0;
  private timeMultiplier = 1;

  /** Returns true if the typewriter cursor is no longer selecting an object. */
  get pageFinished() {
    return this.typewriterCursor >= this.container.children.length;
  }


  constructor(op: TypewriterTextOptions) {
    super();

    this.options = op;

    // Acquire glyph sheet.
    const data = PIXI.BitmapFont.available[op.font.fontName];

    if (!PIXI.BitmapFont.available[op.font.fontName])
      throw new Error(`Font '${op.font.fontName}' could not be found.`);

    this.typeface = [data];
      // TODO Turn this into a list of mid-script choosable typefaces.

    this.buildNextPage(op.text ?? '');

    // this.container.addChild(new PIXI.Sprite(this.renderTexture));

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

    Let's start by making sure the stamping mechanic works.

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

  /*
  Text codes I'm considering:
  ~1–0  : Change color
  ~s1–5 : Change text size

    // These aren't possible without making each letter its own sprite object.
  ~fr   : Frantic behavior    (shakes around like they're scared)
  ~sn   : Sine-wave behavior  (moves up and down)

  ~r    : Reset to default settings.
  */

  private buildNextPage(script: string) {
    // Clear previous
    this.container.children.forEach( c => c.destroy({children: true}) );

    let lastCharData: PIXI.IBitmapFontCharacter | undefined;

    const cursor = new Point();

    let cumulativeWidth = 0;  // This + xadvance so lines can be forced < maxWidth
    let maxLineHeight = 0;

    // TODO Split lines by supposed width before assembly; split by words.

    for (const c of script) {
      const charCode = c.charCodeAt(0);

      const typeface = this.typeface.at(0);
      if (!typeface)
        continue;

      const charData = typeface.chars[charCode];
      if (!charData)
        continue;

      // Handle kerning
      if (lastCharData && lastCharData.kerning[charCode])
        cursor.x += lastCharData.kerning[charCode];
      lastCharData = charData;

      // Build sprite object.
      const spr = new PIXI.Sprite(charData.texture);
      spr.position.set(
        cursor.x + charData.xOffset,
        cursor.y + charData.yOffset,
      );
      // spr.scale.set(typeface.size / charData.texture.height / 2); // I also don't know how to get the proper height.
        // Why doesn't this display all lines?
      spr.visible = false;
        // TODO Extra behaviors

      this.container.addChild(spr);

      maxLineHeight = Math.max(spr.height, maxLineHeight);

      // Move cursor
      cursor.x += charData.xAdvance;
      if (cursor.x >= this.options.maxWidth)
        cursor.set(0, cursor.y + maxLineHeight + (this.options.lineSpacing ?? 0));
    };
  }

  /** Stamps `n` new chars onto the text canvas. */
  private stampNewChars(n: number) {
    if (n <= 0)
      return;

      // TODO Wait, what about typewriter pauses?
    const child = this.container.children.at(this.typewriterCursor);
    child && (child.visible = true);
    this.typewriterCursor++;

    // if (!Common.validIndex(this.cursor.y, this.lines.length) ||
    //     !Common.validIndex(this.cursor.x, this.lines[this.cursor.y].length))
    //   return; // TODO Still increment cursor, though.

    // const char = this.lines[this.cursor.y].charCodeAt(this.cursor.x);

    // // Advance the cursor to the next letter.
    // this.cursor.x++;
    // if (this.cursor.x >= this.lines[this.cursor.y].length) {
    //   this.cursor.x = 0;
    //   this.cursor.y++;
    // }

    // // Get typeface.
    // const typeface = this.typeface[0];

    // if (!typeface)
    //   return; // TODO

    // const charData = typeface.chars[char.char];

    // if (!charData)
    //   return; // TODO

    // const stamp = new Sprite(charData.texture);
    // stamp.position.set(this.texCursor.x, this.texCursor.y);

    // let cursor = -8;
    // for (const char of op.text ?? '') {
    //   cursor += 8;

    //   const c = char.charCodeAt(0);
    //   if (!data.chars[c])
    //     continue;

    //   const spr = new PIXI.Sprite(data.chars[c].texture);
    //   spr.x = cursor;

    //   Game.renderer.render(spr, {
    //     renderTexture: this.renderTexture,
    //     clear: false,
    //   });
    // }

    // Recursive loop to capture all n-char requests.
    n--;
    this.stampNewChars(n);
  }

}