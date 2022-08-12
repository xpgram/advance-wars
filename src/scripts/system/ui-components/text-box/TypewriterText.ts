import { Sprite } from "pixi.js";
import { stringify } from "querystring";
import { Game } from "../../../..";
import { PIXI } from "../../../../constants";
import { Color } from "../../../color/Color";
import { Palette } from "../../../color/ColorPalette";
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

  private typeface: BitmapFont[];

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

    this.typeface = [op.font];
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
  look  : Changes color to "of interest" color.
  req   : Changes color to "required" color.
  xFFF  : Condensed hex color for proceeding text.
  s1–5  : Change text size
  w1–9  : Wait-point with length of some logarithmic measure

    // These should be named for their semantic meaning, like [look]
    // 'Frantic' is fine. I dunno what sine should be. Sine kinda makes me think of a car salesman, though.
  b:fr  : Behavior-set Frantic    (shakes around like they're scared)
  b:sn  : Behavior-set Sinewave   (moves up and down)

  /r    : Reset to default settings. Clears all stylings.

  /code with no value will toggle-off that styling. Ex:
  /x    : End color (including [look] and [req])
  /s    : End text size.

  This will [look]get your blood pumping.[/r] But you'll need [req]batteries[/r] from the storage room.
  These will [xF00]blow [x0F0]your [x00F]balls [/r]away.
  These can [xF80]made [s4]to do[/x] whatever you[/s] want.
  */

  private buildNextPage(script: string) {
    // Clear previous
    this.container.children.forEach( c => c.destroy({children: true}) );

    let lastCharData: PIXI.IBitmapFontCharacter | undefined;

    const cursor = new Point();

    let cumulativeWidth = 0;  // This + xadvance so lines can be forced < maxWidth
    let maxLineHeight = 0;

    const typefacesNotFound: Record<string, boolean> = {};

    // TODO Split lines by supposed width before assembly; split by words.

    // REMOVE idx as well
    let idx = -1;
    for (const c of script) {
      idx++;
      const charCode = c.charCodeAt(0);

      const typefaceData = this.typeface.at(0);
      if (!typefaceData)
        continue;

      const typeface = PIXI.BitmapFont.available[typefaceData.fontName];
      if (!typeface) {
        typefacesNotFound[typefaceData.fontName] = true;
        continue;
      }

      const charData = typeface.chars[charCode];
      if (!charData)
        continue;

      const scale = typefaceData.fontSize / typeface.size;

      // Handle kerning
      if (lastCharData && lastCharData.kerning[charCode])
        cursor.x += lastCharData.kerning[charCode] * scale;
      lastCharData = charData;

      // Build sprite object.
      const spr = new PIXI.Sprite(charData.texture);
      spr.position.set(
        cursor.x + charData.xOffset * scale,
        cursor.y + charData.yOffset * scale,
      );
      spr.scale.set(scale);
      spr.visible = false;
        // TODO Extra behaviors

      // REMOVE Test selective coloring
      if (Common.within(idx, 73, 93))
        spr.tint = Color.HSV(350,70,100);

      this.container.addChild(spr);

        // TODO This somehow considers offsets from the baseline as well
      maxLineHeight = Math.max(spr.height, maxLineHeight);

      // Move cursor
      cursor.x += charData.xAdvance * scale;
      if (cursor.x >= this.options.maxWidth)
        cursor.set(0, cursor.y + maxLineHeight + (this.options.lineSpacing ?? 0));
    };

    // REMOVE Does size and scale match what I expect?
    console.log(this.container);
  }

  /** Stamps `n` new chars onto the text canvas. */
  private stampNewChars(n: number) {
    if (n <= 0)
      return;

      // TODO Wait, what about typewriter pauses?
    const child = this.container.children.at(this.typewriterCursor);
    child && (child.visible = true);
    this.typewriterCursor++;

    // Recursive loop to capture all n-char requests.
    n--;
    this.stampNewChars(n);
  }

}