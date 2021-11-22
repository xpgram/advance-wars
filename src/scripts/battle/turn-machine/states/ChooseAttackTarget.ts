import { TurnState } from "../TurnState";
import { UnitObject } from "../../UnitObject";
import { Point } from "../../../Common/Point";
import { Slider } from "../../../Common/Slider";
import { Common } from "../../../CommonUtils";
import { Pulsar } from "../../../timer/Pulsar";
import { DamageScript } from "../../DamageScript";

export class ChooseAttackTarget extends TurnState {
  get type() { return ChooseAttackTarget; }
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

  updateDamageForecast() {
    const { map, mapCursor, uiSystem, players } = this.assets;
    const { actor, goal, seed } = this.data;

    const focalTile = map.squareAt(mapCursor.pos);
    const focalUnit = focalTile.unit;
    if (focalUnit && focalUnit.faction !== players.current.faction) {
      const damage = DamageScript.NormalAttack(map, actor, goal, focalUnit, seed);
      uiSystem.battleForecast = damage.estimate;
    } else {
      uiSystem.battleForecast = undefined;
    }
  }

  configureScene() {
    const { map, mapCursor, uiSystem, trackCar } = this.assets;
    const { actor, goal } = this.data;

    mapCursor.show();
    mapCursor.disable();
    uiSystem.show();
    trackCar.show();

    // Update damage forecast on cursor move
    mapCursor.on('move', this.updateDamageForecast, this);

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
    const { gamepad, mapCursor, instruction } = this.assets;

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
      this.regress();
    else if (A.pressed) {
      instruction.focal = this.possibleTargets[this.index.output].boardLocation;
      this.advance();
    }

    if (gamepad.axis.dpad.returned)
      this.holdButton.stop();
  }

  close() {
    const { mapCursor, uiSystem } = this.assets;

    this.holdButton.stop();
    uiSystem.battleForecast = undefined;
    mapCursor.removeListener(this.updateDamageForecast, this);
  }

  prev() {
    const { mapCursor, instruction } = this.assets;
    const { goal } = this.data;
    instruction.focal = undefined;
    mapCursor.moveTo(goal);
  }
  
}