import { TurnState } from "../TurnState";
import { UnitObject } from "../../UnitObject";
import { Point } from "../../../Common/Point";
import { Slider } from "../../../Common/Slider";
import { AnimateMoveUnit } from "./AnimateMoveUnit";
import { Common } from "../../../CommonUtils";
import { Pulsar } from "../../../timer/Pulsar";
import { DamageScript } from "../../DamageScript";

export class ChooseAttackTarget extends TurnState {
  get name() { return 'ChooseAttackTarget'; }
  get revertible() { return true; }
  get skipOnUndo() { return false; }

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

  configureScene() {
    const { map, mapCursor, uiSystem, trackCar } = this.assets;
    const { actor, goal } = this.data;

    mapCursor.show();
    mapCursor.disable();
    uiSystem.show();
    trackCar.show();

    // Build the list of possible targets
    const boundary = map.squareOfInfluence(actor);
    for (let yi = 0; yi < boundary.height; yi++)
      for (let xi = 0; xi < boundary.width; xi++) {
        const x = xi + boundary.x;
        const y = yi + boundary.y;
        const square = map.squareAt(new Point(x, y));
        if (square.unit && square.attackFlag)
          this.possibleTargets.push(square.unit);
      }

    // Sort points clockwise-style, farthest first
    function sortAngle(p: Point) {
      const v = p.subtract(goal);
      const rad = -v.rotateByVector(0,1).angle();
      const mag = v.magnitude();
      return rad*1000 + mag;
    }
    this.possibleTargets.sort( (a,b) => sortAngle(b.boardLocation) - sortAngle(a.boardLocation) );

    // If there are no targets, revert to last state; otherwise,
    if (this.possibleTargets.length == 0)
      this.failTransition(`no attackable targets in range`);
    // setup the target-picker and move the cursor.
    else {
      this.index = new Slider({
        max: this.possibleTargets.length,
        granularity: 1,
        looping: true
      });
      mapCursor.moveTo(this.possibleTargets[this.index.output].boardLocation);
    }
  }

  update() {
    const { gamepad, map, mapCursor, uiSystem, players, instruction } = this.assets;
    const { actor, seed } = this.data;

    // Update UI System with damage forecast.
    const targetTile = map.squareAt(mapCursor.pos);
    if (targetTile.unit && targetTile.unit.faction !== players.current.faction) {
      const damage = DamageScript.NormalAttack(map, actor, targetTile.unit, seed);
      uiSystem.inspectTile(targetTile, damage.estimate);
    }

    const { dpadUp, dpadLeft, dpadDown, dpadRight, A, B } = gamepad.button;

    if (dpadUp.pressed || dpadLeft.pressed) {
      this.index.decrement();
      mapCursor.moveTo(this.possibleTargets[this.index.output].boardLocation);
      this.holdButton.start();
    }
    else if (dpadDown.pressed || dpadRight.pressed) {
      this.index.increment();
      mapCursor.moveTo(this.possibleTargets[this.index.output].boardLocation);
      this.holdButton.start();
    }
    else if (B.pressed)
      this.regressToPreviousState();
    else if (A.pressed) {
      instruction.focal = this.possibleTargets[this.index.output].boardLocation;
      this.advanceToState(AnimateMoveUnit);
    }

    if (gamepad.axis.dpad.returned)
      this.holdButton.stop();
  }

  close() {
    this.holdButton.stop();
  }

  prev() {
    const { mapCursor, instruction } = this.assets;
    const { goal } = this.data;
    instruction.focal = undefined;
    mapCursor.moveTo(goal);
  }
  
}