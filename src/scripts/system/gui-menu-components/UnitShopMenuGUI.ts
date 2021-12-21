import { Game } from "../../..";
import { fonts } from "../../battle/ui-windows/DisplayInfo";
import { BoxContainerProperties } from "../../Common/BoxContainerProperties";
import { Color } from "../../CommonUtils";
import { CommandMenuGUI } from "./CommandMenuGUI";

const { HSV } = Color;

export class UnitShopMenuGUI<Y> extends CommandMenuGUI<Y> {

  readonly listItemProps = new BoxContainerProperties({
    minWidth: 16*7,
    height: 16,
    margin: { left: 3, right: 3 },
    border: { left: 1, right: 1, bottom: 1, },
    padding: { left: 2, right: 2 },
  });

  readonly palette = {
    background: HSV(200, 30, 30),
    primary:    HSV(215, 25, 35),
    light:      HSV(220, 15,100),
    dark:       HSV(190, 10,  0),
  }

  /** How thick in pixels the top and bottom margins of the menu are. */
  capHeight = 2;
  /** How thick in pixels the top and bottom bezels of the menu are. */
  capBezel = 1;

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

  protected onCursorMove() {
    const { listItemProps: props, capHeight } = this;

    this.updateFrames();

    const element = props.containerBox();
    this.cursorGraphic.rect = new PIXI.Rectangle(
      element.x,
      element.height * this.menu.selectedIndex + capHeight,
      element.width,
      element.height,
    );
  }

  private buildTextures() {
    const { palette, listItemProps: props, capHeight, capBezel } = this;

    if (this.stateTextures)
      Object.values(this.stateTextures).forEach( t => t.destroy() );

    const content = props.contentBox();
    const fill = props.borderOuterBox();
    const element = props.containerBox();

    const g = new PIXI.Graphics();

    // Background
    g.beginFill(palette.background);
    g.drawRect(element.x, element.y, element.width, element.height);
    g.beginFill(palette.dark, 0.35);
    g.drawRect(element.x, element.y, element.width, element.height);

    // Button Fill
    g.beginFill(palette.primary);
    g.drawRect(fill.x, element.y, fill.width, element.height);

    // Underline
    g.beginFill(palette.dark, .35);
    g.drawRect(content.x, content.y + content.height, content.width, -props.border.bottom);

    g.endFill();

    // Generate texture
    const item = Game.app.renderer
      .generateTexture(g, {
        scaleMode: PIXI.SCALE_MODES.NEAREST
      });


    // Top Cap
    g.clear();
    g.beginFill(palette.background);
    g.drawRect(element.x, element.y, element.width, capHeight);
    g.beginFill(palette.dark, 0.35);
    g.drawRect(element.x, element.y, element.width, capHeight);
    g.beginFill(palette.primary);
    g.drawRect(fill.x, element.y + capBezel, fill.width, capHeight - capBezel);

    // Generate texture
    const topCap = Game.app.renderer
      .generateTexture(g, {
        scaleMode: PIXI.SCALE_MODES.NEAREST
      });

    // Bottom Cap
    g.clear();
    g.beginFill(palette.background);
    g.drawRect(element.x, element.y, element.width, capHeight);
    g.beginFill(palette.dark, 0.35);
    g.drawRect(element.x, element.y, element.width, capHeight);
    g.beginFill(palette.primary);
    g.drawRect(fill.x, element.y, fill.width, capHeight - capBezel);

    // Generate texture
    const bottomCap = Game.app.renderer
      .generateTexture(g, {
        scaleMode: PIXI.SCALE_MODES.NEAREST
      });

    // Save textures
    this.stateTextures = {
      item,
      topCap,
      bottomCap
    }
  }

  buildListItems() {
    const { menu, stateTextures: textures, listItemProps: props, capHeight } = this;

    const content = props.contentBox();
    const element = props.containerBox();

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

      icon.position.set(content.x + 2, content.y);

      const gText = new PIXI.BitmapText(title, fonts.list);
      gText.position.set(content.x + 23, content.y + 0.6*content.height);
      gText.anchor.set(0,.5);

      const gCost = new PIXI.BitmapText(cost.toString(), fonts.list);
      gCost.position.set(content.x + content.width - gCost.width, content.y + 0.6*content.height);
      gCost.anchor.set(0,.5);

      // Combine
      spr.addChild(icon, gText, gCost);
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
      const object = objects[idx] as PIXI.Sprite;
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

}