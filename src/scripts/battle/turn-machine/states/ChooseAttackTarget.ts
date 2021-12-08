import { TurnState } from "../TurnState";
import { UnitObject } from "../../UnitObject";
import { Point } from "../../../Common/Point";
import { Slider } from "../../../Common/Slider";
import { Common } from "../../../CommonUtils";
import { Pulsar } from "../../../timer/Pulsar";
import { DamageScript } from "../../DamageScript";
import { Game } from "../../../..";
import { Timer } from "../../../timer/Timer";

export class ChooseAttackTarget extends TurnState {
  get type() { return ChooseAttackTarget; }
  get name() { return 'ChooseAttackTarget'; }
  get revertible() { return true; }
  get skipOnUndo() { return false; }

  private possibleTargets: UnitObject[] = [];
  private index!: Slider;

  /** Tapping directional buttons within this time limit preserves increment direction. */
  private fastTapTimer = new Timer(1.5);
  /** Remembers which raw direction was last input. */
  private lastTapInput?: Point;

  // TODO This is a common structure, can I extract?
  private incrementDirection = 1;
  private holdButton = new Pulsar(
    {
      firstInterval: 20,
      interval: 6,
    },
    this.triggerCursorMove,
    this
  )

  private triggerCursorMove() {
    const { mapCursor } = this.assets;
    this.index.increment(this.incrementDirection);
    mapCursor.moveTo(new Point(this.possibleTargets[this.index.output].boardLocation));
  }

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

    // Setup map cursor
    mapCursor.on('move', this.updateDamageForecast, this);
    mapCursor.mode = 'target';

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
      const rad = -v.rotateByVector(Point.Up).polarAngle();
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
    const { place } = this.data;

    const { A, B } = gamepad.button;

    if (gamepad.dpadButtons.every( b => b.up ))
      this.holdButton.stop();
    else if (gamepad.axis.dpad.changed)
      this.holdButton.startReset();

    const updateIncrementDir = () => {
      const { point, framePoint } = gamepad.axis.dpad;

      const newInput = this.lastTapInput?.notEqual(framePoint);
      this.lastTapInput = framePoint;

      if (this.fastTapTimer.ticking && !newInput)
        return;
      this.fastTapTimer.startReset();

      const vector = mapCursor.pos.subtract(place);
      const dir = -vector.clockDirectionTo(point);
      this.incrementDirection = (dir !== 0)
        ? dir
        : Common.clamp(point.sumCoords(), -1, 1);
    }

    if (gamepad.dpadButtons.some( b => b.pressed )) {
      updateIncrementDir();
      this.triggerCursorMove();
    }
    else if (B.pressed)
      this.regress();
    else if (A.pressed) {
      instruction.focal = this.possibleTargets[this.index.output].boardLocation;
      this.advance();
    }
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