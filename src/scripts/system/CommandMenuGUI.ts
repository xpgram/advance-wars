import { Game } from "../..";
import { fonts } from "../battle/ui-windows/DisplayInfo";
import { BoxContainerProperties } from "../Common/BoxContainerProperties";
import { Point } from "../Common/Point";
import { Slider } from "../Common/Slider";
import { Color } from "../CommonUtils";
import { Pulsar } from "../timer/Pulsar";
import { ListMenu } from "./ListMenu";
import { ListMenuOption } from "./ListMenuOption";


const { HSV } = Color;

/** A generic GUI represention for a ListMenu.
 * Basic menu component. Can or should be overridden to 
 * implement new visual styles.
 * */
export class CommandMenuGUI<X, Y> {

  static readonly CursorSettings = {
    animFrames: 3,
    interval: 45,
  }

  /** Reference to this menu's pseudo-css properties. */
  readonly listItemProps = new BoxContainerProperties({
    minWidth: 40,
    height: fonts.menu.fontSize + 2,
    margin: { left: 3, right: 3, top: 1, bottom: 1 },
    border: { left: 1, right: 1, top: 1, bottom: 1, },
    padding: { left: 2, right: 2 },
  });

  readonly palette = {
    selector:     HSV(166, 100, 80),
    button: {
      unselected: {
        background: HSV(200, 30, 30),
        primary:    HSV(215, 25, 35),
        light:      HSV(220, 15,100),
        dark:       HSV(190, 10,  0),
      },
      selected: {
        background: HSV(200, 30, 30),
        primary:    HSV(170, 65, 40),
        light:      HSV(185, 35,  0),
        dark:       HSV(170, 35,100),
      },
      disabled: {
        background: HSV(200, 0, 20),
        primary:    HSV(215, 0, 30),
        light:      HSV(190, 0,  0),
        dark:       HSV(220, 0, 80),
      },
    },
  }

  /** Reference to the menu object which controls this GUI. */
  readonly menu: ListMenu<X, Y>;

  /** The top-level graphical object for this GUI menu. */
  protected readonly gui = new PIXI.Container();

  /** Pulsar which triggers cursor animation. */
  protected animPulsar = new Pulsar(
    CommandMenuGUI.CursorSettings.interval,
    () => {},
    this
  );

  /** Slider which determines cursor position when traveling
   * between menu options. */
  protected cursorMovementSlider = new Slider({
    granularity: 1 / CommandMenuGUI.CursorSettings.animFrames,
  });

  constructor(menu: ListMenu<X, Y>, container: PIXI.Container, options?: {listItemProps?: BoxContainerProperties}) {

    // Well. It's nominally correct now.
    
    // TODO BoxProperties assumes a value of 0 or all properties undeclared in
    // its options object, which breaks merge() entirely; every single property
    // is 'defined' so every single property get overwritten. With 0.

    this.menu = menu;
    this.menu.on('move-cursor', () => {
      this.buildGraphics();
    });

    this.buildGraphics();
    container.addChild(this.gui);

    // TODO Remove
    Game.scene.ticker.add(() => { this.buildGraphics() });

    this.animPulsar.start();
  }

  /** Unlinks this object's circular references and removes it from higher scope structures. */
  destroy() {
    this.gui.destroy({children: true});
    this.animPulsar.destroy();
    this.menu.destroy();
  }

  /** Reveals this menu's graphics and enables player input. */
  show() {
    this.gui.visible = true;
    this.menu.enableInput();
  }

  /** Hides this menu's graphics and disables player input. */
  hide() {
    this.gui.visible = false;
    this.menu.disableInput();
  }

  /** Whether this menu is invisible and uninteractable. */
  get hidden() {
    return (!this.gui.visible);
  }

  /** Sets a new list of menu options, and rebuilds the GUI's graphics. */
  setListItems(li: ListMenuOption<X,Y>[]) {
    this.menu.setListItems(li);
    this.buildGraphics();
  }

  /** Returns the longest pixel-width needed by this menu's displayed list items. */
  getContentWidth(): number {
    const { listItems } = this.menu;
    if (listItems.length === 0)
      return this.listItemProps.minWidth;

    const text = new PIXI.BitmapText('', fonts.menu);
    const sizes = listItems.map( i => {
      const iter = Array.isArray(i.key) ? i.key : [i.key];
      text.text = iter.join(' ');
      return text.textWidth;
    });
    return Math.max(...sizes);
  }

  /** Builds a graphical representation of this  */
  buildGraphics() {
    this.listItemProps.width = this.getContentWidth();

    this.gui.removeChildren();
    
    /* Menu */

    const menu = new PIXI.Graphics();
    const props = this.listItemProps;

    /* List Items */

    const worldPosition = new Point(menu);

    this.menu.listItems.forEach( (item, idx) => {
      const palette = (item.disabled)
        ? this.palette.button.disabled
        : (idx === this.menu.selectedIndex)
        ? this.palette.button.selected
        : this.palette.button.unselected;

      const g = new PIXI.Graphics();
      const content = props.contentBox();
      const fill = props.borderInnerBox();
      const border = props.borderOuterBox();
      const element = props.containerBox();

      // Position
      g.position.set(
        worldPosition.x,
        worldPosition.y + props.elementHeight*idx
      );

      // Background
      g.beginFill(palette.background);
      g.drawRect(element.x, element.y, element.width, element.height);
      g.endFill();

      // Button Fill
      g.beginFill(palette.primary);
      g.drawRect(fill.x, fill.y, fill.width, fill.height);
      g.endFill();

      // Shadowed Border
      g.beginFill(palette.dark, .50);
      g.drawRect(border.x, border.y + border.height, border.width, -props.border.bottom);
      g.drawRect(border.x + border.width, border.y, -props.border.right, border.height);
      g.endFill();

      // Lit Border
      g.beginFill(palette.light, .25);
      g.drawRect(border.x, border.y, props.border.left, border.height);
      g.beginFill(palette.light, .50);
      g.drawRect(border.x, border.y, border.width, props.border.top);
      g.endFill();

      // Text   // TODO Make this overridable
      const { key } = this.menu.listItems[idx];
      const gText = new PIXI.BitmapText(key, fonts.menu);
      if (item.disabled)
        gText.tint = 0x888888;
      gText.position.set(content.x + content.width*.5, content.y + 1);
      gText.anchor.set(.5, 0);

      // Combine
      g.addChild(gText);
      menu.addChild(g);
    });

    /* Cursor */

    // TODO Extract this to a thing. Just build all frames at once. Set play speed, etc.

    const time = (Game.frameCount % 45);
    const shrink = (time < 3) ? 1 : (time < 6) ? 2 : (time < 9) ? 1 : 0;

    const border = props.borderOuterBox();
    const cursor = new PIXI.Graphics();
    const wpad = 3 - shrink;
    const hpad = 1 - shrink;
    const size = 2;

    cursor.beginFill(this.palette.selector);
    cursor.drawRect(border.x - wpad - size, border.y - hpad - size, border.width + 2*wpad + 2*size, border.height + 2*hpad + 2*size);
    cursor.endFill();

    cursor.beginHole();
    cursor.drawRect(border.x - wpad, border.y - hpad, border.width + 2*wpad, border.height + 2*hpad);
    cursor.endHole();

    cursor.position.set(
      worldPosition.x,
      worldPosition.y + props.elementHeight * this.menu.selectedIndex
    );

    menu.addChild(cursor);

    // Final
    this.gui.addChild(menu);
  }
}