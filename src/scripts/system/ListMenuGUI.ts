import { fonts } from "../battle/ui-windows/DisplayInfo";
import { BoxContainerProperties } from "../Common/BoxContainerProperties";
import { Slider } from "../Common/Slider";
import { Color } from "../CommonUtils";
import { Pulsar } from "../timer/Pulsar";
import { ListMenu } from "./ListMenu";

// Color palette definition
const { HSV } = Color;
const PALETTE = {
  selector:   HSV(166, 100, 80),
    background: HSV(196, 28, 23),
    button: {
        unselected: {
            primary:  HSV(214, 18, 35),
            light:    HSV(220, 16, 50),
            lightest: HSV(195, 12, 60),
            dark:     HSV(188, 11, 15),
        },
        selected: {
            primary: HSV(170, 64, 28),
            light:   HSV(165, 34, 60),
            dark:    HSV(184, 35, 10),
        },
    },
}

// Menu element property defaults
const LIST_ITEM_PROPS = new BoxContainerProperties({
  minWidth: 40,
  height: fonts.menu.fontSize + 1,
  margin: { top: .5, bottom: .5, },
  border: { left: 1, right: 1, top: 1, bottom: 1, },
  padding: { left: 1, right: 1, },
});
const MENU_PROPS = new BoxContainerProperties({
  padding: { left: 2, right: 2, top: 1.5, bottom: 1.5, },
  children: [
    LIST_ITEM_PROPS,
  ],
});

/** A generic GUI represention for a ListMenu.
 * Basic menu component. Can or should be overridden to 
 * implement new visual styles.
 * */
export class ListMenuGUI<X, Y> {

  static readonly CursorSettings = {
    animFrames: 3,
    interval: 45,
  }

  /** Reference to the menu object which controls this GUI. */
  readonly menu: ListMenu<X, Y>;

  /** Reference to this menu's pseudo-css properties. */
  private configuration: {
    listItemProps: BoxContainerProperties,
    menuProps: BoxContainerProperties,
  };

  /** The top-level graphical object for this GUI menu. */
  private readonly gui = new PIXI.Container();

  /** Pulsar which triggers cursor animation. */
  private animPulsar = new Pulsar(
    ListMenuGUI.CursorSettings.interval,
    () => {},
    this
  );

  /** Slider which determines cursor position when traveling
   * between menu options. */
  private cursorMovementSlider = new Slider({
    granularity: 1 / ListMenuGUI.CursorSettings.animFrames,
  });

  constructor(menu: ListMenu<X, Y>, container: PIXI.Container, options?: {listItemProps?: BoxContainerProperties, menuProps?: BoxContainerProperties}) {
    this.configuration = {
      listItemProps: LIST_ITEM_PROPS,
      menuProps: MENU_PROPS,
    }

    // Well. It's nominally correct now.
    
    // TODO BoxProperties assumes a value of 0 or all properties undeclared in
    // its options object, which breaks merge() entirely; every single property
    // is 'defined' so every single property get overwritten. With 0.

    this.menu = menu;
    this.menu.cursorMovementCallback = () => {
      this.buildGraphics();
    }

    this.buildGraphics();
    container.addChild(this.gui);

    this.animPulsar.start();
  }

  /** Unlinks this object's circular references and removes it from higher scope structures. */
  destroy() {
    this.gui.destroy({children: true});
    this.animPulsar.destroy();
    this.menu.cursorMovementCallback = function() {};
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

  /** Returns the longest pixel-width needed by this menu's displayed list items. */
  getContentWidth(): number {
    const { listItems } = this.menu;
    if (listItems.length === 0)
      return this.configuration.menuProps.minWidth;

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
    this.configuration.listItemProps.width = this.getContentWidth();
    this.configuration.menuProps.children =
      new Array(this.menu.listItems.length)
      .fill(this.configuration.listItemProps);

    this.gui.removeChildren();
    
    /* Menu */

    const menu = new PIXI.Graphics();
    const { menuProps, listItemProps } = this.configuration;

    menu.beginFill(PALETTE.background);
    menu.drawRect(0, 0, menuProps.elementWidth, menuProps.elementHeight);
    menu.endFill();

    /* List Items */

    const menuContentBox = menuProps.contentBox();

    this.menu.listItems.forEach( (item, idx) => {
      const palette = (idx === this.menu.selectedIndex && !item.disabled)
        ? PALETTE.button.selected
        : PALETTE.button.unselected;

      const g = new PIXI.Graphics();
      const content = listItemProps.contentBox();
      const background = listItemProps.borderInnerBox();
      const border = listItemProps.borderOuterBox();

      // Position
      g.position.set(
        menuContentBox.x,
        menuContentBox.y + listItemProps.elementHeight*idx
      );

      // Background
      g.beginFill(palette.primary);
      g.drawRect(background.x, background.y, background.width, background.height);
      g.endFill();

      // Lit Border
      g.beginFill(palette.light);
      g.drawRect(border.x, border.y, border.width, listItemProps.border.top);
      g.drawRect(border.x, border.y, listItemProps.border.left, border.height);
      g.endFill();

      // Shadowed Border
      g.beginFill(palette.dark);
      g.drawRect(border.x, border.y + border.height, border.width, -listItemProps.border.bottom);
      g.drawRect(border.x + border.width, border.y, -listItemProps.border.right, border.height);
      g.endFill();

      // Text   // TODO Make this overridable
      const { key } = this.menu.listItems[idx];
      const gText = new PIXI.BitmapText(key, fonts.menu);
      if (item.disabled)
        gText.tint = 0x888888;
      gText.position.set(content.x + content.width*.5, content.y);
      gText.anchor.set(.5, 0);

      // Combine
      g.addChild(gText);
      menu.addChild(g);
    });

    /* Cursor */

    const border = listItemProps.borderOuterBox();
    const cursor = new PIXI.Graphics();
    const size = 1;

    cursor.beginFill(PALETTE.selector);
    cursor.drawRect(border.x - 2*size, border.y - 2*size, border.width + 4*size, border.height + 4*size);
    cursor.endFill();

    cursor.beginHole();
    cursor.drawRect(border.x - size, border.y - size, border.width + 2*size, border.height + 2*size);
    cursor.endHole();

    cursor.position.set(
      menuContentBox.x,
      menuContentBox.y + listItemProps.elementHeight * this.menu.selectedIndex
    );

    menu.addChild(cursor);

    // Final
    this.gui.addChild(menu);
  }
}