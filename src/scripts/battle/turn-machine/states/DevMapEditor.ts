import { Game } from "../../../..";
import { Common } from "../../../CommonUtils";
import { Button } from "../../../controls/Button";
import { Keys } from "../../../controls/KeyboardObserver";
import { VirtualGamepad } from "../../../controls/VirtualGamepad";
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
  brushFaction: Faction = Faction.Red;
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
      const placeable = square.traversable(new this.troopBrush());
      mapCursor.mode = (placeable) ? 'point' : 'ban';
    }
  }

  onCursorMoveTrigger() {
    const { gamepad } = this.assets;
    for (const script of onCursorMoveControls) {
      if (script.getButton(gamepad).down) {
        script.run(this.assets, this);
        break;
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
    mapCursor.removeListenerContext(this);

    // Restore old sight map
    for (let x = 0; x < map.width; x++)
    for (let y = 0; y < map.height; y++) {
      map.squareAt({x,y}).hiddenFlag = this.oldSightMap[x][y];
    }
  }

  update() {
    const { gamepad, map, players } = this.assets;
    const { stagePointerInterface: pointer } = this.assets.scripts;

    // Temporary dev controls for changing the serial to select brushes with
    const iRows = [Keys.iRow0, Keys.iRow1, Keys.iRow2, Keys.iRow3, Keys.iRow4, Keys.iRow5, Keys.iRow6, Keys.iRow7, Keys.iRow8, Keys.iRow9];
    const iRowNum = iRows.findIndex( key => Game.devController.pressed(key));
    if (iRowNum !== -1) {
      this.iRowString.push(iRowNum);
      if (this.iRowString.length > 2)
        this.iRowString.shift();
    }

    // Temporary dev control for selecting brush based on last 2 iRow presses
    if (Game.devController.pressed(Keys.Q)) {
      const serial = this.iRowString[0] * 10 + this.iRowString[1];
      
      const terrain = Object.values(Terrain).find( t => t.serial === serial );
      if (terrain)
        this.terrainBrush = terrain;

      const troop = Object.values(Unit).find( u => u.serial === serial );
      if (troop)
        this.troopBrush = troop;
    }

    // Permenant dev control for posting current map data to the console
    if (Game.devController.pressed(Keys.Period)) {
      players.all.forEach( p => p.scanCapturedProperties() );
      console.log( map.generateMapDataString(players.all) );
    }

    // Find and execute 1 triggerable control script
    for (const controlScript of onPressControls) {
      if (controlScript.getButton(gamepad).pressed) {
        controlScript.run(this.assets, this);
        break;
      }
    }
  }

}

type ControlTriggerScript = {
  onCursorMove?: boolean;
  getButton: (gp: VirtualGamepad) => Button;
  run(assets: BattleSceneControllers, state: DevMapEditor): void;
}

/** List of scripts for each player control. */
const onPressControls = <ControlTriggerScript[]>[
  { // Place terrain
    onCursorMove: true,
    getButton: (gp) => gp.button.A,
    run(assets, state) {
      const { map, mapCursor, players } = assets;
      const { brushMode, brushFaction, terrainBrush, troopBrush } = state;

      if (brushMode === 'terrain') {
        map.changeTile(mapCursor.boardLocation, terrainBrush);
        const square = map.squareAt(mapCursor.boardLocation);
        if (square.terrain.building)
          square.terrain.faction = brushFaction;
      }

      else if (state.brushMode === 'troop') {
        // FIXME I need some kind of Faction slider
        const troopFaction = (brushFaction >= Faction.Red) ? brushFaction : Faction.Red;
        const player = players.all.find( p => p.faction === troopFaction );
        if (player) {
          player.spawnUnit({
            location: mapCursor.boardLocation,
            serial: troopBrush.serial,
          });
        }
      }
    }
  },
  { // Copy terrain underneath
    getButton: (gp) => gp.button.B,
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
    onCursorMove: true,
    getButton: (gp) => gp.button.X,
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

      // mapCursor.teleportTo(mapCursor.boardLocation);  // Retrigger UI
      // TODO I /need/ a retrigger cursor/etc. UI method that does not invoke movement. Mega dangerous.
    }
  },
  { // Bucket-fill current terrain from location
    getButton: (gp) => gp.button.Y,
    run(assets, state) {
      // IMPLEMENT
    }
  },
  { // Switch to 'troop' mode / (open troop picker)
    getButton: (gp) => gp.button.leftBumper,
    run(assets, state) {
      state.brushMode = 'troop';
      state.brushFaction = (state.brushFaction < Faction.Red) ? Faction.Red : state.brushFaction;
    }
  },
  { // Switch to 'terrain' mode / (open terrain picker)
    getButton: (gp) => gp.button.rightBumper,
    run(assets, state) {
      state.brushMode = 'terrain';
    }
  },
  { // Rotate brush faction
    getButton: (gp) => gp.button.select,
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
    getButton: (gp) => gp.button.start,
    run(assets, state) {
      state.regress();
    }
  },
];

/** List of control scripts that execute when the button is held down and the cursor moves. */
const onCursorMoveControls = onPressControls.filter( script => script.onCursorMove );