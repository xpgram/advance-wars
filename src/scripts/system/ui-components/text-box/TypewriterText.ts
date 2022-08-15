import { Sprite } from "pixi.js";
import { stringify } from "querystring";
import { Game } from "../../../..";
import { PIXI } from "../../../../constants";
import { Color } from "../../../color/Color";
import { Palette } from "../../../color/ColorPalette";
import { Point } from "../../../Common/Point";
import { Common } from "../../../CommonUtils";
import { Debug } from "../../../DebugUtils";
import { UiComponent } from "../UiComponent";


export type TypewriterScript = (string | Function)[];
  // TODO Not all typewriter text needs to do this. I think it makes sense for a coordinator
  // to manage updating the typewriter pages while calling other functions.

export type TypewriterTextOptions = {
  componentName: string;
  text?: string;
  font: BitmapFont;
  lines: number;
  strictLineDistance?: number;
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


/**
 * 
 * TODO:
 * [x] Typewriter effect over displayed text
 * [ ] .setPageText(str) changes the text and rebuilds the typewriter effect
 * [ ] .advance() moves the paused page to the next line
 * [ ] .skip() shows all chars now, up to the next line pause
 */
export class TypewriterText extends UiComponent {

  get DOMAIN() { return `TypewriterText_${this.options.componentName}`; }

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
  private chars: {sprite: PIXI.Sprite, position: Point}[] = [];

  private typeface: BitmapFont[];

  /** The next char to reveal. */
  private readonly typewriterCursor = new Point();

  private time = 0;
  private timeMultiplier = 1;

  /** Returns true if the typewriter cursor is no longer selecting an object. */
  get pageFinished() {
    return this.typewriterCursor.y >= this.container.children.length;
      // TODO I need, maybe not 'finished', but I need 'waitingForInput' to return 'true' when
      // the textbox is displaying the maximum chars even if it isn't displaying the last char.
  }


  constructor(op: TypewriterTextOptions) {
    super();

    this.options = op;

    // REMOVE
    this.timeMultiplier = 2;

    this.typeface = [op.font];
      // TODO Turn this into a list of mid-script choosable typefaces.

    this.buildNextPage(op.text ?? '');
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
  frantic : Behavior-set Frantic    (shakes around like they're scared)
  sine    : Behavior-set Sinewave   (moves up and down)
  b1      : Behavior-set Userdefined1

  /r    : Reset to default settings. Clears all stylings.

  /code with no value will toggle-off that styling. Ex:
  /x    : End color (including [look] and [req])
  /s    : End text size.

  This will [look]get your blood pumping.[/r] But you'll need [req]batteries[/r] from the storage room.
  These will [xF00]blow [x0F0]your [x00F]balls [/r]away.
  These can [xF80]made [s4]to do[/x] whatever you[/s] want.
  */

  /** TODO:
   * [x] Clear last build
   * [x] Examine next char
   * [x] If char is ' ' or some other delimiter, update the break point idx
   * [ ] If char is '[', begin style interpreter
   *   [ ] first, confirm a matching ']' exists, else end
   *   [ ] find a cmd whose text begins the substr
   *   [ ] grab the rest of the string as a value input
   *   [ ] modify the text-styler module according to new rules
   *   [ ] remove style tag from stack
   *   [ ] loop back to examine char
   * [x] turn char into sprite
   * [-] style text according to current rules
   *   [ ] Test existing; expand applicables
   * [x] loop back
   * 
   * So far, it works. Fantastic.
   * I am concerned that perhaps all the containers are overworking the PC.
   * I mean, this is why I didn't want to do recursive char containers to begin with.
   * It's hard to tell with this machine, though.
   */

  private buildNextPage(page: string) {
    // Clear previous
    this.container.children.forEach( c => c.destroy({children: true}) );
    this.typewriterCursor.set(0);

    // Setup procedure variables
    let wordBreakIndex = 0;
    const whitespaceChars = ' ';
    const wordBreakChars = ' -';

    let lastCharData: PIXI.IBitmapFontCharacter | undefined;    // For kerning

    const lines = [new PIXI.Container()]; // A list of all horizontal lines. These are separated by their actual heights after being built, unless 'strictDistance' is enforced.
    let caret = 0;                        // Keeps track of horizontal travel when placing chars

    const err_messages = new Set<string>();

    const style = {
      color: Palette.white,
      scale: 1,
    }

    /** Resets kerning and safe-line-break rememberance.  
     * The caret or draw-position is considered separate. */
    function resetContinuityVars() {
      wordBreakIndex = 0;
      lastCharData = undefined;
    }

    
    // Iterate over the page string.
    for (let i = 0; i < page.length; i++) {
      const char = page.charAt(i);
      const charCode = page.charCodeAt(i);
      let line = lines.at(-1) as PIXI.Container;

      // consider '[' — we'll de this last

      // Skip ' ' (etc.) on line-breaks.
      if (line.children.length === 0 && whitespaceChars.includes(char))
        continue;

      // handle '\n'
      if (char === '\n') {
        lines.push(new PIXI.Container());
          // TODO The way lines are aligned later, '\n\n' cannot create a double line-break.
          // Should this be considered a feature instead of a design flaw?
        caret = 0;
        resetContinuityVars();
      }

      // gather char and font data
      const typefaceCode = 0; // TODO Expand to allow for multiple font choices
      const typefaceData = this.typeface.at(typefaceCode);
      if (!typefaceData) {
        err_messages.add(`typeface code '${typefaceCode}' not listed`);
        continue;
      }

      const typeface = PIXI.BitmapFont.available[typefaceData.fontName];
      if (!typeface) {
        err_messages.add(`typeface assets for '${typefaceData.fontName}' not found`);
        continue;
      }
  
      const charData = typeface.chars[charCode];
      if (!charData) {
        err_messages.add(`'${char}' data not found in typeface '${typefaceData.fontName}'`);
        continue;
      }

      // calc draw properties
      const scale = typefaceData.fontSize / typeface.size * style.scale;

      // Adjust caret by kerning
      caret += lastCharData?.kerning[charCode] ?? 0;
      lastCharData = charData;

      // build graphical object, apply style rules
      const gchar = new PIXI.Sprite(charData.texture);
      gchar.tint = style.color;
        // TODO Other style behaviors

      // build positional container
      const cont = new PIXI.Container();
      cont.addChild(gchar);

      cont.x = caret + (charData.xOffset * scale);
      cont.y = (charData.yOffset * scale);
      cont.scale.set(scale);
      // cont.visible = false;  // must be visible to calculate line.height later

      const charAnimated = false; // TODO For now, all chars are non-animated.
      cont.cacheAsBitmap = !charAnimated;
        // TODO Potentially, an entire page could be animated, and in that case I don't want to lean
        // on this caching technique. Whatever the textbox does should affect the system evenly.
        //
        // I could reduce the scene graph, however, if I switch to using a list of {spr, pos} objects.
        // The point of the wrapping container is to give spr a home-position of (0,0), but a pos that
        // tells me where it ought to be would work just as well.
        //
        // Also, if I switch, I could add fake objects or include a {wait} property to allow for
        // typewriter pauses.
        //
        // I probably should switch.
        // I will once I figure out how to model the sine-wave text behavior using this method.

      line.addChild(cont);

      // advance caret
      caret += charData.xAdvance * scale;

      // apply word-wrap
      if (caret > this.options.maxWidth) {
        // use the safe break-point, or if none just this last offending char
          // FIXME I expect this will have odd behavior if ' ' is the last offending char
        const breakIndex = (wordBreakIndex > 0) ? wordBreakIndex : line.children.length - 1;

        const newline = new PIXI.Container();
        const transferChildren = line.children.slice(breakIndex);
        if (transferChildren.length > 0)
          newline.addChild(...transferChildren);

        const xAdjust = newline.children.at(0)?.x ?? 0;
        newline.children.forEach( c => c.x -= xAdjust );
        caret -= xAdjust;

        resetContinuityVars();
        lines.push(newline);
        line = newline;
      }

      // update safe break-point index
      if (wordBreakChars.includes(char) && line.children.length > 1)
        wordBreakIndex = line.children.length;
    }

    // arrange lines vertically
    let yCaret = 0;
    for (const line of lines) {
      line.y = yCaret;
      yCaret += this.options.strictLineDistance ?? line.height;
      yCaret += this.options.lineSpacing ?? 0;

      // hide chars for typewriter effect
      for (const cont of line.children)
        cont.visible = false;
    };

    // add finished lines to component
    this.container.addChild(...lines);

    // post error messages
    for (const message of err_messages) {
      Debug.log(this.DOMAIN, "BuildPage", {
        message,
        warn: Game.developmentMode,
      })
    }
  }


  //  =============================================================================================
  //  =============================================================================================

  /** Converts a page of dialogue to instructions for the typewriter.
   * @deprecated */
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

      If 'lastBreak' > 0, move all succeeding chars into the next line object, subtract each
      graphic by the new 0th's x.
      If 'lastBreak' == 0, just break here at the previous, non-offending char.

      '[' begins the tag and substring interpreter, which affects the current style object.
      These are ignored after parsing.

      '\' can't be used as an escape char for '[]' because javascript already does a lot of
      escaping mid string with it. It would produce a lot of weird results.

    */
  }

  //  =============================================================================================
  //  =============================================================================================


  /** Stamps `n` new chars onto the text canvas. */
  private stampNewChars(n: number) {
    if (n <= 0)
      return;

    // TODO Wait, what about typewriter pauses?

    const line = this.container.children.at(this.typewriterCursor.y) as (PIXI.Container | undefined);
    const charCont = line?.children.at(this.typewriterCursor.x) as (PIXI.Container | undefined);
    if (charCont) {
      charCont.visible = true;

      // If frozen, trigger one update
      const freeze = charCont.cacheAsBitmap;
      charCont.cacheAsBitmap = false;
      charCont.cacheAsBitmap = freeze;
    }

    this.typewriterCursor.x++;
    if (line && this.typewriterCursor.x >= line.children.length) {
      this.typewriterCursor.x = 0;
      this.typewriterCursor.y++;
    }

    // Recursive loop to capture all n-char requests.
    n--;
    this.stampNewChars(n);
  }

}