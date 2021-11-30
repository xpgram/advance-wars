import { Game } from "../../../.."
import { Keys } from "../../../controls/KeyboardObserver";
import { TurnState } from "../TurnState";
import { MoveUnit } from "./MoveUnit";
import { Point } from "../../../Common/Point";
import { ShowUnitAttackRange } from "./ShowUnitAttackRange";
import { MoveCamera } from "./MoveCamera";
import { FieldMenu } from "./FieldMenu";
import { FactoryMenu } from "./FactoryMenu";
import { CommandMenu } from "./CommandMenu";
import { RatifyIssuedOrder } from "./RatifyIssuedOrder";

export class IssueOrderStart extends TurnState {
  get type() { return IssueOrderStart; }
  get name() { return 'IssueOrderStart'; }
  get revertible() { return true; }   // ← If each state is either auto-skipped on undo or must deliberately cancel
  get skipOnUndo() { return false; }  //   itself via a function call, I wonder if this property is even necessary.

  changeCursorMode() {
    const { map, mapCursor, players, scenario } = this.assets;

    const tile = map.squareAt(mapCursor.pos);
    const allied = tile.terrain.faction === players.current.faction;
    const empty = !tile.unit;

    const types = scenario.spawnMap.map( map => map.type );
    const spawnType = types.includes(tile.terrain.type);

    if (spawnType && allied && empty)
      mapCursor.mode = 'build';
    else
      mapCursor.mode = 'point';
  }

  configureScene() {
    const { mapCursor, uiSystem, camera, scripts, players, instruction, scenario } = this.assets;

    // Reveal UI systems
    mapCursor.show();
    uiSystem.show();

    // Update player metrics
    players.all.forEach(player => player.scanCapturedProperties());

    // Update player window metrics
    uiSystem.inspectPlayers();

    // Configure camera to follow cursor
    camera.followTarget = this.assets.mapCursor;

    // Reset command instruction to new.
    this.assets.resetCommandInstruction();
    instruction.seed = Math.random() * Number.MAX_SAFE_INTEGER;

    // Activate control scripts.
    scripts.nextOrderableUnit.enable();

    // Configure map cursor to update pointer graphic over certain terrains
    mapCursor.on('move', this.changeCursorMode, this);
    mapCursor.teleport(mapCursor.pos);  // Trigger cursor mode.
  }

  close() {
    const { mapCursor } = this.assets;
    mapCursor.removeListener(this.changeCursorMode, this);
  }

  update() {
    const { players, map, mapCursor, instruction, gamepad, scenario } = this.assets;

    const player = players.current;
    const { A, B, start } = gamepad.button;

    const square = map.squareAt(mapCursor.pos);
    const unit = square.unit;

    // TODO Remove — but not yet; I find it useful. Extract it to a control script, maybe.
    // Dev insert to instantly empty unit resources
    const devC = Game.devController;
    if (devC.get(Keys.E).pressed && devC.get(Keys.Shift).down)
      if (unit) {
        unit.gas = 1;
        unit.ammo = 0;
      }

    // On press A, select an allied unit to give instruction to
    if (A.pressed) {
      
      // Allied unit to move
      const orderableAlly = (unit?.orderable && unit?.faction === player.faction);
      const examinableEnemy = (unit?.faction !== player.faction);
      if (unit && (orderableAlly || examinableEnemy)) {
        instruction.place = unit.boardLocation;
        this.advance(MoveUnit, CommandMenu, RatifyIssuedOrder);
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
      if (square.unit) {
        instruction.place = new Point(mapCursor.pos);
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