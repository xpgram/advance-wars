import { PIXI } from "../../../constants";
import { MapData } from "../../../battle-maps/MapData";
import { Game } from "../../..";
import { Terrain } from "./Terrain";
import { Debug } from "../../DebugUtils";
import { Palette } from "../../color/ColorPalette";


/**  */
// TODO Colors can't be updated mid match if this isn't linked to the map proper.
// TODO It also needs reference to camera to draw the view border.
export class MiniMap {

  container: PIXI.Container;

  constructor(data: MapData) {
    this.container = new PIXI.Container();
    const textures = Game.scene.texturesFrom("UISpritesheet");
    
    for (let x = 0; x < data.size.width; x++)
    for (let y = 0; y < data.size.height; y++) {
      const type = Object.values(Terrain).find( t => t.serial === data.map[y][x]);

      if (!type)
        continue;

      // TODO I think this needs to be handled by TerrainObject.
      // Some names are different, some objects are animations; too complicated.
      const tex = textures[`MiniMap/${new type().name.toLowerCase()}.png`];
      
      if (!tex) {
        Debug.warn(`MiniMap texture for terrain '${new type().name}' not found.`);
        continue;
      }

      const spr = new PIXI.Sprite(tex);
      const size = spr.width;
      spr.position.set(x*size, y*size);
      this.container.addChild(spr);
    }

    const hBorder = 3;
    const vBorder = 1;

    const g = new PIXI.Graphics();
    g.beginFill(Palette.gale_force2);
    g.drawRect(
      -hBorder,
      -vBorder,
      this.container.width + hBorder*2,
      this.container.height + vBorder*2,
    );
    g.endFill();
    this.container.addChildAt(g, 0);
  }

  show() {
    this.container.visible = true;
  }

  hide() {
    this.container.visible = false;
  }

}