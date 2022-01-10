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
    mapCursor.teleport(mapCursor.boardLocation);  // Trigger cursor mode.

    // Configure units to indicate whether they are CO-boardable.
    // TODO Logic copied from Command.ts; extract this to a function.
    // TODO Probably to BoardPlayer, actually.
    players.current.units.forEach( u => {
      const square = map.squareAt(u.boardLocation);
      const spawnMap = scenario.spawnMap.find( sm => sm.type === square.terrain.type );
      const spawnableTerrain = (spawnMap?.units.includes( u.type ) || false);
      const isHQ = (square.terrain.type === Terrain.HQ && scenario.CoLoadableFromHQ);
      const actorOrderable = (u.orderable);
      const actorAllied = (players.perspective.faction === u.faction);
      const terrainAllied = (square.terrain.faction === u.faction);
      const canSpawnCo = (players.perspective.canSpawnCO);

      const showIcon = (actorOrderable && actorAllied && terrainAllied && canSpawnCo && (spawnableTerrain || isHQ));
      u.CoCouldBoard = showIcon;
    });
  }

  close() {
    const { mapCursor } = this.assets;
    mapCursor.removeListener(this.changeCursorMode, this);
  }

  update() {
    const { players, map, mapCursor, instruction, gamepad, scenario } = this.assets;

    const player = players.current;
    const { A, B, start } = gamepad.button;

    const square = map.squareAt(mapCursor.boardLocation);
    const unit = square.unit;

    // TODO Remove — but not yet; I find it useful. Extract it to a control script, maybe.
    // Empty resources
    if (Game.devController.pressed(Keys.E, 'Shift'))
      if (unit) {
        unit.gas = 1;
        unit.ammo = 0;
      }
    // Reactivate unit
    if (Game.devController.pressed(Keys.R, 'Shift'))
      if (unit && unit.faction === player.faction) {
        unit.spent = false;
        unit.orderable = true;
      }
    // Spawn unit
    if (Game.devController.pressed(Keys.N, 'Shift'))
      if (!unit) {
        const possibleSpawns = Object.values(Unit).filter( type => square.occupiable(new type()) );
        const newUnit = player.spawnUnit({
          location: mapCursor.boardLocation,
          serial: Common.pick(possibleSpawns).serial,
        })
        newUnit.orderable = true;
      }
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
      const visible = (unit?.visibleToPlayer(players.perspective, square.neighbors));
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
      const visibleToSelf = square.unit?.visibleToPlayer(players.perspective, square.neighbors);
      if (square.unit && (allied || visibleToSelf)) {
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