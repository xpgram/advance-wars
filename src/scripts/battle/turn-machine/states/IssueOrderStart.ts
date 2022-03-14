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
import { Unit } from "../../Unit";
import { Common } from "../../../CommonUtils";
import { Terrain } from "../../map/Terrain";

export class IssueOrderStart extends TurnState {
  get type() { return IssueOrderStart; }
  get name() { return 'IssueOrderStart'; }
  get revertible() { return true; }   // ← If each state is either auto-skipped on undo or must deliberately cancel
  get skipOnUndo() { return false; }  //   itself via a function call, I wonder if this property is even necessary.

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
    this.assets.resetCommandInstruction();
    instruction.seed = Math.random() * Number.MAX_SAFE_INTEGER;

    // Activate control scripts.
    scripts.nextOrderableUnit.enable();

    // Configure map cursor to update pointer graphic over certain terrains
    mapCursor.on('move', this.changeCursorMode, this);
    mapCursor.teleportTo(mapCursor.boardLocation);  // Trigger cursor mode.
  }

  close() {
    const { mapCursor } = this.assets;
    mapCursor.removeListener(this.changeCursorMode, this);
  }

  update() {
    const { players, map, mapCursor, instruction, gamepad, scenario } = this.assets;
    const { uiSystem } = this.assets;

    const player = players.current;
    const { A, B, start } = gamepad.button;

    const square = map.squareAt(mapCursor.boardLocation);
    const unit = square.unit;

    // TODO Remove — but not yet; I find it useful. Extract it to a control script, maybe.
    // Empty resources
    if (Game.devController.pressed(Keys.E, 'Shift'))
      if (unit) {
        unit.gas = 10;
        unit.ammo = 0;
        unit.hp = 50;
      }
    // Reactivate unit
    if (Game.devController.pressed(Keys.R, 'Shift'))
      if (unit && unit.faction === player.faction) {
        unit.spent = false;
        unit.orderable = true;
      }
    // Spawn unit
    if (Game.devController.pressed(Keys.N, 'Shift')) {
      if (unit)
        unit.destroy();
      const possibleSpawns = Object.values(Unit).filter( type => square.occupiable(new type()) );
      const newUnit = player.spawnUnit({
        location: mapCursor.boardLocation,
        serial: Common.pick(possibleSpawns).serial,
      })
      newUnit.orderable = true;
    }
    // Destroy unit
    if (Game.devController.pressed(Keys.M, 'Shift'))
      if (unit)
        unit.destroy();
    // Capture property
    if (Game.devController.pressed(Keys.C, 'Shift'))
      if (square.terrain.building) {
        square.terrain.faction = player.faction;
        player.scanCapturedProperties();
      }
    // CO
    if (Game.devController.pressed(Keys.O, 'Shift'))
      if (square.unit)
        square.unit.CoOnBoard = true;

    // On press A, select an allied unit to give instruction to
    if (A.pressed) {
      
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
      else {
        this.advance(FieldMenu);
      }

    }

    // On press B, show unit attack range or initiate move camera mode.
    else if (B.pressed) {
      const allied = square.unit?.faction === player.faction;
      const visible = square.unitVisible();
      if (square.unit && (allied || visible)) {
        instruction.place = new Point(mapCursor.boardLocation);
        this.advance(ShowUnitAttackRange);
      } else
        this.advance(MoveCamera);
    }

    // On press Start, open the Field Menu.
    else if (start.pressed) {
      this.advance(FieldMenu);
    }
  }

}