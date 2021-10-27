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
    detailedInfo: new TerrainDetailWindow({...WindowSettings.DefaultHide, verticalDistance: 1}),
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
    const mask = this.windows.detailedInfo.mask;

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
    this.windows.detailedInfo.show = showDetailWindow;

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
    // TODO terrainInfo.inspectTerrain(terrain)
    // TODO unitInfo.inspectUnit(unit)
    // etc.
    // This class should not be responsible for all this shit.

    // Terrain Window
    this.terrainInfo.setName(square.terrain.name);
    this.terrainInfo.setThumbnail(square.terrain.preview);
    this.terrainInfo.setDefenseMeter(square.terrain.defenseRating);
    if (square.terrain.building)
      this.terrainInfo.setCaptureMeter(20);
    else if (square.terrain.type == Terrain.Meteor)
      this.terrainInfo.setHPMeter(99);
    else
      this.terrainInfo.hideCaptureMeter();

    // Unit Window
    if (square.unit) {
      this.unitInfo.displayContainer.visible = true;

      this.unitInfo.setThumbnail(square.unit.preview);
      this.unitInfo.setName(square.unit.name);
      this.unitInfo.setHPMeterValue(square.unit.displayHP);
      this.unitInfo.setGasMeterValue(square.unit.gas);
      if (square.unit.materialsInsteadOfAmmo)
        this.unitInfo.setMaterialMeterValue(square.unit.ammo);
      else
        this.unitInfo.setAmmoMeterValue(square.unit.ammo, square.unit.maxAmmo);
      // TODO Show the materials meter instead if the unit is an APC. (Any others?)
      this.unitInfo.setFirstLoadUnit(null);
      this.unitInfo.setSecondLoadUnit(null);
      // this.unitInfo.setFirstLoadUnit(square.unit.loaded.first);
      // this.unitInfo.setSecondLoadUnit(square.unit.loaded.second);
      // TODO loaded.first should return null if no units are loaded.
    }
    else {
      this.unitInfo.displayContainer.visible = false;
    }

    // Detailed Terrain Window
    this.detailedInfo.setHeaderText(square.terrain.name);
    this.detailedInfo.setIllustration(square.terrain.landscape);
    this.detailedInfo.setDescriptionText(square.terrain.description);
    this.detailedInfo.setIncomeValue((square.terrain.generatesIncome) ? 1000 : 0);
    this.detailedInfo.setRepType(
      square.terrain.repairType == UnitClass.Ground,
      square.terrain.repairType == UnitClass.Naval,
      square.terrain.repairType == UnitClass.Air,
    );

    this.detailedInfo.setInfantryMoveCost(square.terrain.movementCost.infantry);
    this.detailedInfo.setMechMoveCost(square.terrain.movementCost.mech);
    this.detailedInfo.setTireAMoveCost(square.terrain.movementCost.tireA);
    this.detailedInfo.setTireBMoveCost(square.terrain.movementCost.tireB);
    this.detailedInfo.setTreadMoveCost(square.terrain.movementCost.tread);
    this.detailedInfo.setAirMoveCost(square.terrain.movementCost.air);
    this.detailedInfo.setShipMoveCost(square.terrain.movementCost.ship);
    this.detailedInfo.setTransportMoveCost(square.terrain.movementCost.transport);
    // TODO Why not define MoveCostMatrix as a type and pass that into the window? Let the f*in' window do this.
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
    this.playerInfo.windows.forEach( window => window.positionWindow({skip: true}) );
  }
}