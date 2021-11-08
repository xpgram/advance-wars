import { Game } from "../..";
import { fonts } from "../battle/ui-windows/DisplayInfo";
import { BoxContainerProperties } from "../Common/BoxContainerProperties";
import { Point } from "../Common/Point";
import { CommandMenuGUI } from "./CommandMenuGUI";
import { ShopItemTitle } from "./ListMenuTitleTypes";

export class UnitShopMenuGUI<Y> extends CommandMenuGUI<ShopItemTitle, Y> {

  readonly listItemProps = new BoxContainerProperties({
    minWidth: 144,
    height: fonts.menu.fontSize + 2,
    margin: { left: 3, right: 3, top: 1, bottom: 1 },
    border: { left: 1, right: 1, top: 1, bottom: 1, },
    padding: { left: 2, right: 2 },
  });

  // A lot of wiring I need to do...
  // BattleScene needs to build it correctly
  // FactoryMenu needs to reference this instead of cmd
  // And that might be it, actually.
  // BattleScene also needs to give this the right UI layer.

  buildGraphics() {

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
      const { icon, title, cost } = key;
      const gText = new PIXI.BitmapText(title, fonts.menu);
      const gCost = new PIXI.BitmapText(cost.toString(), fonts.menu);
      if (item.disabled) {
        icon.tint = 0x888888;
        gText.tint = 0x888888;
      }
      icon.position.set(content.x, content.y + 1);
      gText.position.set(icon.x + 18, content.y + 1);
      gCost.position.set(content.x + content.width - gCost.width, content.y);

      // Combine
      g.addChild(icon, gText, gCost);
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