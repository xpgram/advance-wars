import { ImmutablePointPrimitive, Point } from "../../Common/Point";
import { Slider } from "../../Common/Slider";
import { VirtualGamepad } from "../../controls/VirtualGamepad";
import { ControlScript } from "../../ControlScript";
import { Pulsar } from "../../timer/Pulsar";
import { Map } from "../map/Map";
import { MapCursor } from "../map/MapCursor";
import { TurnModerator } from "../TurnModerator";
import { UnitObject } from "../UnitObject";
import { defaultUnitSpawnMap, UnitSpawnMap } from "../UnitSpawnMap";
import { Button } from "../../controls/Button";


export class NextOrderableUnit extends ControlScript {
  defaultEnabled(): boolean { return false; }

  private incrementButton: Button;

  //gamepad: VirtualGamepad;  // Replace with gamepad proxy or whatever
  map: Map;
  cursor: MapCursor;
  players: TurnModerator;
  spawnMap: UnitSpawnMap[];
  locations!: Point[];
  selectIdx!: Slider;

  holdPulsar = new Pulsar({
    interval: 8,
    firstInterval: 20,
    },
    () => {
      if (this.incrementButton.down)
        this.selectIdx.increment();
      this.cursor.teleport(this.locations[this.selectIdx.output]);
    },
    this
  );

  constructor(gp: VirtualGamepad, map: Map, cursor: MapCursor, turnModerator: TurnModerator, spawnMap: UnitSpawnMap[]) {
    super();
    this.incrementButton = gp.button.leftBumper;
    
    this.map = map;
    this.cursor = cursor;
    this.players = turnModerator;
    this.spawnMap = spawnMap;
  }

  protected enableScript(): void {
    const player = this.players.current;
    const spawnTypes = Object.values(this.spawnMap).map( spawnMap => spawnMap.type );

    // Gets a list of point objects for captured, unoccupied bases.
    const bases = player.capturePoints
      .filter( p =>
        spawnTypes.includes(this.map.squareAt(p).terrain.type)
        && !this.map.squareAt(p).unit );
    // Gets a list of point objects for remaining orderable units + bases.
    this.locations = player.units
      .filter( u => u.orderable )
      .map( u => u.boardLocation )
      .concat( bases );
    // Setup list incrementer
    this.selectIdx = new Slider({
      max: this.locations.length,
      track: this.selectIdx?.track || 0,
      granularity: 1,
      looping: true,
    });
  }

  protected updateScript(): void {
    if (this.locations.length === 0)
      return;

    if (this.incrementButton.pressed) {
      this.cursor.teleport(this.locations[this.selectIdx.output]);
      this.selectIdx.increment();
      this.holdPulsar.start();
    }
    if (this.incrementButton.released)
      this.holdPulsar.stop();
  }

  protected disableScript(): void {
    this.holdPulsar.stop();
  }

}