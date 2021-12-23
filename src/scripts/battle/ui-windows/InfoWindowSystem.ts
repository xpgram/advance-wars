import { TerrainWindow } from "./TerrainWindow";
import { Game } from "../../..";
import { UnitWindow } from "./UnitWindow";
import { COWindow } from "./COWindow";
import { VirtualGamepad } from "../../controls/VirtualGamepad";
import { MapCursor } from "../map/MapCursor";
import { Square } from "../map/Square";
import { Map } from "../map/Map";
import { DetailedInfoWindow } from "./DetailedInfoWindow";
import { Slider } from "../../Common/Slider";
import { TurnModerator } from "../TurnModerator";
import { BattleForecast } from "../DamageScript";
import { UnitObject } from "../UnitObject";
import { Camera } from "../../camera/Camera";

type InfoWindowSystemSettings = {
  gamepad: VirtualGamepad,
  cursor: MapCursor,
  camera: Camera,
  map: Map,
  players: TurnModerator,
}

/** Container for common info-window settings. */
const WindowSettings = function() {
  const width = 88, height = 24;
  return {
    AlwaysShow: {
      width,
      height,
    },
    DefaultHide: {
      width,
      height,
      show: false,
    },
    DrawerHide: {
      width,
      height,
      show: false,
      stickOutDistance: 2,  // Kind of distracting, actually. I may wwant to just leave a button tab beneath the first one.
    }
  }
}();

/** // TODO finish writing this class; I only ever completed the working draft. */
export class InfoWindowSystem {

  gamepad: VirtualGamepad;
  cursor: MapCursor;
  camera: Camera;
  map: Map;
  players: TurnModerator;

  /**  */
  get battleForecast() { return this._battleForecast; }
  set battleForecast(b) {
    this._battleForecast = b;
    this.windows.unitInfo.setDamageForecast(b?.damage, b?.counter);
  }
  private _battleForecast?: BattleForecast;

  commandersSlider = new Slider({
    granularity: 0.2,
  });

  playerInfo: {idealOrder: COWindow[], windows: COWindow[]} = {
    idealOrder: [],
    windows: [],
  }

  windows = {
    detailedInfo: new DetailedInfoWindow({...WindowSettings.DefaultHide, verticalDistance: 1}),
    unitInfo: new UnitWindow({...WindowSettings.AlwaysShow, verticalDistance: 142}),
    terrainInfo: new TerrainWindow({...WindowSettings.AlwaysShow, verticalDistance: 167}),
  }

  /** Whether the details window should be on-screen regardless of reveal-button state. */
  forceOpenDetailWindow = false;

  /** Which side of the screen the window system should appear on. */
  screenSide: 'left' | 'right' | 'auto' = 'auto';

  /** Last known setting of the visiblity of the entire window system. */
  private _visible = false;


  constructor(settings: InfoWindowSystemSettings) {
    this.gamepad = settings.gamepad;
    this.cursor = settings.cursor;
    this.camera = settings.camera;
    this.map = settings.map;
    this.players = settings.players;
    this.players.all.forEach( (player, idx) => {
      const window = new COWindow(WindowSettings.DrawerHide, player, idx);
      this.playerInfo.idealOrder.push(window);
    });
    this.playerInfo.windows = this.playerInfo.idealOrder;
    this.updatePlayerWindowOrder(); // This sets y position

    // Give windows references to input object
    this.windows.detailedInfo.gamepad = this.gamepad;

    // Apply mask to screen-wipeable ui elements
    const mask = this.windows.detailedInfo.mask;

    this.windows.unitInfo.displayContainer.mask = mask;
    this.playerInfo.windows.forEach( window => window.displayContainer.mask = mask );  

    // Add independent updater to ticker
    Game.scene.ticker.add(this.update, this);

    // First update window text elements
    this.inspectListenerCallback();
  }

  destroy() {
    // FIXME Destruction not implemented
    this.windows.detailedInfo.destroy();
  }

  resetSettings() {
    this.screenSide = 'auto';
    this.forceOpenDetailWindow = false;
  }

  /** Returns a list of all known SlidingWindows from all window categories. */
  private get allWindows() {
    return [...Object.values(this.windows), ...this.playerInfo.windows];
  }

  /** Helper which sets all window visibility to the given boolean. */
  private setWindowVisibility(b: boolean) {
    this.allWindows.forEach( window => {
      b ? window.setVisible() : window.setInvisible();
    });
  }

  /** Hides the window-system's graphics from the screen. */
  hide(): void {
    this._visible = false;
    this.setWindowVisibility(false);
  }

  /** Reveals the window-system's graphics on the screen. */
  show(): void {
    this._visible = true;
    this.setWindowVisibility(true);
  }

  /** Reaffirms window visibility settings; useful after inspect update. */
  retriggerWindowVisibility() {
    this.setWindowVisibility(this._visible);
  }

  update() {
    // Set the window side flag — This block displaces the
    // trigger lines depending on which side the windows are already on.
    const tileSize = Game.display.standardLength;
    const offsetFromCenter = (this.windows.terrainInfo.showOnLeftSide) ? -3 : 2;

    const view = this.camera.transform.worldRect();
    const triggerLine = Math.floor(view.center.x / tileSize) + offsetFromCenter;

    // Set show flags
    const showDetailWindow = (this.gamepad.button.rightTrigger.down);
    const showCOwindows = (this.gamepad.button.leftTrigger.down);

    const autoLeftSide = (this.cursor.boardLocation.x > triggerLine);
    const showWindowsOnLeft =
      (this.screenSide === 'auto')
      ? autoLeftSide
      : (this.screenSide === 'left');
    
    // Tell each window which side to be on.
    // It isn't possible to set this to one window the rest are children of, is it?
    this.allWindows.forEach( window => {
      window.showOnLeftSide = showWindowsOnLeft;
    });

    // Show the detail window
    this.windows.detailedInfo.show = showDetailWindow || this.forceOpenDetailWindow;

    // Increment CO Window slider (staggers their reveal)
    this.commandersSlider.increment((showCOwindows) ? 1 : -1);
    this.playerInfo.windows.forEach( (window, idx) => {
      const triggerValues = [0.00, 0.10, 0.45, 1.0];
      window.show = (this.commandersSlider.output >= triggerValues[idx])
    });
  }

  /** Calls inspectTile on cursor position change. */
  inspectListenerCallback() {
    Game.workOrders.send(() => {
      if (this.windows.terrainInfo.refreshable) {
        this.inspectTile(this.map.squareAt(this.cursor.boardLocation));
        return true;
      }
    }, this);
  }

  inspectTile(square: Square, unit?: UnitObject) {
    const inspectUnit =
      unit ||
      ((square.unit?.visibleToPlayer(this.players.perspective, square.neighbors))
        ? square.unit
        : undefined);
    this.windows.terrainInfo.inspectTerrain(square.terrain, inspectUnit);
    this.windows.unitInfo.inspectUnit(inspectUnit);
    this.windows.detailedInfo.inspectTile(square.terrain, inspectUnit);
    this.retriggerWindowVisibility();   // For UnitInfo, basically
  }

  /** Updates player info window metrics. */
  inspectPlayers() {
    this.playerInfo.windows.forEach( window => {
      window.inspectKnownPlayer();
    });
  }

  /** Updates player info window order. */
  updatePlayerWindowOrder() {
    // Reorder player windows.
    const curIdx = this.players.all.findIndex( player => player === this.players.current );
    this.playerInfo.windows = [
      ...this.playerInfo.idealOrder.slice(curIdx),
      ...this.playerInfo.idealOrder.slice(0, curIdx),
    ];

    // Set window positions
    this.playerInfo.windows.forEach( (window, idx) => {
      const yPos = (idx === 0) ? 1 : 33 + 30*(idx - 1);
      window.displayContainer.y = yPos;
    });
  }

  /** Positions the window UI where it moving to instantly. */
  skipAnimations() {
    this.update();  // Get new positions, etc.
    this.inspectTile(this.map.squareAt(this.cursor.boardLocation));
    this.allWindows.forEach( window => window.positionWindow({skip: true}) );
  }

}