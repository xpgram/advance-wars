import { Point } from "../../Common/Point";
import { Slider } from "../../Common/Slider";
import { VirtualGamepad } from "../../controls/VirtualGamepad";
import { ControlScript } from "../../ControlScript";
import { Pulsar } from "../../timer/Pulsar";
import { Map } from "../map/Map";
import { MapCursor } from "../map/MapCursor";
import { TurnModerator } from "../TurnModerator";
import { UnitSpawnMap } from "../UnitSpawnMap";
import { Button } from "../../controls/Button";


export class NextOrderableUnit extends ControlScript {
  defaultEnabled(): boolean { return false; }

  private nextUnitButton: Button;
  private nextBaseButton: Button;
  //gamepad: VirtualGamepad;  // Replace with gamepad proxy or whatever

  map: Map;
  cursor: MapCursor;
  players: TurnModerator;
  spawnMap: UnitSpawnMap[];

  unitLocations!: Point[];
  baseLocations!: Point[];
  unitSelect: Slider;
  baseSelect: Slider;

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
      else if (this.nextBaseButton.down) {
        point = this.baseLocations[this.baseSelect.output];
        this.baseSelect.increment();
      }

      if (point)
        this.cursor.teleport(point);
    },
    this
  );

  constructor(gp: VirtualGamepad, map: Map, cursor: MapCursor, turnModerator: TurnModerator, spawnMap: UnitSpawnMap[]) {
    super();
    this.nextUnitButton = gp.button.leftBumper;
    this.nextBaseButton = gp.button.rightBumper;
    
    this.map = map;
    this.cursor = cursor;
    this.players = turnModerator;
    this.spawnMap = spawnMap;
    
    const tmpSlider = new Slider({
      max: 1,
      granularity: 1,
      looping: true,
    });
    this.unitSelect = tmpSlider;
    this.baseSelect = tmpSlider;
  }

  protected enableScript(): void {
    const player = this.players.current;
    const spawnTypes = Object.values(this.spawnMap).map( spawnMap => spawnMap.type );

    // Gets a list of point objects for captured, unoccupied bases.
    this.baseLocations = player.capturePoints
      .filter( p =>
        spawnTypes.includes(this.map.squareAt(p).terrain.type)
        && !this.map.squareAt(p).unit );
    this.baseSelect = new Slider({
      max: this.baseLocations.length,
      track: this.baseSelect?.track || 0,
      granularity: 1,
      looping: true,
    });
    // Gets a list of point objects for remaining orderable units + bases.
    this.unitLocations = player.units
      .filter( u => u.orderable && u.onMap )
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
    if (this.nextBaseButton.pressed && this.baseLocations.length !== 0) {
      this.cursor.teleport(this.baseLocations[this.baseSelect.output]);
      this.baseSelect.increment();
      this.holdPulsar.start();
    }

    if (this.holdPulsar.active)
      if (this.nextUnitButton.up && this.nextBaseButton.up)
        this.holdPulsar.stop();
  }

  protected disableScript(): void {
    this.holdPulsar.stop();
  }

  resetIndex() {
    this.unitSelect.track = 'min';
    this.baseSelect.track = 'min';
  }

}