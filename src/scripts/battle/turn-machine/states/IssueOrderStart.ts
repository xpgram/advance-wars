import { Game } from "../../../.."
import { Keys } from "../../../controls/KeyboardObserver";
import { TurnState } from "../TurnState";
import { MoveUnit } from "./MoveUnit";
import { Point } from "../../../Common/Point";
import { ShowUnitAttackRange } from "./ShowUnitAttackRange";
import { MoveCamera } from "./MoveCamera";
import { FieldMenu } from "./FieldMenu";
import { FactoryMenu } from "./FactoryMenu";
import { RatifyIssuedOrder } from "./RatifyIssuedOrder";
import { BattleSceneControllers } from "../BattleSceneControllers";
import { ShowMinimap } from "./ShowMinimap";
import { Terrain } from "../../map/Terrain";
import { Common } from "../../../CommonUtils";
import { DevMapEditor } from "./DevMapEditor";
import { CommandInstruction } from "../CommandInstruction";

export class IssueOrderStart extends TurnState {
  get type() { return IssueOrderStart; }
  get name() { return 'IssueOrderStart'; }
  get revertible() { return true; }   // ← If each state is either auto-skipped on undo or must deliberately cancel
  get skipOnUndo() { return false; }  //   itself via a function call, I wonder if this property is even necessary.

  private cursorMovedByClick = false;

  changeCursorMode() {
    const { map, mapCursor, players, scenario } = this.assets;

    const tile = map.squareAt(mapCursor.boardLocation);
    const allied = tile.terrain.faction === players.current.faction;
    const empty = !tile.unit;

    const types = scenario.spawnMap.map( map => map.type );
    const spawnType = types.includes(tile.terrain.type);

    mapCursor.mode = (spawnType && allied && empty) ? 'build' : 'point';
  }

  configureScene() {
    const { map, mapCursor, uiSystem, camera, scripts, players, instruction, scenario } = this.assets;

    // Reveal UI systems
    mapCursor.show();
    uiSystem.show();

    // Update player metrics
    players.all.forEach(player => player.scanCapturedProperties());
    players.perspectivesTurn?.setCoBoardableIndicators();

    // Update player window metrics
    uiSystem.inspectPlayers();

    // Configure camera to follow cursor
    camera.focalTarget = this.assets.mapCursor;

    // Reset command instruction to new.
    this.assets.instruction = new CommandInstruction();

    // Activate control scripts.
    scripts.nextOrderableUnit.enable();
    scripts.stagePointerInterface.enable();
    scripts.stagePointerInterface.affirmOnPointerDrag = true;

    // Configure map cursor to update pointer graphic over certain terrains
    mapCursor.on('move', this.changeCursorMode, this);
    mapCursor.teleportTo(mapCursor.boardLocation);  // Trigger cursor mode.
  }

  close() {
    const { mapCursor } = this.assets;
    mapCursor.removeListener(this.changeCursorMode, this);
  }

  update() {
    const { players, map, mapCursor, instruction, gamepad, scenario, stagePointer } = this.assets;
    const { stagePointerInterface: pointer } = this.assets.scripts;

    
    const player = players.current;
    const { A, B, start, select } = gamepad.button;

    // Run dev control scripts (defined at the bottom)
    devControls.forEach( script => {
      if (Game.devController.pressed(script.key, 'Shift'))
        script.run(this.assets, this);
    });

    // Get examined map tile
    const square = (pointer.affirmIntent)
      ? map.squareAt(pointer.affirmIntentLocation())
      : map.squareAt(mapCursor.boardLocation);
    const unit = square.unit;

    // On press A, select an allied unit to give instruction to
    if (A.pressed || pointer.affirmIntent) {
      // Allied unit to move
      const visible = (square.unitVisible());
      const orderableAlly = (unit?.orderable && unit?.faction === player.faction);
      const examinableEnemy = (unit?.faction !== player.faction);
      if (unit && (orderableAlly || (visible && examinableEnemy))) {
        instruction.place = unit.boardLocation;
        this.advance(MoveUnit, RatifyIssuedOrder);
      }

      // Empty, allied factory tile to build
      else if (!unit && scenario.spawnMap.some(dict => dict.type === square.terrain.type && square.terrain.faction === player.faction)) {
        if (player.faction === square.terrain.faction)
          this.advance(FactoryMenu, RatifyIssuedOrder);
      }

      // The tile has no particular function — open the Field Menu.
      else if (A.pressed) {
        this.advance(FieldMenu);
      }
    }

    // On press B, show unit attack range or initiate move camera mode.
    else if (B.pressed || stagePointer.button.held(20) && square.unit) {
      const allied = square.unit?.faction === player.faction;
      const visible = square.unitVisible();
      if (square.unit && (allied || visible)) {
        instruction.place = new Point(mapCursor.boardLocation);
        this.advance(ShowUnitAttackRange);
      } else
        this.advance(MoveCamera);
    }

    // On press Start, open the Field Menu.
    else if (start.pressed || stagePointer.button.held(20)) {
      this.advance(FieldMenu);
    }

    // On press Select, open the Minimap.
    else if (select.pressed) {
      this.advance(ShowMinimap);
    }
  }

}


//////////////////////////////////////////////////////////////////////
//////////    Dev Control Scripts    /////////////////////////////////
//////////////////////////////////////////////////////////////////////

const devControls: {key: number, run: (assets: BattleSceneControllers, state: IssueOrderStart) => void}[] = [
  { // Empty resources
    key: Keys.E,
    run: (assets) => {
      const { map, mapCursor, players } = assets;
      const unit = map.squareAt(mapCursor.boardLocation).unit;

      if (unit && unit.faction === players.current.faction) {
        unit.gas = 10;
        unit.ammo = Math.min(1, unit.maxAmmo);
        unit.hp = 50;
      }

      mapCursor.teleportTo(mapCursor.boardLocation); // Retrigger UI
        // TODO I need a phantom-move signal.
        // TODO It would also be nice if the unit/terrain under the cursor could signal a change so
        //   I don't have to remember to teleport the cursor each time.
    }
  },
  { // Reactivate unit
    key: Keys.R,
    run: (assets) => {
      const { map, mapCursor, players } = assets;
      const unit = map.squareAt(mapCursor.boardLocation).unit;

      if (unit && unit.faction == players.current.faction) {
        unit.spent = false;
        unit.orderable = true;
      }
    }
  },
  { // Increase funds by 1 turn
    key: Keys.I,
    run: (assets) => {
      const { players, scenario, uiSystem } = assets;
      const income = scenario.incomePerTaxableProperty;
      players.current.funds += income * players.current.propertyCount;
      uiSystem.inspectPlayers();
    }
  },
  { // Spawn unit
    key: Keys.N,
    run: (assets, state) => {
      const { map, mapCursor } = assets;
      const unit = map.squareAt(mapCursor.boardLocation).unit;
      
      if (unit)
        unit.destroy();
      state.advance(FactoryMenu, RatifyIssuedOrder);
    }
  },
  { // Destroy unit
    key: Keys.M,
    run: (assets) => {
      const { map, mapCursor } = assets;
      const unit = map.squareAt(mapCursor.boardLocation).unit;

      if (unit)
        unit.destroy();
    }
  },
  { // Capture property
    key: Keys.C,
    run: (assets) => {
      const { map, mapCursor, players } = assets;
      const terrain = map.squareAt(mapCursor.boardLocation).terrain;

      if (terrain.building) {
        terrain.faction = players.current.faction;
        players.current.scanCapturedProperties();
        map.revealSightMapLocation(mapCursor.boardLocation, players.current);
      }
    }
  },
  { // Annoint CO unit
    key: Keys.O,
    run: (assets) => {
      const { map, mapCursor } = assets;
      const unit = map.squareAt(mapCursor.boardLocation).unit;
      if (unit)
        unit.CoOnBoard = true;
    }
  },
  { // Alter terrain to random
    key: Keys.K,
    run: (assets) => {
      const { map, mapCursor } = assets;
      const place = mapCursor.boardLocation;
      const neighbors = map.neighboringTerrainAt(place);
      const terrOptions = Object.values(Terrain)
        .filter( t => t !== Terrain.Void && new t().legalPlacement(neighbors) );
      const terrain = Common.choose(terrOptions);
      map.changeTile(place, terrain);
    }
  },
  { // Enter developer map-design mode
    key: Keys.Period,
    run: (assets, state) => {
      state.advance(DevMapEditor);
    }
  },
]