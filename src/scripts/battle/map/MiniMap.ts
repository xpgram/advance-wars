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
import { ClickableContainer } from "../../controls/MouseInputWrapper";
import { Timer } from "../../timer/Timer";
import { Ease } from "../../Common/EaseMethod";
import { fonts } from "../ui-windows/DisplayInfo";
import { Color } from "../../color/Color";


const DOMAIN = "Minimap";

/**  */
export class MiniMap {

  // TODO I need to unify the map-integrated and standalone preview versions of this map feature.
  // The map-integrated one is the offical one, fyi.
  //
  // TODO Actually, Map.ts should have a serialization feature that produces a MapData object.
  // That way, this object could *always* depend only on MapData, making it very portable.
  // I'll do this today, probably.

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

  private readonly map: Map;
  private readonly camera: Camera;

  readonly clickController: ClickableContainer<PIXI.Container>;

  /** Global container for all visual elements. */
  readonly container = new PIXI.Container();

  /** Container for terrain icons. */
  private readonly iconContainer = new PIXI.Container();
  private terrainIcons: {fog: boolean, spr: PIXI.Sprite}[] = [];

  /** Container for troop icons. */
  private readonly troopIconContainer = new PIXI.Container();

  /** Graphics object for the camera rect. */
  private readonly cameraRect = new PIXI.Graphics();

  /** Text container for the current view mode. */
  private readonly viewModeText = new PIXI.BitmapText('', fonts.smallScriptOutlined);

  /** Stack for any currently active animation tween-timers. */
  private animationTimers: Timer[] = [];

  /** Pixel width of the map, sans any decorations. */
  get mapWidth() { return this.iconContainer.width; }

  /** Pixel height of the map, sans any decorations. */
  get mapHeight() { return this.iconContainer.height; }

  /** How bright (or transparent) the fog-of-war effect is. Treated as a 0–1 lightness value
   * where 1.0 is completely invisible and 0.0 is completely dark. */
  get fogLightness() { return this._fogOfWarOpacity; }
  set fogLightness(n) {
    this._fogOfWarOpacity = n;

    const value = 100*n;
    const color = Color.HSV(0,0,value);

    for (const icon of this.terrainIcons)
      if (icon.fog)
        icon.spr.tint = color;
  }
  private _fogOfWarOpacity = 1;


  constructor(map: Map, camera: Camera) {
    this.map = map;
    this.camera = camera;
    this.clickController = new ClickableContainer(this.iconContainer);

    this.rebuildContents();
    this.container.addChild(this.iconContainer, this.troopIconContainer, this.cameraRect, this.viewModeText);
    this.container.addChildAt(MiniMap.BuildBackground(this.iconContainer), 0);
    Game.scene.ticker.add(this.update, this);
  }

  destroy() {
    //@ts-ignore
    this.map = undefined;
    //@ts-ignore
    this.camera = undefined;
    this.clickController.destroy();
    this.container.destroy({children: true});
    this.animationTimers.forEach( t => t.destroy() );
    Game.scene.ticker.remove(this.update, this);
  }

  private update() {
    if (this.container.visible === true)
      this.rebuildCameraRect();
  }

  rebuildContents() {
    this.iconContainer.removeChildren().forEach( c => c.destroy() );
    this.troopIconContainer.removeChildren().forEach( c => c.destroy() );
    this.terrainIcons = [];
    
    for (let x = 0; x < this.map.width; x++)
    for (let y = 0; y < this.map.height; y++) {
      const square = this.map.squareAt(new Point(x,y));

      const terrIcon = square.terrain.getMinimapIcon();
      const unitIcon = square.unit?.getMinimapIcon();
      
      const size = terrIcon.width;
      const pos = new Point(x*size, y*size);

      terrIcon.position.set(pos.x, pos.y);
      this.iconContainer.addChild(terrIcon);
      this.terrainIcons.push({fog: square.hiddenFlag, spr: terrIcon});

      if (unitIcon && square.unit?.visible) {
        unitIcon.position.set(pos.x, pos.y);
        unitIcon.tint = (square.unit.spent) ? Palette.cerebral_grey1 : Palette.white;
        unitIcon.stop();  // Suspend default animation
        this.troopIconContainer.addChild(unitIcon);
      }
    }
    
    this.rebuildCameraRect();
    this.troopMode = 'blink';
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

  /** Sets the troop-icon visibility mode. */
  get troopMode(): typeof this._troopMode { return this._troopMode; }
  set troopMode(mode) {
    this._troopMode = mode;
    this.animationTimers.forEach( t => t.destroy() );
    this.animationTimers = [];

    const transtime = .65;
    const tickingEase = Ease.quart.inOut;
    const directEase = Ease.quart.out;

    const fogBright = .7;
    const fogMid = .65;
    const fogDark = .45;

    let viewModeString = '';

    const mode_ops = {
      'blink': () => {
        viewModeString = "Map";
        this.animationTimers.push(
          // Oscillating troop icons
          Timer
            .tween(transtime, this.troopIconContainer, {alpha: 1}, tickingEase)
            .at('end')
            .tween(transtime, this.troopIconContainer, {alpha: .35}, tickingEase)
            .loop(),
          // Move fog transparency
          Timer
            .tween<MiniMap>(transtime, this, {fogLightness: fogBright}, directEase),
          // Heartbeat tween for fog
          Timer
            .wait(transtime * 8)
            .tween<MiniMap>(.125, this, {fogLightness: fogMid}, tickingEase)
            .wait()
            .tween<MiniMap>(.125, this, {fogLightness: fogBright}, tickingEase)
            .wait()
            .tween<MiniMap>(.125, this, {fogLightness: fogMid}, tickingEase)
            .wait()
            .tween<MiniMap>(.125, this, {fogLightness: fogBright}, tickingEase)
            .loop(),
        );
      },
      'on': () => {
        viewModeString = "Troop";
        this.animationTimers.push(
          // Move fog and troop transparency
          Timer
            .tween(transtime, this.troopIconContainer, {alpha: 1}, directEase)
            .tween<MiniMap>(transtime/3, this, {fogLightness: fogDark})
        );
      },
      'off': () => {
        viewModeString = "Terrain";
        this.animationTimers.push(
          // Move fog and troop transparency
          Timer
            .tween(transtime, this.troopIconContainer, {alpha: 0}, directEase)
            .tween<MiniMap>(transtime, this, {fogLightness: 1.0}, directEase)
        );
      },
    };
    mode_ops[mode]();

    // Reconfigure view-mode string
    this.viewModeText.text = `X ${viewModeString} View`;
    this.viewModeText.anchor.set(1,1);
    this.viewModeText.position.set(this.iconContainer.width - 3, -1);
  }
  private _troopMode: 'blink' | 'on' | 'off' = 'blink';

}
