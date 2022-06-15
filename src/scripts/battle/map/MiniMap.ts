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
  private cameraRect = new PIXI.Graphics();

  constructor(map: Map, camera: Camera) {
    this.map = map;
    this.camera = camera;
    this.rebuildContents();
    this.container.addChild(this.iconContainer, this.cameraRect);
    this.container.addChildAt(MiniMap.BuildBackground(this.container), 0);
    Game.scene.ticker.add(this.update, this);
  }

  destroy() {
    //@ts-ignore
    this.map = undefined;
    //@ts-ignore
    this.camera = undefined;
    this.container.destroy({children: true});
    Game.scene.ticker.remove(this.update, this);
  }

  private update() {
    if (this.container.visible === true)
      this.rebuildCameraRect();
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
      terrIcon.tint = (square.hiddenFlag) ? Palette.grey3 : Palette.white;
      this.iconContainer.addChild(terrIcon);

      if (unitIcon && square.unit?.visible) {
        unitIcon.position.set(pos.x, pos.y);
        this.iconContainer.addChild(unitIcon);
      }
    }

    this.rebuildCameraRect();
  }

  private rebuildCameraRect() {
    const { width, height } = this.iconContainer;
    
    const cam = this.camera
      .currentTransform()
      .worldRect()
      .apply( n => n/16*4 );

    const x = Common.clamp(cam.left,   0, width);
    const y = Common.clamp(cam.top,    0, height);
    const w = Common.clamp(cam.right,  0, width)  - x;
    const h = Common.clamp(cam.bottom, 0, height) - y;

    const { cameraRect: g } = this;
    g.clear();
    g.lineStyle({
      width: 1,
      color: Palette.pelati
    });
    g.drawRect(x,y,w,h);
  }

  show() {
    this.container.visible = true;
  }

  hide() {
    this.container.visible = false;
  }

}