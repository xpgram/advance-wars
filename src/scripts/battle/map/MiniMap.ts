import { PIXI } from "../../../constants";
import { Palette } from "../../color/ColorPalette";
import { Map } from "./Map";
import { Point } from "pixi.js";
import { MapData } from "../../../battle-maps/MapData";
import { Game } from "../../..";
import { Terrain } from "./Terrain";
import { Debug } from "../../DebugUtils";
import { Unit } from "../Unit";
import { Camera } from "../../camera/Camera";
import { Common } from "../../CommonUtils";


const DOMAIN = "Minimap";

/**  */
// TODO It also needs reference to camera to draw the view border.
export class MiniMap {

  /** Returns a standalone minimap visual-container disconnected from the other game components
   * typically featured as properties of this class. */
  static BuildPreview(data: MapData): PIXI.Container {
    const container = new PIXI.Container();

    for (let x = 0; x < data.size.width; x++)
    for (let y = 0; y < data.size.height; y++) {
      const serial = data.map[y][x];
      const type = Object.values(Terrain).find( t => t.serial === serial);

      if (!type) {
        Debug.log(DOMAIN, "BuildPreview", { message: `Terrain type matching serial '${serial}' doesn't exist.` });
        continue;
      }

      const terrain = new type();
      const owner = data.owners.find( o => new Point(x,y).equals(o.location));
      if (owner)
        terrain.faction = owner.player;
      const icon = terrain.getMinimapIcon();
      icon.position.set(x*icon.width, y*icon.height);
      container.addChild(icon);
    }

    for (const unit of data.predeploy) {
      const tmpTroop = new Unit.Infantry();
      tmpTroop.faction = unit.player;
      const icon = tmpTroop.getMinimapIcon();
      container.addChild(icon);
      tmpTroop.destroy();
    }

    container.addChildAt(MiniMap.BuildBackground(container), 0);

    return container;
  }

  /** Returns a Graphics object describing a bordered background for the given
   * container object. */
  private static BuildBackground(container: PIXI.Container): PIXI.Graphics {
    const hBorder = 3;
    const vBorder = 1;

    const g = new PIXI.Graphics();
    g.beginFill(Palette.gale_force2);
    g.drawRect(
      -hBorder,
      -vBorder,
      container.width + hBorder*2,
      container.height + vBorder*2,
    );
    g.endFill();

    return g;
  }

  private map: Map;
  private camera: Camera;

  container = new PIXI.Container();
  private iconContainer = new PIXI.Container();

  constructor(map: Map, camera: Camera) {
    this.map = map;
    this.camera = camera;
    this.rebuildContents();
    this.container.addChild(this.iconContainer);
    this.container.addChildAt(MiniMap.BuildBackground(this.container), 0);
  }

  destroy() {
    //@ts-ignore
    this.map = undefined;
    this.container.destroy({children: true});
  }

  rebuildContents() {
    this.iconContainer.removeChildren().forEach( c => c.destroy() );
    
    for (let x = 0; x < this.map.width; x++)
    for (let y = 0; y < this.map.height; y++) {
      const square = this.map.squareAt(new Point(x,y));

      const terrIcon = square.terrain.getMinimapIcon();
      const unitIcon = square.unit?.getMinimapIcon();
      
      const size = terrIcon.width;
      const pos = new Point(x*size, y*size);

      terrIcon.position.set(pos.x, pos.y);
      this.iconContainer.addChild(terrIcon);

      if (unitIcon) {
        unitIcon.position.set(pos.x, pos.y);
        this.iconContainer.addChild(unitIcon);
      }
    }

    // Construct camera rectangle
    const cam = this.camera.transform.worldRect()
      .apply( n => n/16*4 );

    cam.x = Common.clamp(cam.x, 0, this.iconContainer.width);
    cam.y = Common.clamp(cam.y, 0, this.iconContainer.height);
    cam.width = Common.clamp(cam.x + cam.width, 0, this.iconContainer.width) - cam.x;
    cam.height = Common.clamp(cam.y + cam.height, 0, this.iconContainer.height) - cam.y;

    const g = new PIXI.Graphics();
    g.lineStyle({width: 1, color: Palette.pelati});
    g.drawRect(cam.x, cam.y, cam.width, cam.height);
    this.iconContainer.addChild(g);
  }

  show() {
    this.container.visible = true;
  }

  hide() {
    this.container.visible = false;
  }

}