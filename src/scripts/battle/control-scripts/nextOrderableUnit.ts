import { Slider } from "../../Common/Slider";
import { VirtualGamepad } from "../../controls/VirtualGamepad";
import { ControlScript } from "../../ControlScript";
import { Map } from "../map/Map";
import { MapCursor } from "../map/MapCursor";
import { TurnModerator } from "../TurnModerator";
import { UnitObject } from "../UnitObject";


export class NextOrderableUnit extends ControlScript {
  defaultEnabled(): boolean { return false; }

  gamepad: VirtualGamepad;
  map: Map;
  cursor: MapCursor;
  players: TurnModerator;
  units!: UnitObject[];
  selectIdx!: Slider;

  constructor(gp: VirtualGamepad, map: Map, cursor: MapCursor, turnModerator: TurnModerator) {
    super();
    this.gamepad = gp;
    this.map = map;
    this.cursor = cursor;
    this.players = turnModerator;
  }

  protected enableScript(): void {
    const player = this.players.current;
    this.units = player.units.filter( u => u.orderable );
    this.selectIdx = new Slider({
      max: this.units.length,
      granularity: 1,
      looping: true,
    });
  }

  protected updateScript(): void {
    // TODO This should be left and right bumper,
    // info and player UI can be left and right trigger.
    if (this.gamepad.button.rightBumper.pressed) {
      this.selectIdx.increment();
      this.cursor.teleport(this.units[this.selectIdx.output].boardLocation);
    }
    if (this.gamepad.button.rightTrigger.pressed) {
      this.selectIdx.decrement();
      this.cursor.teleport(this.units[this.selectIdx.output].boardLocation);
    }
  }

  protected disableScript(): void {
    
  }

}