import { Game } from "../../../..";
import { Common } from "../../../CommonUtils";
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
  }

  close() {
    const { map, mapCursor } = this.assets;
    mapCursor.removeListener(this.changeCursorMode, this);

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
      console.log( map.generateMapData(players.all) )
    }

    // Find and execute 1 triggerable control script
    for (const controlScript of controls) {
      if (controlScript.trigger(gamepad)) {
        controlScript.run(this.assets, this);
        break;
      }
    }
  }

}

type ControlTriggerScript = {
  trigger: (gp: VirtualGamepad) => boolean;
  run(assets: BattleSceneControllers, state: DevMapEditor): void;
}

/** List of scripts for each player control. */
const controls = <ControlTriggerScript[]>[
  { // Place terrain
    trigger: (gp) => gp.button.A.pressed,
    run(assets, state) {
      const { map, mapCursor, players } = assets;
      const { brushMode, brushFaction, terrainBrush, troopBrush } = state;

      if (brushMode === 'terrain') {
        map.changeTile(mapCursor.boardLocation, terrainBrush);
        map.squareAt(mapCursor.boardLocation).terrain.faction = brushFaction;
      }

      else if (state.brushMode === 'troop') {
        const player = players.all.find( p => p.faction === brushFaction );
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
    trigger: (gp) => gp.button.B.pressed,
    run(assets, state) {
      const { map, mapCursor } = assets;
      const square = map.squareAt(mapCursor.boardLocation);
      
      if (state.brushMode === 'terrain') {
        state.terrainBrush = square.terrain.type;

        const terrFaction = square.terrain.faction;
        state.brushFaction = (terrFaction !== Faction.None && terrFaction !== Faction.Neutral)
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
    trigger: (gp) => gp.button.X.pressed,
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

      mapCursor.teleportTo(mapCursor.boardLocation);  // Retrigger UI
    }
  },
  { // Bucket-fill current terrain from location
    trigger: (gp) => gp.button.Y.pressed,
    run(assets, state) {
      // IMPLEMENT
    }
  },
  { // Switch to 'troop' mode / (open troop picker)
    trigger: (gp) => gp.button.leftBumper.pressed,
    run(assets, state) {
      state.brushMode = 'troop';
    }
  },
  { // Switch to 'terrain' mode / (open terrain picker)
    trigger: (gp) => gp.button.rightBumper.pressed,
    run(assets, state) {
      state.brushMode = 'terrain';
    }
  },
  { // Rotate brush faction
    trigger: (gp) => gp.button.select.pressed,
    run(assets, state) {
      // FIXME uhhh... bad implementation.
      state.brushFaction += 1;
      if (state.brushFaction > Faction.Black)
        state.brushFaction = Faction.Red;
    }
  },
  { // End design mode
    trigger: (gp) => gp.button.start.pressed,
    run(assets, state) {
      state.regress();
    }
  },
];