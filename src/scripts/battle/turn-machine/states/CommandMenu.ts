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
import { Instruction } from "../../EnumTypes";
import { Command } from "../Command";
import { DropLocation } from "./DropLocation";
import { instructionData } from "../InstructionData";

export class CommandMenu extends TurnState {
  get name(): string { return "CommandMenu"; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return false; }

  advanceStates = {
    animateMoveUnit: { state: AnimateMoveUnit, pre: () => { } },

    chooseDropLocation: { state: DropLocation, pre: () => { } },

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

    // leave trackCar on
    this.assets.trackCar.show();

    // Clean up map UI — hide highlights from irrelevant tiles.
    map.clearTileOverlay();
    map.squareAt(this.location).moveFlag = true;
    map.squareAt(this.destination).moveFlag = true;

    const destOccupiable = map.squareAt(this.destination).occupiable(this.actor);
    const notIndirectOrNotMoved = (!this.actor.isIndirect || this.destination.equal(this.location));

    // Retain attackable flags as well.
    const range = this.actor.rangeMap;
    const points = range.points.map(p => this.destination.add(p));
    if (notIndirectOrNotMoved && destOccupiable) {
      for (const p of points) {
        if (map.validPoint(p)) {
          if (map.squareAt(p).attackable(this.actor)) {
            map.squareAt(p).attackFlag = true;
            this.enemyInSight = true;
          }
        }
      }
    }

    // set up command menu
    instructionData.fill(this.assets);
    const commands = (destOccupiable)
      ? Object.values(Command).sort( (a,b) => b.weight - a.weight )
      : [Command.Join, Command.Load];
    const options = commands.map( command =>
      new ListMenuOption(command.name, command.serial, {
        triggerInclude: command.triggerInclude,
      })
    );

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

      if (commandValue == Command.Attack.serial)
        this.advanceToState(this.advanceStates.chooseAttackTarget);
      else if (commandValue === Command.Drop.serial) {
        instruction.which = 0;  // This needs to be decided by the menu somehow.
        this.advanceToState(this.advanceStates.chooseDropLocation);
      } else {
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