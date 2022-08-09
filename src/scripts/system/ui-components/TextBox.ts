import { Game } from "../../..";
import { PIXI } from "../../../constants";
import { fonts } from "../../battle/ui-windows/DisplayInfo";
import { Palette } from "../../color/ColorPalette";
import { Rectangle } from "../../Common/Rectangle";
import { VirtualGamepad } from "../../controls/VirtualGamepad";
import { UiComponent } from "./UiComponent";

/*

I have to pee, so I'll write this pseudo-code quick.

[ ] Background
[ ] Text
[ ] Room for character portraits (probably above, right?)
[ ] Text is word-wrapped 
  [ ] A mask and a separate, hidden bitmaptext object is used to measure which
      letters should be shown during the typewriter effect.
[ ] Text that is measured to extend beyond the textbox bounds is seperated into seperate
    lines or textbox panels. Some pre-caculation is needed here.
[ ] Press A advances the text box.
[ ] Press A during typewriter skips the typewriter effect.
[ ] Hold B during typewriter speeds up typewriter effect.
[ ] Each advanced text panel adds to a text-log history.
[ ] text panels can be accompanied by function callbacks, like to move the mapcursor.

[ ] I'll worry about this later, but I want a paragraph style. Long lines of text that are
    automatically split do a scroll thing instead of wiping the entire box each panel.

[ ] After advancing the last text panel, the textbox does its closing animation
[ ] After its closing animation, it signals that it's done working (tells the
    turnstate to move on or w/e)
[ ] Press start skips all text and closes the textbox

*/

export class TextBox extends UiComponent {
    // TODO Let this extend from a GamepadUiComponent or a GamepadInteractible(UiComponent)
    // so simple enable/disable controls functions can be standardized.
  protected gamepad: VirtualGamepad;

  /** Used for displaying the speaker's name. */
  protected nameText = new PIXI.BitmapText('', fonts.smallScriptOutlined);
  /** Used for displaying text on the textbox. */
  protected gtext = new PIXI.BitmapText('', fonts.script);
  /** Used for measuring letter and line widths. */
  protected mtext = new PIXI.BitmapText('', fonts.script);


  constructor(gp: VirtualGamepad, visualLayer: PIXI.Container, ...text: (string | Function)[]) {
    super();
    this.gamepad = gp;
    visualLayer.addChild(this.container);

    this.container.addChild(this.drawBackground());

    // REMOVE Testing text
    this.nameText.text = 'Will';
    this.gtext.text = text[0];

    Game.scene.ticker.add(this.update, this);
  }

  protected drawBackground(): PIXI.Graphics {
    const { renderWidth, renderHeight } = Game.display;
    const hmargin = 6, vmargin = 4;
    const hborder = 8, vborder = 1;
    const lineHeight = fonts.script.fontSize;
    const boxHeight = 4*lineHeight;
    const textHMargin = 8;

    const elementRect = new Rectangle(
      0, 0,
      renderWidth - 2*hmargin,
      boxHeight,
    );

    const contentRect = new Rectangle(
      hborder, vborder,
      elementRect.width - 2*hborder,
      elementRect.height - 2*vborder,
    )

    const portraitRect = new Rectangle(
      contentRect.x, contentRect.y,
      contentRect.height,
      contentRect.height,
    )

    const g = new PIXI.Graphics;
    g.beginFill(Palette.gale_force1)
      .drawRect(0,0,elementRect.width,elementRect.height)
      .beginFill(Palette.black, .3)
      .drawRect(0,0,elementRect.width,elementRect.height)
      
      // Inside-borders portion
      .beginFill(Palette.gale_force2)
      .drawRect(contentRect.x, contentRect.y, contentRect.width, contentRect.height)

      // Portrait placeholder
      .beginFill(Palette.asian_violet)
      .drawCircle(portraitRect.x + portraitRect.height/2, portraitRect.y + portraitRect.height/2, portraitRect.height/2)

      .endFill();

    g.x = hmargin;
    g.y = renderHeight - vmargin - elementRect.height;

    // These elem-boxes might need to be extracted; this function's job isn't to move gtext.
    const textRect = new Rectangle(
      portraitRect.right + textHMargin, lineHeight/2,
      contentRect.width - portraitRect.width - 2*textHMargin,
      elementRect.height - lineHeight
    )
    this.gtext.position.set(textRect.x, textRect.y);
    this.gtext.maxWidth = textRect.width;

    this.nameText.anchor.set(.5);
    this.nameText.position.set(
      portraitRect.center.x,
      portraitRect.bottom,
    );

    g.addChild(this.nameText, this.gtext);

    return g;
  }

  protected update() {
    // stub
  }

}