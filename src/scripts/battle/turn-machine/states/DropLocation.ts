import { Point } from "../../../Common/Point";
import { CommandDropInstruction } from "../CommandInstruction";
import { TurnState } from "../TurnState";
import { CommandMenu } from "./CommandMenu";

export class DropLocation extends TurnState {
  get name() { return 'DropLocation'; }
  get revertible() { return true; }
  get skipOnUndo() { return false; }

  advanceStates = {
    commandMenu: { state: CommandMenu },
  }

  cursorMoved = false;
  drop!: {
    which: number,
    where?: Point,
  };

  onAdvance() {
    const { which } = this.data;
    this.drop = {
      which,
    }
  }

  onRegress() {
    const { mapCursor } = this.assets;
    const { drop } = this.data;

    const { which, where } = drop.pop() as typeof this.drop;
    this.drop = {
      which,
    }
    mapCursor.teleport(where as Point);
    this.cursorMoved = true;
  }

  configureScene() {
    const { map, mapCursor, trackCar } = this.assets;
    const { actor, goal, drop } = this.data;

    map.clearTileOverlay();
    mapCursor.show();
    trackCar.show();

    const toDrop = actor.loadedUnits[this.drop.which];

    const neighbors = map.neighborsAt(goal);
    const tiles = neighbors.orthogonals
      .filter( tile => tile.occupiable(toDrop)
        // Bandaid for set location // TODO Better location filtering
        // Also has no effect?
        && !(drop.map( d => d.where ).includes(new Point(tile.pos))) );
    tiles.forEach( tile => tile.moveFlag = true );

    if (!this.cursorMoved && tiles) {
      mapCursor.teleport(new Point(tiles[0].pos));
    }
  }

  update() {
    const { map, mapCursor, gamepad } = this.assets;

    // On press B, revert state
    if (gamepad.button.B.pressed)
      this.regressToPreviousState();

    // On press A, advance to next state
    else if (gamepad.button.A.pressed) {
      const tile = map.squareAt(mapCursor.pos);
      if (tile.moveFlag) {
        this.drop.where = new Point(mapCursor.pos);
        this.data.drop.push(this.drop as CommandDropInstruction);
        this.advanceToState(this.advanceStates.commandMenu);
      }
    }
  }

  prev() {
    const { map, mapCursor } = this.assets;
    const { place, goal } = this.data;

    map.clearTileOverlay();
    mapCursor.teleport(goal);

    map.squareAt(place).moveFlag = true;
    map.squareAt(goal).moveFlag = true;
  }
}