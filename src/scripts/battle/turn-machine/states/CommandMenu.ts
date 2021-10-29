import { TurnState } from "../TurnState";
import { RatifyIssuedOrder } from "./RatifyIssuedOrder";
import { AnimateMoveUnit } from "./AnimateMoveUnit";
import { ChooseAttackTarget } from "./ChooseAttackTarget";
import { UnitObject } from "../../UnitObject";
import { Point } from "../../../Common/Point";
import { CardinalVector, CardinalDirection, SumCardinalVectorsToVector } from "../../../Common/CardinalDirection";
import { Debug } from "../../../DebugUtils";
import { Unit } from "../../Unit";
import { ListMenuOption } from "../../../system/ListMenuOption";
import { MapLayer } from "../../map/MapLayers";

export class CommandMenu extends TurnState {
  get name(): string { return "CommandMenu"; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return false; }

  advanceStates = {
    animateMoveUnit: { state: AnimateMoveUnit, pre: () => { } },

    // TODO Fill these in proper
    chooseAttackTarget: { state: ChooseAttackTarget, pre: () => { } },
    animateBuildingCapture: { state: RatifyIssuedOrder, pre: () => { } }
  }

  private location!: Point;
  private destination!: Point;
  private actor!: UnitObject;
  private path!: CardinalDirection[];

  private enemyInSight = false;

  protected assert(): void {
    const get = this.assertData.bind(this);
    const { map, instruction } = this.assets;

    this.location = get(instruction.place, 'location of unit');
    this.actor = get(map.squareAt(this.location).unit, `unit at location ${this.location.toString()}`);
    this.path = get(instruction.path, 'travel path for unit');
    this.destination = SumCardinalVectorsToVector(this.path).add(this.location);
  }

  protected configureScene(): void {
    const { map } = this.assets;
    const square = map.squareAt(this.destination);
    const neighbors = map.neighborsAt(this.destination);

    // leave trackCar on
    this.assets.trackCar.show();

    // Clean up map UI — hide highlights from irrelevant tiles.
    map.clearTileOverlay();
    map.squareAt(this.location).moveFlag = true;
    map.squareAt(this.destination).moveFlag = true;

    const notIndirectOrNotMoved = (!this.actor.isIndirect || this.destination.equal(this.location));

    // Retain attackable flags as well.
    const range = this.actor.rangeMap;
    const points = range.points.map(p => this.destination.add(p));
    if (notIndirectOrNotMoved) {
      for (const p of points) {
        if (map.validPoint(p)) {
          if (map.squareAt(p).attackable(this.actor)) {
            map.squareAt(p).attackFlag = true;
            this.enemyInSight = true;
          }
        }
      }
    }

    // figure out menu options
    // Wait
    // Attack (if unit is attack ready and an attackable target is within range)
    // Build  (if possible)
    // Supply (if Rig and adjacent to allied units)
    // etc.

    // set up command menu  // TODO Refactor this with ListMenuOptions
    const options = [
      new ListMenuOption("Attack", 1, {
        triggerInclude: () => {
          const targetableInRange = (this.actor.attackReady && this.enemyInSight);
          const notIndirect = (!this.actor.isIndirect);
          const hasNotMoved = (this.destination.equal(this.location));
          return targetableInRange && (notIndirect || hasNotMoved);
        }
      }),
      new ListMenuOption("Capture", 2, {
        triggerInclude: () => {
          const readyToCapture = (this.actor.soldierUnit && square.terrain.building);
          const notAllied = (this.actor.faction !== square.terrain.faction);
          return readyToCapture && notAllied;
        }
      }),
      new ListMenuOption("Supply", 3, {
        triggerInclude: () => {
          return neighbors.orthogonals
            .some(square => square.unit && square.unit.resuppliable(this.actor));
        }
      }),
      new ListMenuOption("Wait", 0),
    ];

    // TODO Oi.. this a refactor..
    this.assets.uiMenu.menu.setListItems(options);
    this.assets.uiMenu.buildGraphics();


    let location = (new Point(this.assets.mapCursor.transform.pos)).add(new Point(20, 4));
    if (this.assets.camera.center.x < location.x)
      location.x = this.assets.mapCursor.transform.pos.x - 4 - this.assets.uiMenu.gui.width;
    if (location.y + this.assets.uiMenu.gui.height + 4 > this.assets.camera.y + this.assets.camera.height)
      location.y -= location.y + this.assets.uiMenu.gui.height + 4 - this.assets.camera.y - this.assets.camera.height;
    this.assets.uiMenu.gui.position.set(location.x, location.y);
    this.assets.uiMenu.gui.zIndex = 1000;
    MapLayer('ui').sortChildren();
    this.assets.uiMenu.show();

    // TODO .sortChildren() should not be here.

    // TODO unit.commands should be how the selectables are determined.
    // Maybe commands returns a name/script pair? value = script.
    // Then, the units themselves can codify how many options they have,
    // when they present themselves, and what they do after selection.
    //
    // Units have a reference to map, don't they? They might not.
    // I guess they will.
    //
    // Problem: 'Supply' also triggers animations. Under the system just
    // described, how would it? I could queue animations and play them
    // during a generic animation state, but that's some work, yo.
    // Not sure I wanna do that right now.
  }

  update(): void {
    const { map, gamepad, instruction } = this.assets;

    // If A, infer next action from uiMenu.
    if (gamepad.button.A.pressed) {
      const commandValue = this.assets.uiMenu.menu.selectedValue;
      instruction.action = commandValue;

      if (commandValue == 1)
        this.advanceToState(this.advanceStates.chooseAttackTarget);
      else {
        this.advanceToState(this.advanceStates.animateMoveUnit);
      }
    }

    // If B, cancel, revert state
    else if (gamepad.button.B.pressed) {
      this.regressToPreviousState();
    }
  }

  prev(): void {

  }
}