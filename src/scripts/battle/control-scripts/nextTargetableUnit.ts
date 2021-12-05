import { Point } from "../../Common/Point";
import { Slider } from "../../Common/Slider";
import { VirtualGamepad } from "../../controls/VirtualGamepad";
import { ControlScript } from "../../ControlScript";
import { Pulsar } from "../../timer/Pulsar";
import { Map } from "../map/Map";
import { MapCursor } from "../map/MapCursor";
import { TurnModerator } from "../TurnModerator";
import { Button } from "../../controls/Button";


export class NextTargetableUnit extends ControlScript {
  defaultEnabled(): boolean { return false; }

  private nextUnitButton: Button;
  //gamepad: VirtualGamepad;  // Replace with gamepad proxy or whatever

  map: Map;
  cursor: MapCursor;
  players: TurnModerator

  unitLocations!: Point[];
  unitSelect: Slider;

  holdPulsar = new Pulsar({
    interval: 8,
    firstInterval: 20,
    },
    () => {
      let point: Point | undefined;

      if (this.nextUnitButton.down) {
        point = this.unitLocations[this.unitSelect.output];
        this.unitSelect.increment();
      }

      if (point)
        this.cursor.teleport(point);
    },
    this
  );

  constructor(gp: VirtualGamepad, map: Map, cursor: MapCursor, turnModerator: TurnModerator) {
    super();
    this.nextUnitButton = gp.button.leftBumper;
    
    this.map = map;
    this.cursor = cursor;
    this.players = turnModerator;
    
    const tmpSlider = new Slider({
      max: 1,
      granularity: 1,
      looping: true,
    });
    this.unitSelect = tmpSlider;
  }

  protected enableScript(): void {
    // Gets a list of point objects for targetable units.
    this.unitLocations = this.players.allUnits
      .filter( u => u.onMap && this.map.squareAt(u.boardLocation).attackFlag )
      .map( u => u.boardLocation );
    this.unitSelect = new Slider({
      max: this.unitLocations.length,
      track: this.unitSelect?.track || 0,
      granularity: 1,
      looping: true,
    });
  }

  protected updateScript(): void {
    if (this.nextUnitButton.pressed && this.unitLocations.length !== 0) {
      this.cursor.teleport(this.unitLocations[this.unitSelect.output]);
      this.unitSelect.increment();
      this.holdPulsar.start();
    }

    if (this.holdPulsar.active)
      if (this.nextUnitButton.up)
        this.holdPulsar.stop();
  }

  protected disableScript(): void {
    this.holdPulsar.stop();
  }

  resetIndex() {
    this.unitSelect.track = 'min';
  }

}