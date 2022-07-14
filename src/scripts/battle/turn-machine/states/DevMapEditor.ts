import { Game } from "../../../..";
import { Point } from "../../../Common/Point";
import { QueueSearch } from "../../../Common/QueueSearch";
import { Common } from "../../../CommonUtils";
import { Button } from "../../../controls/Button";
import { Keys } from "../../../controls/KeyboardObserver";
import { VirtualGamepad } from "../../../controls/VirtualGamepad";
import { Debug } from "../../../DebugUtils";
import { Faction } from "../../EnumTypes";
import { Terrain } from "../../map/Terrain";
import { TerrainType } from "../../map/TerrainObject";
import { Unit } from "../../Unit";
import { UnitType } from "../../UnitObject";
import { BattleSceneControllers } from "../BattleSceneControllers";
import { TurnState } from "../TurnState";


/** This exists for developer editing of the board state.
 * 
 * I don't know yet if this will become the official map editor or if I'll still need to
 * design a dedicated one. Really depends on how difficult it is to unwire certain components
 * like the TurnModerator for editing.
 * 
 * In either case, the map system as-is is too sophisticated not to use in the editor.
 */
export class DevMapEditor extends TurnState {
  get type() { return DevMapEditor; }
  get name() { return 'DevMapEditor'; }
  get revertible() { return true; }
  get skipOnUndo() { return false; }

  // Personal properties
  brushMode: 'terrain' | 'troop' = 'terrain';
  brushFaction: Faction = Faction.Neutral;
  terrainBrush: TerrainType = Terrain.Plain;
  troopBrush: UnitType = Unit.Infantry;

  private iRowString = [0,0];
  
  // Preserved properties
  private oldSightMap: boolean[][] = [];

  changeCursorMode() {
    const { map, mapCursor } = this.assets;

    if (this.brushMode === 'terrain') {
      const neighbors = map.neighboringTerrainAt(mapCursor.boardLocation);
      mapCursor.mode = (new this.terrainBrush().legalPlacement(neighbors)) ? 'point' : 'ban';
    }

    else if (this.brushMode === 'troop') {
      const square = map.squareAt(mapCursor.boardLocation);
      const placeable = square.terrain.getMovementCost(new this.troopBrush().moveType) > 0;
      mapCursor.mode = (placeable) ? 'point' : 'ban';
    }
  }

  onCursorMoveTrigger() {
    const { gamepad } = this.assets;
    for (const script of controlScripts) {
      if (script.onCursorTriggerEval(gamepad)) {
        script.run(this.assets, this);
        break;
      }
    }
  }

  paintTile(toPaint: Point) {
    const { map, players } = this.assets;
    const { brushMode, brushFaction, terrainBrush, troopBrush } = this;

    const square = map.squareAt(toPaint);

    if (brushMode === 'terrain') {
      map.changeTile(toPaint, terrainBrush);
      if (square.terrain.building)
        square.terrain.faction = brushFaction;
        // FIXME map.softChangeTile() uses square.flag to keep track of what's been touched
        // However, this triggers a UI rebuild for graphics which don't necessarily exist (cities)
        // square.displayInfoSet() needs to distinguish between typical settings and tmp values.
    }

    else if (brushMode === 'troop') {
      // FIXME I need some kind of Faction slider
      const troopFaction = (brushFaction >= Faction.Red) ? brushFaction : Faction.Red;
      const player = players.all.find( p => p.faction === troopFaction );
      const troopMayOccupy = (square.terrain.getMovementCost(new troopBrush().moveType) > 0)
      if (player && troopMayOccupy) {
        square.unit?.destroy();
        player.spawnUnit({
          location: toPaint,
          serial: troopBrush.serial,
        });
      }
    }
  }

  configureScene() {
    const { map, mapCursor, camera, scripts } = this.assets;

    // UI that shows you which terrain/troop you're painting with.
    // Also shows you button prompts for place/bucket-fill/remove/copy/troops/terrains

    // Reveal UI systems
    mapCursor.show();

    // Save the sight-map state / reveal all map tiles
    this.oldSightMap = Common.Array2D(map.width, map.height, false);
    for (const s of map.squares) {
      if (s.terrain.type === Terrain.Void)
        continue;
      const { x, y } = s.boardLocation;
      this.oldSightMap[x][y] = s.hiddenFlag;
    }

    map.squares.forEach( s => s.hiddenFlag = false );

    // TODO Unset troops icons? Like CoBoardable

    // Configure camera to follow cursor
    camera.focalTarget = this.assets.mapCursor;

    // Activate control scripts
    scripts.stagePointerInterface.enable();

    // Configure map cursor to update pointer graphic under certain circumstances
    mapCursor.on('move', this.changeCursorMode, this);
    mapCursor.teleportTo(mapCursor.boardLocation);  // Trigger cursor mode.

    mapCursor.on('move', this.onCursorMoveTrigger, this);
  }

  close() {
    const { map, mapCursor } = this.assets;
    const { current: player } = this.assets.players;

    mapCursor.removeListenerContext(this);
    
    // Restore old sight map
    for (let x = 0; x < map.width; x++)
    for (let y = 0; y < map.height; y++) {
      map.squareAt({x,y}).hiddenFlag = this.oldSightMap[x][y];
    }
    
    // Reveal-only sight map for any new structures added during design mode
    // TODO This code is adapted from the ResetPerspective turnstate; combine them maybe.
    player.scanCapturedProperties();

    for (const point of player.capturePoints)
      map.revealSightMapLocation(point, player);
    
    for (const troop of player.units)
      map.revealSightMapLocation(troop.boardLocation, player, troop);

    map.squares
      .filter( s => s.terrain.type === Terrain.Fire )
      .forEach( s => map.revealSightMapLocation(s.boardLocation, player) );
  }

  update() {
    const { gamepad, map, players } = this.assets;
    const { stagePointerInterface: pointer } = this.assets.scripts;

    // Temporary dev controls for changing the serial to select brushes with
    const iRows = [Keys.iRow0, Keys.iRow1, Keys.iRow2, Keys.iRow3, Keys.iRow4, Keys.iRow5, Keys.iRow6, Keys.iRow7, Keys.iRow8, Keys.iRow9];
    const numpad = [Keys.Numpad0, Keys.Numpad1, Keys.Numpad2, Keys.Numpad3, Keys.Numpad4, Keys.Numpad5, Keys.Numpad6, Keys.Numpad7, Keys.Numpad8, Keys.Numpad9]

    // TODO Give devcontroller a function which asks if a 'digit' was pressed
    let digit = iRows.findIndex( key => Game.devController.pressed(key));
    if (digit === -1)
      digit = numpad.findIndex( key => Game.devController.pressed(key));

    if (digit !== -1) {
      this.iRowString.push(digit);
      if (this.iRowString.length > 2)
        this.iRowString.shift();

      // Update active brush
      const serial = this.iRowString[0] * 10 + this.iRowString[1];
      
      const terrain = Object.values(Terrain).find( t => t.serial === serial );
      if (terrain)
        this.terrainBrush = terrain;

      const troop = Object.values(Unit).find( u => u.serial === serial );
      if (troop)
        this.troopBrush = troop;

      this.changeCursorMode();
    }

    // Permenant dev control for posting current map data to the console
    if (Game.devController.pressed(Keys.Period)) {
      players.all.forEach( p => p.scanCapturedProperties() );
      console.log( map.generateMapDataString(players.all) );
    }

    // Permenant dev control for posting serial IDs to the console ('cause I don't have the pickers yet)
    if (Game.devController.pressed(Keys.ForwardSlash)) {
      let loglines: string[] = [];

      if (this.brushMode === 'terrain')
        loglines = Object.values(Terrain).map( t => `${t.serial.toString().padStart(2, '0')} ${t.name}` );

      if (this.brushMode === 'troop')
        loglines = Object.values(Unit).map( u => `${u.serial.toString().padStart(2, '0')} ${u.name}` );

      loglines.unshift(`brush: '${this.brushMode}'`);
      console.log(loglines.join('\n'));
    }

    // Find and execute 1 triggerable control script
    for (const controlScript of controlScripts) {
      if (controlScript.triggerEval(gamepad)) {
        controlScript.run(this.assets, this);
        break;
      }
    }
  }

}

type ControlTriggerScript = {
  triggerEval: (gp: VirtualGamepad) => boolean;
  onCursorTriggerEval: (gp: VirtualGamepad) => boolean;
  run(assets: BattleSceneControllers, state: DevMapEditor): void;
}

const defaultScriptProperties = {
  triggerEval: () => false,
  onCursorTriggerEval: () => false,
};

/** List of scripts for each player control. */
const controlScripts = Common.implementsType<ControlTriggerScript[]>() ([
  { // Bucket-fill current terrain from location
    ...defaultScriptProperties,
    triggerEval: (gp) => gp.button.rightTrigger.down && gp.button.A.pressed,
    run(assets, state) {
      if (state.brushMode !== 'terrain')
        return; // painting troops seems dangerous and not very useful. maybe.

      const { map, mapCursor } = assets;
      map.bucketFill(mapCursor.boardLocation, state.terrainBrush);
    }
  },
  { // Place terrain
    ...defaultScriptProperties,
    triggerEval: (gp) => gp.button.A.pressed,
    onCursorTriggerEval: (gp) => gp.button.A.down,
    run(assets, state) {
      const { map, mapCursor } = assets;
      state.paintTile(mapCursor.boardLocation);
    }
  },
  { // Copy terrain underneath
    ...defaultScriptProperties,
    triggerEval: (gp) => gp.button.B.pressed,
    run(assets, state) {
      const { map, mapCursor } = assets;
      const square = map.squareAt(mapCursor.boardLocation);
      
      if (state.brushMode === 'terrain') {
        state.terrainBrush = square.terrain.type;

        const terrFaction = square.terrain.faction;
        state.brushFaction = (terrFaction !== Faction.None)
          ? terrFaction
          : state.brushFaction;
      }

      else if (state.brushMode === 'troop' && square.unit) {
        state.troopBrush = square.unit.type;
        state.brushFaction = square.unit.faction;
      }
    }
  },
  { // Remove special terrain / troops
    ...defaultScriptProperties,
    triggerEval: (gp) => gp.button.X.pressed,
    onCursorTriggerEval: (gp) => gp.button.X.down,
    run(assets, state) {
      const { map, mapCursor } = assets;

      const square = map.squareAt(mapCursor.boardLocation);

      if (state.brushMode === 'terrain') {
        const terrain = (square.terrain.landTile) ? Terrain.Plain : Terrain.Sea;
        map.changeTile(mapCursor.boardLocation, terrain);
      }

      else if (state.brushMode === 'troop') {
        square.unit?.destroy();
      }

      state.changeCursorMode(); // I forget why this is even needed, but eh
    }
  },
  { // Switch to 'troop' mode / (open troop picker)
    ...defaultScriptProperties,
    triggerEval: (gp) => gp.button.leftBumper.pressed,
    run(assets, state) {
      state.brushMode = 'troop';
      state.brushFaction = (state.brushFaction < Faction.Red) ? Faction.Red : state.brushFaction;
    }
  },
  { // Switch to 'terrain' mode / (open terrain picker)
    ...defaultScriptProperties,
    triggerEval: (gp) => gp.button.rightBumper.pressed,
    run(assets, state) {
      state.brushMode = 'terrain';
    }
  },
  { // Rotate brush faction
    ...defaultScriptProperties,
    triggerEval: (gp) => gp.button.select.pressed,
    run(assets, state) {
      // FIXME uhhh... bad implementation.
      state.brushFaction += 1;
      if (state.brushFaction > Faction.Black)
        state.brushFaction = (state.brushMode === 'terrain')
          ? Faction.Neutral
          : Faction.Red;
    }
  },
  { // End design mode
    ...defaultScriptProperties,
    triggerEval: (gp) => gp.button.start.pressed,
    run(assets, state) {
      state.regress();
    }
  },
]);
