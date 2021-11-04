import { SumCardinalVectorsToVector } from "../../../Common/CardinalDirection";
import { Point } from "../../../Common/Point";
import { UnitObject } from "../../UnitObject";
import { TurnState } from "../TurnState";
import { CommandMenu } from "./CommandMenu";
import { RatifyIssuedOrder } from "./RatifyIssuedOrder";

export class DropLocation extends TurnState {
    get name() { return 'DropLocation'; }
    get revertible() { return true; }
    get skipOnUndo() { return false; }

    advanceStates = {
        commandMenu: {state: CommandMenu, pre: () => {}},
        ratify: {state: RatifyIssuedOrder, pre: () => {}},
    }

    location!: Point;
    destination!: Point;
    dropUnit!: UnitObject;

    assert() {
        const get = this.assertData.bind(this);
        const { map } = this.assets;
        const instruction = this.assets.instruction;
        
        this.location = get(instruction.place, `actor location`);
        const path = get(instruction.path, `actor's movement path`);
        this.destination = SumCardinalVectorsToVector(path).add(this.location);

        const actor = get(map.squareAt(this.location).unit, `actor at location`);
        // const which = get(instruction.which, `unit to drop`);
        const which = 0;  // TODO CommandMenu needs to ensure this is set.
        this.dropUnit = actor.loadedUnits[which];
    }

    configureScene() {
        const { assets } = this;
        const { map, mapCursor, trackCar } = assets;

        map.clearTileOverlay();
        mapCursor.show();
        trackCar.show();
        
        const neighbors = map.neighborsAt(this.destination);
        neighbors.orthogonals.forEach( tile => {
          tile.moveFlag = (tile.occupiable(this.dropUnit));
        });
    }

    update() {
      const { map, mapCursor, gamepad, instruction } = this.assets;

      // On press B, revert state
      if (gamepad.button.B.pressed)
        this.regressToPreviousState();

      // On press A, advance to next state
      else if (gamepad.button.A.pressed) {
        const tile = map.squareAt(mapCursor.pos);
        if (tile.moveFlag) {
          instruction.focal = new Point(mapCursor.pos);
          this.advanceToState(this.advanceStates.ratify);
        }
      }
    }

    prev() {
        const { map, mapCursor } = this.assets;
        map.clearTileOverlay();
        mapCursor.teleport(this.destination);

        map.squareAt(this.location).moveFlag = true;
        map.squareAt(this.destination).moveFlag = true;
    }
}