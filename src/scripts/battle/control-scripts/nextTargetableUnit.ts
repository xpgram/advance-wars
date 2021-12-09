import { Point } from "../../Common/Point";
import { Slider } from "../../Common/Slider";
import { ControlScript } from "../../ControlScript";
import { Pulsar } from "../../timer/Pulsar";
import { Button } from "../../controls/Button";
import { BattleSceneControllers } from "../turn-machine/BattleSceneControllers";


export class NextTargetableUnit extends ControlScript {
  defaultEnabled(): boolean { return false; }

  private readonly nextUnitButton: Button;

  unitLocations!: Point[];
  unitSelect: Slider;

  holdPulsar = new Pulsar({
    interval: 8,
    firstInterval: 20,
    },
    () => {
      let point: Point | undefined;

      const { mapCursor } = this.assets;
      const { nextUnitButton } = this;

      if (nextUnitButton.down) {
        point = this.unitLocations[this.unitSelect.output];
        this.unitSelect.increment();
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
    
    const tmpSlider = new Slider({
      max: 1,
      granularity: 1,
      looping: true,
    });
    this.unitSelect = tmpSlider;
  }

  protected enableScript(): void {
    const { map, players } = this.assets;

    // Gets a list of point objects for targetable units.
    this.unitLocations = players.allUnits
      .filter( u => u.onMap && map.squareAt(u.boardLocation).attackFlag )
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
    const { unitSelect, unitLocations, holdPulsar, nextUnitButton } = this;

    if (nextUnitButton.pressed && unitLocations.length !== 0) {
      mapCursor.teleport(unitLocations[unitSelect.output]);
      unitSelect.increment();
      holdPulsar.start();
    }

    if (holdPulsar.active)
      if (nextUnitButton.up)
        holdPulsar.stop();
  }

  protected disableScript(): void {
    this.holdPulsar.stop();
  }

  resetIndex() {
    this.unitSelect.track = 'min';
  }

}