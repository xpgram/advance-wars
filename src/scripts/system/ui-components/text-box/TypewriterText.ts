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

  /** Converts a page of dialogue to instructions for the typewriter. */
  private parseScript(script: string) {

    const StyleRule = {prop: '', value: 0};

    const styleRules: Record<string, (val: string) => (typeof StyleRule | false)> = {
      'look': (val: string) => {
        return {
          prop: 'color',
          value: Palette.caribbean_green,
        }
      },
      'x': (val: string) => {
        if (val.length === 3)
          val = `${Array.from(val).map( c => c.repeat(2) ).join('')}`   // Double every char

        if (val.length !== 6)
          return false;

        return {
          prop: 'color',
          value: Number(`0x${val}`),
        }
      },
    }

    const ruleSchedule: Record<number, typeof StyleRule> = {};

    // Parse style codes out of the script and into the rule schedule
    let begin = 0, end = 0;
    while ((begin = script.indexOf('[')) !== -1) {
      end = script.indexOf(']', begin);

      if (end === -1) // If no more ']', no more tags
        break;

      // Parse tag and tag contents for a style rule to schedule
      const tag = script.slice(begin, end+1);
      const substr = tag.slice(1,-1);

      const rule = Object.entries(styleRules).find( ([key,get]) => substr.startsWith(key) );

      if (rule) {
        const [ key, get ] = rule;
        const value = substr.slice(key.length);

        const styleData = get(value);

        if (styleData !== false) {
          ruleSchedule[begin] = ruleSchedule[begin]
            ? {...ruleSchedule[begin], ...styleData}  // This is additive. Can I rewrite it, though?
            : styleData;
        }
      }

      // Erase tag from script string
      script = script.replace(tag,'');
    }

    // Split lines along \n and then even more with respect to word wrap.
    let lines = script.split('\n');

    lines = lines
      .map( line => {
        // I'ma go basic for now.
        const newLines: string[] = [];
        let cursor = 0;

        while (line.length > 0) {
          while (cursor < 80 && cursor < line.length) {
            cursor = line.indexOf(' ', cursor);
          }
          if (cursor !== 0)
            cursor = line.lastIndexOf(' ', cursor) + 1; // Get the position of the char just after the space.

          newLines.push(line.slice(0, cursor));
          line = line.slice(cursor);
        }

        return [
          ...newLines,
          line,
        ]
      })
      .flat();

    // Okay.
    // We have now produced an array of lines
    //   ['the first ','the second ','more dialogue ','you get the idea.']
    // and a style change itinerary
    //   {14: {'color': 0x009988}, 21: {'color': 0x0}}
    // I do feel this is missing the point a bit.
    // Like.
    // Sigh, I dunno.
    /*

      I need to parse out the style tags because I need to know the actual length of the lines
      so I can split them.

      But I also need to know where those tags were so I can still apply them.

      I guess I could convert the chars to graphics in one pass, stopping to apply style tags
      along the way, and then do the word wrap on the actual graphics objects.

      But in that case, I need some way of knowing where the delimiters are.

      Anyway. I'd love to think about this, but I need to actually work so I can go home later.

      

      I definitely want to do this in one pass because grabbing the texture width data once,
      doing some stuff, and then later grabbing it again seems silly.

      Word-wrap happens over the last known good space char.
      
      So '-' and ' ' could be treated like remembered as line-break points and if the current
      word goes over the margin then everything from line-break to cursor gets moved into a
      new line, and '\n' (which does read as one char; '\n'.length === 1) can just do this
      immediately.

      '[' begins the tag and substring interpreter, which affects the current style object.
      These are ignored after parsing.

      '\' can't be used as an escape char for '[]' because javascript already does a lot of
      escaping mid string with it. It would produce a lot of weird results.

    */
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