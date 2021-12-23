import { Point } from "../../Common/Point";
import { Slider } from "../../Common/Slider";
import { ControlScript } from "../../ControlScript";
import { Pulsar } from "../../timer/Pulsar";
import { Button } from "../../controls/Button";
import { BattleSceneControllers } from "../turn-machine/BattleSceneControllers";


export class NextOrderableUnit extends ControlScript {
  defaultEnabled(): boolean { return false; }

  private readonly nextUnitButton: Button;
  private readonly nextBaseButton: Button;

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

      const { mapCursor } = this.assets;
      const { nextUnitButton, nextBaseButton } = this;

      if (nextUnitButton.down) {
        point = this.unitLocations[this.unitSelect.output];
        this.unitSelect.increment();
      }
      else if (nextBaseButton.down) {
        point = this.baseLocations[this.baseSelect.output];
        this.baseSelect.increment();
      }

      if (point)
        mapCursor.teleport(point);
    },
    this
  );

  constructor(assets: BattleSceneControllers) {
    super(assets);

    const { gamepad } = this.assets;

    this.nextUnitButton = gamepad.button.leftBumper;
    this.nextBaseButton = gamepad.button.rightBumper;
    
    const tmpSlider = new Slider({
      max: 1,
      granularity: 1,
      looping: true,
    });
    this.unitSelect = tmpSlider;
    this.baseSelect = tmpSlider;
  }

  protected enableScript(): void {
    const { map, players, scenario } = this.assets;

    const player = players.current;
    const spawnTypes = Object.values(scenario.spawnMap).map( spawnMap => spawnMap.type );

    // Gets a list of point objects for captured, unoccupied bases.
    this.baseLocations = player.capturePoints
      .filter( p =>
        spawnTypes.includes(map.squareAt(p).terrain.type)
        && (!map.squareAt(p).unit || map.squareAt(p).unit?.orderable) );
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
    const { mapCursor } = this.assets;
    const { nextUnitButton, nextBaseButton, holdPulsar } = this;
    const { unitLocations, unitSelect, baseLocations, baseSelect } = this;

    function triggerMoveCursor (button: Button, locations: Point[], slider: Slider) {
      const location = () => locations[slider.output];
      if (!button.pressed || locations.length === 0 || holdPulsar.active)
        return;

      const cursorAtLocation = location().equal(mapCursor.boardLocation);
      slider.increment( Number(cursorAtLocation) );
      mapCursor.teleport(location());
      holdPulsar.start();
    }
    triggerMoveCursor(nextUnitButton, unitLocations, unitSelect);
    triggerMoveCursor(nextBaseButton, baseLocations, baseSelect);

    if (holdPulsar.active && nextUnitButton.up && nextBaseButton.up)
      holdPulsar.stop();
  }

  protected disableScript(): void {
    this.holdPulsar.stop();
  }

  resetIndex() {
    this.unitSelect.track = 'min';
    this.baseSelect.track = 'min';
  }

}