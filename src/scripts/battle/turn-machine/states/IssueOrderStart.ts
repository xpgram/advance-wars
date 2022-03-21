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
    const { uiSystem, stagePointer } = this.assets;

    const tileSize = Game.display.standardLength;

    const player = players.current;
    const { A, B, start } = gamepad.button;

    // TODO Refine
    const pointerButton = stagePointer.button;
    const pointerBoardLocation = stagePointer.pointerLocation().apply( n => Math.floor(n/tileSize) );
    const pointerPressBoardLocation = stagePointer.pointerLastPressLocation().apply( n => Math.floor(n/tileSize) );
    const pointerOverCursor = (pointerBoardLocation.equal(mapCursor.boardLocation));

    // TODO ClickDrag grabs square from pointerPressBoardLocation

    // TODO This implementation is incredibly messy; I was experimenting.
    // It's also made harder to read by the dev controls, clean those up too.
    const clickMove = (pointerButton.down && !pointerOverCursor);
    const clickAffirm = (stagePointer.clicked() && pointerOverCursor);
    const clickHoldAffirm = (pointerButton.held && !stagePointer.pointerDragging);
    const clickDragAffirm = (stagePointer.pointerDragging && pointerPressBoardLocation.equal(pointerBoardLocation));
    if (pointerButton.up)
      this.cursorMovedByClick = false;

    // TODO Try to write these out of the update() script; it'll make mouse easier
    const square = map.squareAt(mapCursor.boardLocation);
    const unit = square.unit;

    // Run dev control scripts (defined at the bottom)
    devControls.forEach( script => {
      if (Game.devController.pressed(script.key, 'Shift'))
        script.run(this.assets, this);
    });


    // On left click (not over cursor pos), move cursor
    if (clickMove) {
      if (pointerButton.pressed)
        mapCursor.moveTo(pointerBoardLocation);
      else
        mapCursor.animateTo(pointerBoardLocation);
      this.cursorMovedByClick = true;
    }

    // On press A, select an allied unit to give instruction to
    else if (A.pressed || clickAffirm || clickHoldAffirm || clickDragAffirm) {
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
      const { map, mapCursor, players } = assets;
      const square = map.squareAt(mapCursor.boardLocation);
      
      if (square.unit)
        square.unit.destroy();
      state.advance(FactoryMenu, RatifyIssuedOrder);
    }
  },
  { // Destroy unit
    key: Keys.M,
    run: (assets) => {
      const { map, mapCursor } = assets;
      const unit = map.squareAt(mapCursor.boardLocation);

      if (unit)
        unit.destroy();
    }
  },
  { // Capture property
    key: Keys.C,
    run: (assets) => {
      const { map, mapCursor, players } = assets;
      const square = map.squareAt(mapCursor.boardLocation);

      if (square.terrain.building) {
        square.terrain.faction = players.current.faction;
        players.current.scanCapturedProperties();
        map.revealSightMapLocation(square.pos, players.current);
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
  }
]