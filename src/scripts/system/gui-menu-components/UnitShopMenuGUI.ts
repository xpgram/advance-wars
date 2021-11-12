import { Game } from "../../..";
import { fonts } from "../../battle/ui-windows/DisplayInfo";
import { BoxContainerProperties } from "../../Common/BoxContainerProperties";
import { Point } from "../../Common/Point";
import { Color } from "../../CommonUtils";
import { CommandMenuGUI } from "./CommandMenuGUI";
import { ListMenuOption } from "./ListMenuOption";
import { ShopItemTitle } from "./ListMenuTitleTypes";

const { HSV } = Color;

export class UnitShopMenuGUI<Y> extends CommandMenuGUI<ShopItemTitle, Y> {

  readonly listItemProps = new BoxContainerProperties({
    minWidth: 144,
    height: fonts.menu.fontSize + 2,
    margin: { left: 3, right: 3, top: 1 },
    border: { left: 1, right: 1, top: 1, bottom: 1, },
    padding: { left: 2, right: 2 },
  });

  readonly palette = {
    background: HSV(200, 30, 30),
    primary:    HSV(215, 25, 35),
    light:      HSV(220, 15,100),
    dark:       HSV(190, 10,  0),
  }

  // TODO Reconnect this with CommandMenu logic.
  // Override buildTextures, buildListItems, and updateFrames
  // buildTextures should also build a topCap and a bottomCap
  // top/bottom caps are included in buildListItems
  //   buildListItems could also include page indicators, too
  // updateFrames just changes text opacity, basically.

  protected stateTextures!: {
    item: PIXI.Texture,
    topCap: PIXI.Texture,
    bottomCap: PIXI.Texture,
  }

  private buildTextures() {
    const { palette, listItemProps: props } = this;

    if (this.stateTextures)
      Object.values(this.stateTextures).forEach( t => t.destroy() );

    const content = props.contentBox();
    const fill = props.borderOuterBox();
    const element = props.containerBox();
    const capHeight = 3;

    const g = new PIXI.Graphics();

    // Background
    g.beginFill(palette.background);
    g.drawRect(element.x, element.y, element.width, element.height);
    g.beginFill(palette.dark, 0.50);
    g.drawRect(element.x, element.y, element.width, element.height);

    // Button Fill
    g.beginFill(palette.primary);
    g.drawRect(fill.x, element.y, fill.width, element.height);

    // Underline
    g.beginFill(palette.dark, .50);
    g.drawRect(content.x, content.y + content.height, content.width, -props.border.bottom);

    g.endFill();

    // Save texture
    this.stateTextures.item = Game.app.renderer
      .generateTexture(g, {
        scaleMode: PIXI.SCALE_MODES.NEAREST
      });


    // Top Cap
    g.clear();
    g.beginFill(palette.background);
    g.drawRect(element.x, element.y, element.width, capHeight);
    g.beginFill(palette.dark, 0.50);
    g.drawRect(element.x, element.y, element.width, capHeight);

    // Save texture
    const tex = Game.app.renderer
      .generateTexture(g, {
        scaleMode: PIXI.SCALE_MODES.NEAREST
      });
    this.stateTextures.topCap = tex;
    this.stateTextures.bottomCap = tex;
  }

  buildListItems() {
    const { menu, stateTextures: textures, listItemProps: props } = this;

    const content = props.contentBox();
    const element = props.containerBox();
    const capHeight = 3;

    // Reset menu gui
    this.menuGui.children.forEach( g => g.destroy() );
    this.menuGui.removeChildren();

    // Build a sprite for each element
    menu.listItems.forEach( (item, idx) => {
      // Button body
      const spr = new PIXI.Sprite(textures.item);
      spr.position.y = element.height * idx + capHeight;

      // Build text
      const { key } = item;
      const { icon, title, cost } = key;

      const gIcon = new PIXI.Sprite();
      gIcon.position.set(content.x, content.y + 1);

      const gText = new PIXI.BitmapText(title, fonts.list);
      gText.position.set(content.x + 18, content.y + 1);

      const gCost = new PIXI.BitmapText(cost.toString(), fonts.list);
      gCost.position.set(content.x + content.width - gCost.width, content.y);

      // Combine
      spr.addChild(gIcon, gText, gCost);
      this.menuGui.addChild(spr);
    })

    // Add the caps
    const top = new PIXI.Sprite(textures.topCap);
    const bottom = new PIXI.Sprite(textures.bottomCap);
    bottom.y = element.height * menu.listItems.length + capHeight;
    this.menuGui.addChild(top, bottom);
  }

  updateFrames() {
    const objects = this.menuGui.children;
    
    this.menu.listItems.forEach( (item, idx) => {
      if (idx >= objects.length)
        return;
      const object = objects[idx];
      if (item.disabled) {
        object.children[0].tint = 0x888888;
        object.children[1].alpha = 0.35;
        object.children[2].alpha = 0.35;
      } else {
        object.children[0].tint = 0xFFFFFF;
        object.children[1].alpha = 1;
        object.children[2].alpha = 1;
      }
    });
  }

  buildGraphics() {

    this.gui.removeChildren();
    
    /* Menu */

    const menu = new PIXI.Graphics();
    const props = this.listItemProps;

    /* List Items */

    const worldPosition = new Point(menu);

    this.menu.listItems.forEach( (item, idx) => {
      const { palette } = this;

      const g = new PIXI.Graphics();
      const content = props.contentBox();
      const fill = props.borderOuterBox();
      const element = props.containerBox();

      // Position
      g.position.set(
        worldPosition.x,
        worldPosition.y + props.elementHeight*idx
      );

      // Background
      g.beginFill(palette.background);
      g.drawRect(element.x, element.y, element.width, element.height);
      g.beginFill(palette.dark, 0.50);
      g.drawRect(element.x, element.y, element.width, element.height);
      g.endFill();

      // Button Fill
      g.beginFill(palette.primary);
      g.drawRect(fill.x, element.y, fill.width, element.height);
      g.endFill();

      // Underline
      g.beginFill(palette.dark, .50);
      g.drawRect(content.x, content.y + content.height, content.width, -props.border.bottom);
      g.endFill();

      // Combine
      menu.addChild(g);

      // Text   // TODO Make this overridable
      const { key } = this.menu.listItems[idx];
      const { icon, title, cost } = key;
      const gText = new PIXI.BitmapText(title, fonts.menu);
      const gCost = new PIXI.BitmapText(cost.toString(), fonts.menu);
      if (item.disabled) {
        icon.tint = 0x888888;
        gText.alpha = 0.35;
        gCost.alpha = 0.35;
      }
      icon.position.set(content.x, content.y + 1);
      gText.position.set(icon.x + 18, content.y + 1);
      gCost.position.set(content.x + content.width - gCost.width, content.y);

      // Combine
      g.addChild(icon, gText, gCost);
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