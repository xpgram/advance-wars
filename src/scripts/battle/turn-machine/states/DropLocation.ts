import { CardinalDirection } from "../../../Common/CardinalDirection";
import { Point } from "../../../Common/Point";
import { Slider } from "../../../Common/Slider";
import { Common } from "../../../CommonUtils";
import { Pulsar } from "../../../timer/Pulsar";
import { Square } from "../../map/Square";
import { CommandDropInstruction } from "../CommandInstruction";
import { TurnState } from "../TurnState";
import { CommandMenu } from "./CommandMenu";

export class DropLocation extends TurnState {
  get type() { return DropLocation; }
  get name() { return 'DropLocation'; }
  get revertible() { return true; }
  get skipOnUndo() { return false; }

  cursorMoved = false;
  drop!: {
    which: number,
    where?: Point,
  };

  tiles!: Square[];
  index!: Slider;

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
      mapCursor.moveTo(new Point(this.tiles[this.index.output]));
    },
    this
  )

  onAdvance() {
    const { which } = this.data;
    this.drop = {
      which,
    }
  }

  onRegress() {
    const { mapCursor } = this.assets;
    const { drop } = this.data;
    
    const { which, where } = drop.pop() as typeof this.drop;
    this.drop = {
      which,
    }
    mapCursor.teleport(where as Point);
    this.cursorMoved = true;
  }

  configureScene() {
    const { map, mapCursor, trackCar } = this.assets;
    const { actor, path, goal, drop } = this.data;

    map.clearTileOverlay();
    mapCursor.show();
    mapCursor.disable();
    trackCar.show();

    const toDrop = actor.loadedUnits[this.drop.which];

    const neighbors = map.neighborsAt(goal);
    this.tiles = [neighbors.up, neighbors.right, neighbors.down, neighbors.left]
      .filter( tile => (tile.occupiable(toDrop) || tile.unit === actor )
        && !(drop.map( d => d.where ).some( p => p.equal(new Point(tile.pos)) )) );
    this.tiles.forEach( tile => tile.moveFlag = true );

    if (!this.tiles.length)
      this.failTransition(`No locations to drop unit.`);

    if (!this.cursorMoved) {
      // Convoluted 'smart' auto-pick.
      const lastDir = (path && path[path.length-1]) || CardinalDirection.North;
      const { Up, Left, Right, Down } = Point;
      const dirSets = [   // This is highly dependent on CardinalDirection enum order
        [Up, Left, Right, Down], // None
        [Up, Left, Right, Down], // North
        [Right, Down, Up, Left], // East
        [Down, Left, Right, Up], // South
        [Left, Down, Up, Right], // West
      ];
      const smartSet = dirSets[lastDir];
      const cursorDir = smartSet.find( s => map.squareAt(goal.add(s)).moveFlag );
      const point = (cursorDir) ? cursorDir.add(goal) : new Point(this.tiles[0].pos);

      mapCursor.moveTo(point);
    }

    // Setup slider
    this.index = new Slider({
      max: this.tiles.length,
      track: this.tiles.findIndex( tile => new Point(mapCursor.pos).equal(tile) ) || 0,
      granularity: 1,
      looping: true,
    });
  }

  update() {
    const { map, mapCursor, gamepad } = this.assets;

    // Cursor select
    if (gamepad.button.dpadUp.pressed
    || gamepad.button.dpadLeft.pressed) {
      this.index.decrement();
      mapCursor.moveTo(new Point(this.tiles[this.index.output]));
      this.holdButton.start();
    }
    else if (gamepad.button.dpadDown.pressed
    || gamepad.button.dpadRight.pressed) {
      this.index.increment();
      mapCursor.moveTo(new Point(this.tiles[this.index.output]));
      this.holdButton.start();
    }

    // On press B, revert state
    else if (gamepad.button.B.pressed)
      this.regress();

    // On press A, advance to next state
    else if (gamepad.button.A.pressed) {
      const tile = map.squareAt(mapCursor.pos);
      if (tile.moveFlag) {
        this.drop.where = new Point(mapCursor.pos);
        this.data.drop.push(this.drop as CommandDropInstruction);
        this.advance(CommandMenu);
      }
    }

    if (gamepad.axis.dpad.returned)
      this.holdButton.stop();
  }

  close() {
    this.holdButton.stop();
  }

  prev() {
    const { map, mapCursor } = this.assets;
    const { place, goal } = this.data;

    map.clearTileOverlay();
    mapCursor.teleport(goal);

    map.squareAt(place).moveFlag = true;
    map.squareAt(goal).moveFlag = true;
  }
  
}