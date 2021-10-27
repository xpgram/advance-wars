import { TerrainWindow } from "./TerrainWindow";
import { Game } from "../../..";
import { UnitWindow } from "./UnitWindow";
import { COWindow } from "./COWindow";
import { VirtualGamepad } from "../../controls/VirtualGamepad";
import { MapCursor } from "../map/MapCursor";
import { Camera } from "../../Camera";
import { Square } from "../map/Square";
import { Map } from "../map/Map";
import { Terrain } from "../map/Terrain";
import { TerrainDetailWindow } from "./TerrainDetailWindow";
import { Slider } from "../../Common/Slider";
import { UnitClass } from "../EnumTypes";
import { StringDictionary } from "../../CommonTypes";
import { TurnModerator } from "../TurnModerator";

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

  commandersSlider = new Slider({
    granularity: 0.2,
  });

  playerInfo: {idealOrder: COWindow[], windows: COWindow[]} = {
    idealOrder: [],
    windows: [],
  }

  windows = {
    detailedTerrainInfo: new TerrainDetailWindow({...WindowSettings.DefaultHide, verticalDistance: 1}),
    unitInfo: new UnitWindow({...WindowSettings.AlwaysShow, verticalDistance: 142}),
    terrainInfo: new TerrainWindow({...WindowSettings.AlwaysShow, verticalDistance: 167}),
  }

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

    // Apply mask to screen-wipeable ui elements
    const mask = this.windows.detailedTerrainInfo.mask;

    this.windows.unitInfo.displayContainer.mask = mask;
    this.playerInfo.windows.forEach( window => window.displayContainer.mask = mask );  

    // Add independent updater to ticker
    Game.scene.ticker.add(this.update, this);

    // First update window text elements
    this.inspectListenerCallback();
  }

  /** Helper which sets all window visibility to the given boolean. */
  private setWindowVisibility(b: boolean) {
    Object.values(this.windows).forEach( window => {
      window.displayContainer.visible = b;
    });
    this.playerInfo.windows.forEach( window => {
      window.displayContainer.visible = b;
    });
  }

  /** Hides the window-system's graphics from the screen. */
  hide(): void {
    this.setWindowVisibility(false);
  }

  /** Reveals the window-system's graphics on the screen. */
  show(): void {
    this.setWindowVisibility(true);
  }

  update() {
    // Set the window side flag — This block displaces the
    // trigger lines depending on which side the windows are already on.
    const tileSize = Game.display.standardLength;
    const offsetFromCenter = (this.windows.terrainInfo.showOnLeftSide) ? -3 : 2;
    const triggerLine = Math.floor(this.camera.center.x / tileSize) + offsetFromCenter;

    // Set show flags
    const showDetailWindow = (this.gamepad.button.leftTrigger.down);
    const showCOwindows = (this.gamepad.button.leftBumper.down);
    const showWindowsOnLeft = (this.cursor.pos.x > triggerLine);
    
    // Tell each window which side to be on.
    // It isn't possible to set this to one window the rest are children of, is it?
    Object.values(this.windows).forEach( window => {
      window.showOnLeftSide = showWindowsOnLeft;
    });
    this.playerInfo.windows.forEach( window => {
      window.showOnLeftSide = showWindowsOnLeft;
    });

    // Show the detail window
    this.windows.detailedTerrainInfo.show = showDetailWindow;

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
        this.inspectTile(this.map.squareAt(this.cursor.pos));
        return true;
      }
    }, this);
  }

  inspectTile(square: Square) {
    this.windows.terrainInfo.inspectTerrain(square.terrain);
    this.windows.detailedTerrainInfo.inspectTerrain(square.terrain);

    this.windows.unitInfo.displayContainer.visible = Boolean(square.unit);
    this.windows.unitInfo.inspectUnit(square.unit);
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
    Object.values(this.windows).forEach( window => window.positionWindow({skip: true}) );
    this.playerInfo.windows.forEach( window => window.positionWindow({skip: true}) );
    //commanderSlider
  }
}