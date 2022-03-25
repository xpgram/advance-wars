import { CardinalDirection, CardinalVectorToCardinal } from "../../../Common/CardinalDirection";
import { Point } from "../../../Common/Point";
import { RadialPointSelector } from "../../../RadialPointSelector";
import { CommandDropInstruction } from "../CommandInstruction";
import { TurnState } from "../TurnState";

export class DropLocation extends TurnState {
  get type() { return DropLocation; }
  get name() { return 'DropLocation'; }
  get revertible() { return true; }
  get skipOnUndo() { return false; }

  cursorMoved = false;
  toDrop!: {
    which: number,
    where?: Point,
  };

  private radialPoints!: RadialPointSelector;

  onAdvance() {
    const { which } = this.data;
    this.toDrop = {
      which,
    }
  }

  onRegress() {
    const { map, mapCursor } = this.assets;
    const { drop } = this.data;
    
    const { which, where } = drop.pop() as typeof this.toDrop;
    this.toDrop = {
      which,
    }

    if (!where)
      return;

    mapCursor.teleportTo(where);
    map.squareAt(where).clearValues({arrowPaths: true});
    this.cursorMoved = true;
  }

  configureScene() {
    const { map, mapCursor, trackCar, gamepad } = this.assets;
    const { stagePointerInterface: pointer } = this.assets.scripts;
    const { actor, path, goal, drop } = this.data;

    map.clearTileOverlay();
    mapCursor.show();
    mapCursor.disable();
    trackCar.show();

    pointer.enable();
    pointer.mode = 'highlighted';
    pointer.onMoveCursor = (location) => {
      this.radialPoints.setIndexToPoint(location);
    }

    const toDrop = actor.cargo[this.toDrop.which];

    const neighbors = map.neighborsAt(goal);
    const tiles = neighbors.orthogonals
      .filter( tile => (tile.occupiable(toDrop) || (tile.traversable(toDrop) && tile.unit === actor) )
        && !(drop.map( d => d.where ).some( p => p.equal(new Point(tile.boardLocation)) )) );
    tiles.forEach( tile => tile.moveFlag = true );

    if (!tiles.length)
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
      const point = (cursorDir) ? cursorDir.add(goal) : new Point(tiles[0].boardLocation);

      mapCursor.moveTo(point);
    }

    // Setup selector
    this.radialPoints = new RadialPointSelector({
      gamepad,
      origin: goal,
      points: tiles.map( t => new Point(t.boardLocation) ),
      startingPoint: mapCursor.boardLocation,
      onIncrement: p => mapCursor.moveTo(p),
    })
  }

  update() {
    const { map, mapCursor, gamepad } = this.assets;
    const { stagePointerInterface: pointer } = this.assets.scripts;
    const { actor, drop } = this.data;

    // On press B, revert state
    if (gamepad.button.B.pressed || pointer.cancelIntent)
      this.regress();

    // On press A, advance to next state
    else if (gamepad.button.A.pressed || pointer.affirmIntent) {
      const tile = map.squareAt(mapCursor.boardLocation);
      if (tile.moveFlag) {
        this.toDrop.where = new Point(mapCursor.boardLocation);
        drop.push(this.toDrop as CommandDropInstruction);

        // Configure drop-tile UI
        if (drop.length < actor.cargo.length) {
          const point = mapCursor.boardLocation.subtract(actor.boardLocation);
          tile.arrowTo = CardinalVectorToCardinal(point);
          tile.showDropArrow = true;
        }

        this.advance();
      }
    }
  }

  close() {
    this.radialPoints.destroy();
  }

  prev() {
    const { map, mapCursor } = this.assets;
    const { place, goal } = this.data;

    map.clearTileOverlay();
    mapCursor.teleportTo(goal);

    map.squareAt(place).moveFlag = true;
    map.squareAt(goal).moveFlag = true;
  }
  
}