import { PIXI } from "../../../constants";
import { Game } from "../../..";
import { fonts } from "../../battle/ui-windows/DisplayInfo";
import { Color } from "../../color/Color";
import { Palette } from "../../color/ColorPalette";
import { BoxContainerProperties } from "../../Common/BoxContainerProperties";
import { Point } from "../../Common/Point";
import { Slider } from "../../Common/Slider";
import { Common } from "../../CommonUtils";
import { ClickableContainer } from "../../controls/MouseInputWrapper";
import { ListMenu } from "./ListMenu";
import { ListMenuOption } from "./ListMenuOption";
import { IconTitle } from "./ListMenuTitleTypes";
import { MenuCursor } from "./MenuCursor";
import { PageSelector } from "./PageSelector";

// This is 'done' but I'm scared.
// TODO It's broken.

/** A generic GUI represention for a ListMenu.
 * Basic menu component. Can or should be overridden to 
 * implement new visual styles.
 * */
export class CommandMenuGUI<Y> {

  static readonly CursorSettings = {
    animFrames: 3,
    interval: 45,
  }

  /** The cursor graphic which visually selects over the menu. */
  protected cursorGraphic: MenuCursor;

  /** A list of all list-item textures; textures for each state. */
  protected stateTextures?: {
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
      background: Palette.gale_force1,
      primary:    Palette.gale_force2,
      light:      Palette.cloudless,
      dark:       Palette.black,
    },
    selected: {
      background: Palette.gale_force1,
      primary:    Palette.terrestrial,
      light:      Palette.black,          // Light and dark are switched on purpose
      dark:       Palette.blister_pearl,  // to achieve a depressed effect.
    },
    disabled: {
      background: Palette.carbon2,
      primary:    Palette.carbon3,
      light:      Palette.black,
      dark:       Palette.cerebral_grey2,
    },
  }

  /** Controls the menu's opacity. */
  private fadeInSlider = new Slider({
    granularity: 1 / 2,
    shape: v => Math.sqrt(v),
  });

  /** Listeners for click interactions. */
  readonly menuPointer: ClickableContainer<PIXI.Container>;

  /** Graphical indicator and controls for menu page. */
  readonly pagesBar = new PageSelector();

  /** Returns the index of the menu item the pointer is currently hovering over.
   * Returns undefined if the pointer position cannot be resolved to a list item. */
  getPointerSelection() {
    const itemHeight = this.listItemProps.elementHeight;

    const pointerY = this.menuPointer.pointerLocation().y;
    const idx = Math.floor(pointerY / itemHeight);

    return (Common.validIndex(idx, this.menu.pageItems.length)) ? idx : undefined;
  }

  /** Reference to the menu object which controls this GUI. */
  readonly menu: ListMenu<IconTitle, Y>;

  /** The top-level graphical object for this GUI menu. */
  protected readonly gui = new PIXI.Container();
  protected readonly menuGui = new PIXI.Container();


  constructor(menu: ListMenu<IconTitle, Y>, container: PIXI.Container, options?: {listItemProps?: BoxContainerProperties}) {

    this.menu = menu;
    this.menu.on('move-cursor', this.onCursorMove, this);
    this.menu.on('change-page', this.onPageChange, this);

    container.addChild(this.gui);
    this.gui.addChild(
      this.menuGui,
      this.pagesBar.container
    );
    this.cursorGraphic = new MenuCursor(this.gui);

    this.buildTextures();
    this.buildListItems();
    this.onFirstBuild();

    this.gui.zIndex = 1000;

    this.menuPointer = new ClickableContainer(this.gui);

    // TODO *Sigh* I need something more formalized. This is very hacky.
    // This whole class is hacky.
    this.pagesBar.leftButton.triggerIndicatorLight =
      () => this.menu.gamepad.button.dpadLeft.down;
    this.pagesBar.rightButton.triggerIndicatorLight =
      () => this.menu.gamepad.button.dpadRight.down;

    Game.scene.ticker.add(this.update, this);
  }

  /** Unlinks this object's circular references and removes it from higher scope structures. */
  destroy() {
    this.menuPointer.destroy();
    this.gui.destroy({children: true});
    this.menu.destroy();
    this.pagesBar.destroy();
    this.cursorGraphic.destroy();
    if (this.stateTextures)
      Object.values(this.stateTextures).forEach( t => t.destroy() );
    Game.scene.ticker.remove(this.update, this);
  }

  private update() {
    this.fadeInSlider.increment();
    this.gui.alpha = this.fadeInSlider.output;

    if (this.menuPointer.pointerMoved && this.menuPointer.pointerOver) {
      const pointerIdx = this.getPointerSelection();
      if (pointerIdx !== undefined && this.menu.selectedIndex !== pointerIdx)
        this.menu.setCursor(pointerIdx);
    }

    // TODO Um.  Yeah, these need *such* a refactor.
    if (this.pagesBar.leftButton.pointer.clicked())
      this.menu.setCursor(
        this.menu.selectedIndex,
        this.menu.pageIndex - 1,
      )
    else if (this.pagesBar.rightButton.pointer.clicked())
    this.menu.setCursor(
      this.menu.selectedIndex,
      this.menu.pageIndex + 1,
    )
  }

  /** Reveals this menu's graphics and enables player input. */
  show() {
    this.fadeInSlider.incrementFactor = 1;
    this.menu.enableInput();
    this.menuPointer.enabled = true;
    this.cursorGraphic.skipMotion();
  }

  /** Hides this menu's graphics and disables player input. */
  hide() {
    this.fadeInSlider.incrementFactor = -1;
    this.menu.disableInput();
    this.menuPointer.enabled = false;
  }

  /** Changes the GUI coordinate location so that its top-left corner is p. */
  setPosition(p: Point, origin = Point.Normals.TopLeft) {
    // TODO The UI refactor base components should have pos and origin settings, standard stuff
    // They'll make use of the master Pixi.Container's pivot
    // This impl. requires us to redefine the origin every time we move the menu.
    this.gui.pivot.set(
      this.graphicalWidth * origin.x,
      this.graphicalHeight * origin.y
    );
    this.gui.position.set(p.x, p.y);
  }

  /** Returns this GUI's graphical width. */
  get graphicalWidth() {
    return this.gui.width;
  }

  /** Returns this GUI's graphical height. */
  get graphicalHeight() {
    return this.gui.height;
  }

  /** Whether this menu is invisible and uninteractable. */
  get hidden() {
    return (!this.gui.visible);
  }

  /** Sets a new list of menu options, and rebuilds the GUI's graphics. */
  setListItems(li: ListMenuOption<IconTitle,Y>[]) {
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

  /** Function to call by the constructor to move the cursor into place */
  protected onFirstBuild() {
    this.updateFrames();
    this.onCursorMove();
    this.cursorGraphic.skipMotion();
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
    const sizes = listItems.map( item => {
      const { icon, title } = item.key;
      text.text = title;
      const iconWidth = (icon && icon.width > 0) ? icon.width + 2 : 0;
      return text.textWidth + iconWidth;
    });
    return Math.max(...sizes, this.listItemProps.minWidth);
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
      return Game.renderer.generateTexture(g, {
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
    const { menu, listItemProps: props } = this;

    const content = props.contentBox();
    const element = props.containerBox();

    // Reset menu gui
    this.menuGui.children.forEach( g => g.destroy() );
    this.menuGui.removeChildren();

    // Build a sprite for each element
    menu.pageItems.forEach( (item, idx) => {
      // Button body
      const spr = new PIXI.Sprite();
      spr.position.y = element.height * idx;

      // Build text
      const { key } = item;
      const { icon, title } = key;
      if (icon) icon.position.set(content.x, 0);
      const gText = new PIXI.BitmapText(title, fonts.menu);
      const iconWidth = (icon) ? icon.width + 2 : 0;
      gText.position.set(content.x + iconWidth + (content.width - iconWidth)*.5, content.y + 1);
      gText.anchor.set(.5, 0);

      // Combine
      if (icon) spr.addChild(icon);
      spr.addChild(gText);
      this.menuGui.addChild(spr);
    });

    // Extend incomplete page with blank options.
    if (menu.totalPages > 1) {
      for (let i = menu.pageItems.length; i < menu.pageLength; i++) {
        const spr = new PIXI.Sprite(this.stateTextures?.disabled);
        spr.position.y = element.height * i;
        this.menuGui.addChild(spr);
      }
    }

    // TODO Clean up
    this.pagesBar.build(menu.totalPages, menu.pageIndex, element.width);
    this.pagesBar.container.position.set(
      element.width/2 - this.pagesBar.container.width/2,
      element.height*menu.pageLength + 3,
    );
  }

  /** Updates each list item with relevant state textures. */
  updateFrames() {
    const textures = this.stateTextures;
    const objects = this.menuGui.children as PIXI.Sprite[];

    // In case textures were never built for some reason, just abandon
    if (!textures)
      return;

    this.menu.pageItems.forEach( (item, idx) => {
      if (idx >= objects.length)
        return; // Skip
        
      const object = objects[idx];
      object.texture = (item.disabled)
        ? textures.disabled
        : (this.menu.selectedOption === item)
        ? textures.selected
        : textures.enabled;

      const objectBackground = object.children[0] as PIXI.Sprite;
      objectBackground.tint = (item.disabled) ? 0x888888 : 0xFFFFFF;
    });
  }

}