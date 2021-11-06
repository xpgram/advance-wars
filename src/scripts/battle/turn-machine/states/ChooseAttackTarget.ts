import { TurnState } from "../TurnState";
import { UnitObject } from "../../UnitObject";
import { Point } from "../../../Common/Point";
import { Slider } from "../../../Common/Slider";
import { AnimateMoveUnit } from "./AnimateMoveUnit";
import { SumCardinalVectorsToVector } from "../../../Common/CardinalDirection";
import { Debug } from "../../../DebugUtils";
import { Common } from "../../../CommonUtils";
import { Pulsar } from "../../../timer/Pulsar";

export class ChooseAttackTarget extends TurnState {
  get name() { return 'ChooseAttackTarget'; }
  get revertible() { return true; }
  get skipOnUndo() { return false; }

  private actor!: UnitObject;
  private destination!: Point;
  private possibleTargets: UnitObject[] = [];
  private index!: Slider;

  // TODO This is a common structure, can I extract?
  holdButton = new Pulsar(
    {
      firstInterval: 15,
      interval: 6,
    },
    () => {
      const { gamepad, mapCursor } = this.assets;
      const { point } = gamepad.axis.dpad;
      const dir = Common.clamp(point.x + point.y, -1, 1);
      this.index.increment(dir);
      mapCursor.moveTo(new Point(this.possibleTargets[this.index.output].boardLocation));
    },
    this
  )

  assert() {
    const get = this.assertData.bind(this);
    const { instruction, map } = this.assets;

    const place = get(instruction.place, 'location of acting unit');
    this.actor = get(map.squareAt(place).unit, `acting unit at location ${place.toString()}`);
    const path = get(instruction.path, 'travel instructions for unit');
    this.destination = SumCardinalVectorsToVector(path).add(place);
  }

  configureScene() {
    const { map, mapCursor } = this.assets;

    mapCursor.show();
    mapCursor.disable();
    this.assets.uiSystem.show();
    this.assets.trackCar.show();

    // TODO Make list clockwise if actor is a direct unit

    // Build the list of possible targets
    const boundary = map.squareOfInfluence(this.actor);
    for (let yi = 0; yi < boundary.height; yi++)
      for (let xi = 0; xi < boundary.width; xi++) {
        const x = xi + boundary.x;
        const y = yi + boundary.y;
        const square = map.squareAt(new Point(x, y));
        if (square.unit && square.attackFlag)
          this.possibleTargets.push(square.unit);
      }

    // If there are no targets, revert to last state; otherwise,
    if (this.possibleTargets.length == 0)
      this.failTransition(`no attackable targets in range`);
    // ...setup the target-picker and move the cursor.
    else {
      this.index = new Slider({
        max: this.possibleTargets.length,
        granularity: 1,
        looping: true
      });
      this.assets.mapCursor.moveTo(this.possibleTargets[this.index.output].boardLocation);
    }
  }

  update() {
    const { gamepad, mapCursor, instruction } = this.assets;

    if (gamepad.button.dpadUp.pressed
      || gamepad.button.dpadLeft.pressed) {
      this.index.decrement();
      mapCursor.moveTo(this.possibleTargets[this.index.output].boardLocation);
      this.holdButton.start();
    }
    else if (gamepad.button.dpadDown.pressed
      || gamepad.button.dpadRight.pressed) {
      this.index.increment();
      mapCursor.moveTo(this.possibleTargets[this.index.output].boardLocation);
      this.holdButton.start();
    }
    else if (gamepad.button.B.pressed)
      this.regressToPreviousState();
    else if (gamepad.button.A.pressed) {
      instruction.focal = this.possibleTargets[this.index.output].boardLocation;
      this.advanceToState(this.advanceStates.animateMoveUnit);
    }

    if (gamepad.axis.dpad.returned)
      this.holdButton.stop();
  }

  close() {
    this.holdButton.stop();
  }

  prev() {
    this.assets.instruction.focal = undefined;
    this.assets.mapCursor.moveTo(this.destination);
  }

  advanceStates = {
    animateMoveUnit: { state: AnimateMoveUnit, pre: () => { } }
  }
}