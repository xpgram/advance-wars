import { Game } from "../../..";
import { fonts } from "../../battle/ui-windows/DisplayInfo";
import { BoxContainerProperties } from "../../Common/BoxContainerProperties";
import { Slider } from "../../Common/Slider";
import { Color } from "../../CommonUtils";
import { ListMenu } from "./ListMenu";
import { ListMenuOption } from "./ListMenuOption";
import { MenuCursor } from "./MenuCursor";

// This is 'done' but I'm scared.
// TODO It's broken.

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

  /** The cursor graphic which visually selects over the menu. */
  protected cursorGraphic: MenuCursor;

  /** A list of all list-item textures; textures for each state. */
  protected stateTextures!: {
    enabled: PIXI.Texture,
    disabled: PIXI.Texture,
    selected: PIXI.Texture,
  };

  /** Reference to this menu's pseudo-css properties. */
  readonly listItemProps = new BoxContainerProperties({
    minWidth: 40,
    height: fonts.menu.fontSize + 2,
    margin: { left: 3, right: 3, top: 1, bottom: 1 },
    border: { left: 1, right: 1, top: 1, bottom: 1, },
    padding: { left: 2, right: 2 },
  });

  readonly palette = {
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
  }

  /** Controls the menu's opacity. */
  private fadeInSlider = new Slider({
    granularity: 1 / 3,
    shape: v => Math.sqrt(v),
  });

  /** Reference to the menu object which controls this GUI. */
  readonly menu: ListMenu<X, Y>;

  /** The top-level graphical object for this GUI menu. */
  protected readonly gui = new PIXI.Container();
  protected readonly menuGui = new PIXI.Container();


  constructor(menu: ListMenu<X, Y>, container: PIXI.Container, options?: {listItemProps?: BoxContainerProperties}) {

    this.menu = menu;
    this.menu.on('move-cursor', this.onCursorMove, this);
    this.menu.on('change-page', this.onPageChange, this);

    container.addChild(this.gui);
    this.gui.addChild(this.menuGui);
    this.cursorGraphic = new MenuCursor(this.gui);

    this.buildTextures();
    this.buildListItems();

    Game.scene.ticker.add(this.update, this);
  }

  /** Unlinks this object's circular references and removes it from higher scope structures. */
  destroy() {
    this.gui.destroy({children: true});
    this.menu.destroy();
    this.cursorGraphic.destroy();
    Object.values(this.stateTextures).forEach( t => t.destroy() );
    Game.scene.ticker.remove(this.update, this);
  }

  private update() {
    this.fadeInSlider.increment();
    this.gui.alpha = this.fadeInSlider.output;
  }

  /** Reveals this menu's graphics and enables player input. */
  show() {
    this.fadeInSlider.incrementFactor = 1;
    this.menu.enableInput();
    this.cursorGraphic.skipMotion();
  }

  /** Hides this menu's graphics and disables player input. */
  hide() {
    this.fadeInSlider.incrementFactor = -1;
    this.menu.disableInput();
  }

  /** Whether this menu is invisible and uninteractable. */
  get hidden() {
    return (!this.gui.visible);
  }

  /** Sets a new list of menu options, and rebuilds the GUI's graphics. */
  setListItems(li: ListMenuOption<X,Y>[]) {
    this.menu.setListItems(li);
    this.buildTextures();
    this.buildListItems();
    this.updateFrames();
    this.cursorGraphic.skipMotion();
  }

  /** Function to call every time the menu's cursor changes position. */
  protected onCursorMove() {
    this.updateFrames();
    const element = this.listItemProps.containerBox();
    this.cursorGraphic.rect = new PIXI.Rectangle(
      element.x,
      element.height * this.menu.selectedIndex,
      element.width,
      element.height
    );
  }

  /** Function to call every time the menu's page changes. */
  protected onPageChange() {
    this.buildListItems();
    this.updateFrames();
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

  /** Draws the button textures for each possible button state. */
  private buildTextures() {
    const { palette, stateTextures, listItemProps: props } = this;

    type buttonPalette = typeof palette.unselected; // TODO ? Why not officially declare it?
    props.width = this.getContentWidth();
    
    function build(palette: buttonPalette): PIXI.Texture {
      const g = new PIXI.Graphics();

      const fill = props.borderInnerBox();
      const border = props.borderOuterBox();
      const element = props.containerBox();

      // Background
      g.beginFill(palette.background);
      g.drawRect(element.x, element.y, element.width, element.height);

      // Button fill
      g.beginFill(palette.primary);
      g.drawRect(fill.x, fill.y, fill.width, fill.height);

      // Shadowed Border
      g.beginFill(palette.dark, .50);
      g.drawRect(border.x, border.y + border.height, border.width, -props.border.bottom);
      g.drawRect(border.x + border.width, border.y, -props.border.right, border.height);

      // Lit border
      g.beginFill(palette.light, .25);
      g.drawRect(border.x, border.y, props.border.left, border.height);
      g.drawRect(border.x, border.y, border.width, props.border.top);

      g.endFill();

      // Save texture
      return Game.app.renderer.generateTexture(g, {
        scaleMode: PIXI.SCALE_MODES.NEAREST
      });
    }
    
    if (stateTextures)
      Object.values(stateTextures).forEach( t => t.destroy() );
    this.stateTextures = {
      enabled: build(palette.unselected),
      disabled: build(palette.disabled),
      selected: build(palette.selected),
    };
  }

  /** Builds the list of list-item graphics objects. */
  buildListItems() {
    const { menu, stateTextures, listItemProps: props } = this;

    const content = props.contentBox();
    const element = props.containerBox();

    // Reset menu gui
    this.menuGui.children.forEach( g => g.destroy() );
    this.menuGui.removeChildren();

    // Build a sprite for each element
    menu.listItems.forEach( (item, idx) => {
      // Button body
      const spr = new PIXI.Sprite();
      spr.position.y = element.height * idx;

      // Build text
      const { key } = item;
      const title = new PIXI.BitmapText(key, fonts.menu);
      title.position.set(content.x + content.width*.5, content.y + 1);
      title.anchor.set(.5, 0);

      // Combine
      spr.addChild(title);
      this.menuGui.addChild(spr);
    });
  }

  /** Updates each list item with relevant state textures. */
  updateFrames() {
    const textures = this.stateTextures;
    const objects = this.menuGui.children;

    this.menu.listItems.forEach( (item, idx) => {
      if (idx >= objects.length)
        return; // Skip 
      const object = objects[idx];
      object.texture = (item.disabled)
        ? textures.disabled
        : (this.menu.selectedOption === item)
        ? textures.selected
        : textures.enabled;
      object.children[0].tint = (item.disabled) ? 0x888888 : 0xFFFFFF;
    });
  }

}