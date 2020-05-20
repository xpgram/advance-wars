import { Terrain } from "./Terrain";
import { Square } from "./Square";
import { NeighborMatrix } from "../../NeighborMatrix";
import { MapLayers } from "./MapLayers";
import { Game } from "../../..";
import { NumericDictionary, StringDictionary } from "../../CommonTypes";
import { TerrainObject, TerrainType } from "./TerrainObject";
import { UnitObject } from "../UnitObject";
import { TerrainMethods } from "./Terrain.helpers";
import { PointPrimitive, Point } from "../../Common/Point";
import { MoveType } from "../EnumTypes";
import { Debug } from "../../DebugUtils";
import { CardinalDirection, CardinalVector, CardinalVectorToCardinal } from "../../Common/CardinalDirection";
import { Common } from "../../CommonUtils";
import { inspect } from "util";
import { TileInspector } from "./TileInspector";
import { QueueSearch } from "../../Common/QueueSearch";

// Common error messages
function InvalidLocationError(point: PointPrimitive) {
    return `Attempting to access invalid grid location: (${point.x}, ${point.y})`;
}

/**
 * Builds and maintains a grid of terrain and unit types.
 * For all purposes, this class is the 'board' that players play on.
 * 
 * @author Dei Valko
 * @version 0.2.1
 */
export class Map {
    layers = MapLayers; // Reference to the dictionary of image layers

    /** 2D Dictionary (speedy) representing the grid of tiles and map entities.
     * Should never be used directly unless you intend to deal with the border of blank terrain objects. */
    private board: NumericDictionary< NumericDictionary<Square> > = {};

    /** Returns a z-index number based on the board-coordinates given. */
    static calculateZIndex(point: PointPrimitive, layer?: 'glass-overlay' | 'unit') {
        let layerDict: StringDictionary<number> = {
            'glass-overlay': 2,     // This is put above mountain shadows from left-adjacent.
            'unit': 3
        }

        let z = point.y*10 - point.x;
        if (layer)
            z += layerDict[layer];
        
        return z;
    }

    /** 
     * @param width The integer width of the board in tiles.
     * @param height The integer height of the board in tiles.
     */
    constructor(width: number, height: number) {
        this.layers.init();
        this.constructMap(width, height);

        let screenWidth = width * Game.display.standardLength;
        let screenHeight = height * Game.display.standardLength

        this.setupBoardMask(screenWidth, screenHeight);
        TerrainMethods.addSeaLayer(screenWidth, screenHeight);
        this.generateMap();     // Randomly generates a pleasant-looking map.
        this.forceLegalTiles(); // Removes any illegal tiles left behind by the map generation process.
        this.configureMap();    // Preliminary setup for things like sea-tiles knowing they're shallow.
        this.initializeMap();   // Ask all types to build their graphical objects.
        TerrainMethods.startPaletteAnimation();
    }

    /**  */
    destroy() {
        // TODO Destroy the Map
        // Break all Map → Square → Terrain/Unit → Sprite connections
        // I suspect PIXI can handle breaking all the stage layers I've created, but know this theory is untested.
        TerrainMethods.removeSeaLayer();    // Doesn't do anything.
        TerrainMethods.stopPaletteAnimation();
    }

    /** Applies a mask to the map to eliminate unwanted overdraw.
     * Primarily, this eliminates shadows drawn over the maps bottom edge. */
    setupBoardMask(width: number, height: number) {
        // Draw one tile-length above the map to the very bottom of the map (overdraw above ~is~ wanted.)
        let tileSize = Game.display.standardLength;
        let mapMask = new PIXI.Graphics();
        mapMask.beginFill(0xFFFFFF);
        mapMask.drawRect(0, -tileSize, width, height + tileSize);

        // Set the mask and add it to the stage; the mask should move with its object.
        MapLayers['top'].mask = mapMask;
        Game.stage.addChild(mapMask);
    }

    /** Builds the data structure representing the map given its width and height.
     * This method does not populate. */
    private constructMap(width: number, height: number) {
        // Enforce maximum
        if (width > Square.Max_Coords || height > Square.Max_Coords)
            throw "Map dimensions are too big! Cannot handle without increasing Square's memory allocation for coordinates."

        // Include a null-object border around the map.
        width += 2;
        height += 2;

        this.board = {};
        for (let x = 0; x < width; x++) {
            this.board[x] = {};
            for (let y = 0; y < height; y++) {
                this.board[x][y] = new Square(this, x-1, y-1);    // Squares don't "know about" there being a void perimeter.

                // Add null-object border
                if (x == 0 || x == (width - 1) || y == 0 || y == (height - 1))
                    this.board[x][y].terrain = new Terrain.Void();
            }
        }
    }

    /** Generates a random map of terrain types (not objects).
     * Implementation is a testing ground, don't get too hung up over the silliness of it. */
    private generateMap() {
        // Build a map of tiles based on chance-percentage spawns.
        for (let x = 0; x < this.width; x++)
        for (let y = 0; y < this.height; y++) {
            this.squareAt({x:x, y:y}).terrain = new Terrain.Plain();
        }

        // Set in some nice, big, blocky base-oceans.
        for (let x = 2; x < this.width-2; x++)
        for (let y = 2; y < this.height-2; y++) {
            if (Math.random() < 0.035) {
                for (let xx = -1; xx <= 1; xx++)
                for (let yy = -1; yy <= 1; yy++) {
                    let pos = {x:xx+x, y:yy+y};
                    this.squareAt(pos).terrain = new Terrain.Sea();
                }
            }
        }

        this.generateTile(Terrain.Sea,      [.02,.60,.70,.50,.60,.70,.70,.70,.70], 1, .10);
        this.generateTile(Terrain.Mountain, [.10,.15,.15,.15,.25,.30,.40,.40,.40],.4, 1);
        this.generateTile(Terrain.Wood,     [.08,.30,.30,.20,.20,.20,.20,.20,.20],.4, 1);
        this.generateTile(Terrain.HQ,       [.01,.01,.01,.01,.01,.01,.01,.01,.01],.3, 1);
        this.generateTile(Terrain.City,     [.05,.05,.05,.05,.05,.05,.05,.05,.05],.3, 1);
        this.generateTile(Terrain.Factory,  [.03,.03,.03,.03,.03,.03,.03,.03,.03],.3, 1);
        this.generateTile(Terrain.Airport,  [.03,.03,.03,.03,.03,.03,.03,.03,.03],.3, 1);
        this.generateTile(Terrain.Port,     [.01,.01,.01,.01,.01,.01,.01,.01,.01],.3, 1);
        this.generateTile(Terrain.Radar,    [.01,.01,.01,.01,.01,.01,.01,.01,.01],.3, 1);
        this.generateTile(Terrain.ComTower, [.01,.01,.01,.01,.01,.01,.01,.01,.01],.3, 1);
        this.generateTile(Terrain.Silo,     [.01,.01,.01,.01,.01,.01,.01,.01,.01],.3, 1);
        this.generateTile(Terrain.TempAirpt,[.01,.01,.01,.01,.01,.01,.01,.01,.01],.3, 1);
        this.generateTile(Terrain.TempPort, [.01,.01,.01,.01,.01,.01,.01,.01,.01],.3, 1);
        this.generateTile(Terrain.Ruins,    [.03,.05,.05,.05,.05,.05,.05,.05,.05],.3, 1);
        this.generateTile(Terrain.Wasteland,[.05,.15,.15,.15,.25,.30,.40,.40,.40],.4, 1);
        this.generateTile(Terrain.Road,     [.10,.98,.90,.70,.40,.05,.05,.05,.05],.4, .35);
        this.generateTile(Terrain.River,    [.05,.95,.80,.60,.40,.05,.05,.05,.05],.4, .35);
        this.generateTile(Terrain.Bridge,   [.03,.95,.60,.30,.10,.05,.05,.05,.05],.4, .35);
        this.generateTile(Terrain.Fire,     [.02,.02,.02,.02,.02,.02,.02,.02,.02],.3, 1);
        this.generateTile(Terrain.Beach,    [.10,.70,.90,.50,.20,.20,.20,.20,.20],.4, .7);
        this.generateTile(Terrain.Mist,     [.03,.50,.70,.50,.50,.20,.20,.20,.20],.3, .7);
        this.generateTile(Terrain.RoughSea, [.20,.20,.20,.10,.05,.05,.05,.05,.05],.3, .7);
        this.generateTile(Terrain.Reef,     [.20,.20,.20,.05,.05,.05,.05,.05,.05],.3, 1);
        this.generateTile(Terrain.Meteor,   [.01,.01,.01,.01,.01,.01,.01,.01,.01],.3, 1);
        this.generateTile(Terrain.Plasma,   [.02,.80,.60,.02,.02,.02,.02,.02,.02],.3, .30);
    }

    /** Auto-generates the given terrain type into the map based on the chance modifiers given.
     * @param type The type to populate with.
     * @param chanceMatrix A list of eight 0–1 numbers declaring the odds of terrain type spawning. Each index is how many same-type neighbors there are.
     * @param existingLandmarkRate Modifier which punishes (or boosts, depending) tiles for trying to spawn somewhere another type already exists.
     * @param diagonalRate Modifier which punishes or boosts tiles for having diagonal same-type neighbors.
     */
    private generateTile(type: TerrainType, chanceMatrix: number[], existingLandmarkRate: number, diagonalRate: number) {
        // Generate a list of indices to access the board
        let points: PointPrimitive[] = [];
        for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
            points.push({x:x,y:y});
        }}
        // Randomize list of points on the board — This should provide better seed → layout generation.
        for (let i = 0; i < points.length; i++) {
            // Randomly select two candidates
            let a = Math.floor(Math.random()*points.length);
            let b = Math.floor(Math.random()*points.length);
            // Skip if swap is pointless
            if (a == b)
                continue;
            // Swap
            let tmp = points[a];
            points[a] = points[b];
            points[b] = tmp;
        }

        function multipass(parent: Map, multipassRate: number) {
            for (let i = 0; i < points.length; i++) {
                // Get context and skip if pointless
                let pos = points[i];
                let neighbors = parent.neighboringTerrainAt(pos);
                let prevTile = parent.squareAt(pos).terrain;
                let newTile = new type(prevTile);

                if (type == neighbors.center.type) continue;
                if (newTile.legalPlacement(neighbors) == false) continue;

                // Neighbors should generate a score, not a flat rate.
                // But, I should also keep the flat rate; it's good for lines.

                // Calculate final chance ratio
                let sameKindNeighbors = neighbors.surrounding.filter( square => { return (square.type == type); }).length;
                let ratio = chanceMatrix[sameKindNeighbors];
                if (neighbors.left.type != type &&
                    neighbors.right.type != type &&
                    neighbors.up.type != type &&
                    neighbors.down.type != type)
                    ratio *= diagonalRate;
                if (newTile.landTile != neighbors.center.landTile &&
                    type != Terrain.Sea)
                    ratio *= 0.05;
                if (neighbors.center.type != Terrain.Plain &&
                    neighbors.center.type != Terrain.Sea)
                    ratio *= existingLandmarkRate;
                ratio *= multipassRate;

                // Finally, lay your cards on the table
                if (Math.random() < ratio) {
                    parent.squareAt(pos).terrain = newTile;
                }
            }
        }

        // Add terrain type to map
        multipass(this, 1);
        multipass(this, 0.7);
        // multipass(this, 0.4); // This is just too slow for such little product
    }

    /** One final board passover to make sure all tiles placed are still legally placed.
     * This step ensures no graphical mishaps after map-generation. */
    private forceLegalTiles() {
        for (let x = 0; x < this.width; x++)
        for (let y = 0; y < this.height; y++) {
            let pos = {x:x, y:y};
            let neighbors = this.neighboringTerrainAt(pos);

            // If the center tile is not legally placed among its neighbors, change it to whatever tile makes up its base (land or sea).
            if (neighbors.center.legalPlacement(neighbors) == false)
                this.squareAt(pos).terrain = (neighbors.center.landTile) ? new Terrain.Plain() : new Terrain.Sea();
        }
    }

    /** Iterates through the map, applying some preliminary settings to various tiles based on their surroundings.
     * Generally, this is so water tiles surrounding land knows it ought to be shallow. */
    private configureMap() {
        for (let x = 0; x < this.width; x++)
        for (let y = 0; y < this.height; y++) {
            let pos = {x: x, y: y};

            // Declare all non-land tiles near this land tile are shallow waters.
            let square = this.squareAt(pos);
            if (square.terrain.landTile ||
                square.terrain.shallowWaterSourceTile) {
                this.neighboringTerrainAt(pos).surrounding.forEach( terrain => {
                    terrain.shallowWater = true;
                });
            }
        }
    }

    /** Asks each tile on the board to set up its graphics objects and add them to the scene. */
    private initializeMap() {
        // Initialize each tile, providing its adjacent neighbors and game-world position (in pixels).
        for (let x = 0; x < this.width; x++)
        for (let y = 0; y < this.height; y++) {
            let neighbors = this.neighboringTerrainAt({x:x,y:y});
            let pos = {x:x,y:y};
            this.squareAt(pos).finalize(neighbors);
        }

        // Apply z-ordering. Bottom layer never overlaps——is fine.
        this.layers['top'].sortChildren();
    }

    /** Returns the horizontal size of the grid map, including the border columns. */
    private get trueWidth() {
        // Length minus the border of blank objects.
        return (this.board) ? Object.keys(this.board).length : 0;
    }

    /** Returns the vertical size of the grid map, including the border rows. */
    private get trueHeight() {
        // Length minus the border of blank objects.
        return (this.board && this.board[0]) ? Object.keys(this.board[0]).length : 0;
    }

    /** Return The horizontal size of the grid map. */
    get width() {
        // Returns the true width minus the null-object border columns.
        return (this.trueWidth) ? this.trueWidth - 2 : 0;
    }

    /** Return The vertical size of the grid map. */
    get height() {
        // Returns the true height minus the null-object border rows.
        return (this.trueHeight) ? this.trueHeight - 2 : 0;
    }

    /** Returns the Square object located at point pos on the game board.
     * Coordinates from (-1,-1) to (width, height) are technically allowed; the bordering void tiles exist at
     * these locations.
     * @param pos The location on the map to retrieve.
     */
    squareAt(pos: PointPrimitive): Square {
        // (-1,-1) and (width,height) refer to the border objects. They are secret.
        if (pos.x < -1 || pos.y < -1 || pos.x >= this.trueWidth || pos.y >= this.trueHeight)
            throw new Error(InvalidLocationError(pos));
        // Obviously, (-1,-1) isn't memory legal. +1 corrects.
        pos = {x: (pos.x + 1), y: (pos.y + 1)};
        return this.board[pos.x][pos.y];
    }

    /** Gathers the nearest-neighboring tiles adjacent to the tile at pos and returns them as a NeighborMatrix object.
     * @param pos The location on the map to inspect.
     */
    neighborsAt(pos: PointPrimitive): NeighborMatrix<Square> {
        if (!this.validPoint(pos))
            throw new Error(InvalidLocationError(pos));
        
        let list = [], square, cursor;
        pos = {x: (pos.x - 1), y: (pos.y - 1)};

        // Collect neighboring tiles
        for (let x = 0; x < 3; x++)
        for (let y = 0; y < 3; y++) {
            cursor = {x: (pos.x + x), y: (pos.y + y)};
            square = this.squareAt(cursor);     // this.squareAt(-1,-1) → Terrain.Void
            list.push(square);
        }

        return new NeighborMatrix(list);
    }

    /** Gathers the TerrainObjects nearest-neighboring the tile at pos and returns them as a NeighborMatrix object.
     * @param pos The location on the map to inspect.
     */
    neighboringTerrainAt(pos: PointPrimitive): NeighborMatrix<TerrainObject> {
        let neighbors = this.neighborsAt(pos);
        let list = neighbors.list.map( square => square.terrain );
        return new NeighborMatrix<TerrainObject>(list);
    }

    /**
     * @param unit Unit object to be placed on the grid.
     * @param pos The location on the map to place it.
     */
    placeUnit(unit: UnitObject, pos: PointPrimitive) {
        if (!this.validPoint(pos))
            throw new Error(InvalidLocationError(pos));
        this.squareAt(pos).unit = unit;
        unit.boardLocation = pos;
    }

    /** Removes and destroys a Unit object on the map.
     * @param pos The location on the map to modify.
     */
    removeUnit(pos: PointPrimitive) {
        if (!this.validPoint(pos))
            throw new Error(InvalidLocationError(pos));
        let square = this.squareAt(pos);
        if (square.unit) {
            square.unit.destroy();
            square.unit = null;
        }
    }

    /**
     * @param src Location of the unit to be moved.
     * @param dest Location to move the unit to.
     * @returns True if the operation was successful.
     * @throws If either src or dest are invalid locations.
     */
    moveUnit(src: PointPrimitive, dest: PointPrimitive): boolean {
        if (!this.validPoint(src))
            throw new Error(InvalidLocationError(src));
        if (!this.validPoint(dest))
            throw new Error(InvalidLocationError(dest));

        let traveler = this.squareAt(src).unit;
        
        if (traveler == null)
            return false;
        if (!this.squareAt(dest).occupiable(traveler))
            return false;

        this.removeUnit(src);
        this.placeUnit(traveler, dest);

        MapLayers['top'].sortChildren();

        return true;
    }

    /**
     * @param p A grid location to check the existence of.
     * @return True if point lies within the map's boundaries.
     */
    validPoint(p: PointPrimitive): boolean {
        return p.x >= 0 && p.x < this.width &&
               p.y >= 0 && p.y < this.height;
    }

    /** A base for the other map-clearing methods to lean on. This pattern helps ensure the map iter request
     * is always once only without lots of repeated code. */
    private clearMapValues(options: {tempVals?: boolean, colorFlags?: boolean, arrowPaths?: boolean}) {
        let temp = options.tempVals || false;
        let color = options.colorFlags || false;
        let arrows = options.arrowPaths || false;

        for (let y = 0; y < this.height; y++)
        for (let x = 0; x < this.width; x++) {
            let square = this.squareAt({x:x, y:y});

            if (temp) {
                square.value = -1;
                square.flag = false;
            }
            if (color) {
                square.moveFlag = false;
                square.attackFlag = false;
            }
            if (arrows) {
                square.arrowFrom = 0;
                square.arrowTo = 0;
            }
        }
    }

    /** Sets all temporary store values on the map to zero. Does not need to be called if any other clear-fields
     * method was called. */
    clearTemporaryValues() {
        this.clearMapValues({tempVals: true});
    }

    /**  */
    // TODO Rename this to clearMapForPathfinding() or something? At present, it isn't technically accurate.
    clearTileOverlay() {
        this.clearMapValues({tempVals: true, colorFlags: true});
    }

    /**  */
    clearTileArrows() {
        this.clearMapValues({arrowPaths: true});
    }

    /** Removes movement and attack flags from all squares on the map: flags important to the movement system;
     * and sets all temporary store values to zero. */
    clearMovementMap() {
        this.clearMapValues({tempVals: true, colorFlags: true, arrowPaths: true});
    }

    /** Returns true if, via the given unit, the point observed by inspector is an efficient
     * and valid node from which to expand algorithmic search. */
    private travelEvaluationFunction(unit: UnitObject, inspector: TileInspector) {
        let notVoidTerrain = inspector.square.terrain.type != Terrain.Void;
        let enoughMP = inspector.movePoints >= 0;
        let traversable = inspector.square.traversable(unit);
        let betterEfficiency = inspector.square.value < inspector.movePoints;

        return (notVoidTerrain && enoughMP && traversable && betterEfficiency);
    }

    /**  */
    // Rewrite the below algorithm with TileInspector and QueueSearch
    private generateColorMap(unit: UnitObject) {
        let inspector = new TileInspector(
            this,
            new Point(unit.boardLocation),
            unit.movementPoints,
            unit.moveType
        );

        Debug.assert(this.validPoint(inspector.point),
            `Given unit is located at ${inspector.point.toString()}, an invalid board loation.`);

        // Blank any previous map decorations (move and attack)
        this.clearTileOverlay();

        // Setup a method for projecting a unit's attack-range-shape from a given point.
        let projectAttackRange = (point: Point) => {
            // TODO Update this to make use of AttackShape maps

            this.neighborsAt(point).orthogonals.forEach( square => {
                if (!square.flag) {
                    square.attackFlag = square.targetable(unit);
                    square.flag = true;             // Mark this square as calculated.
                }
            });
        }
        
        //// ALGORITHM ////
        // Color all tiles the given unit may move into.
        new QueueSearch({
            firstNode: inspector,
            searchMode: QueueSearch.SearchMode.BreadthFirst,
            nodeHandler: (node: TileInspector) => {
                let tileEvaluation = this.travelEvaluationFunction(unit, node);
                let result = null;

                // If this square is algorithmically-travellable, add its neighbors to queue.
                if (tileEvaluation) {
                    let dirs = [CardinalDirection.North, CardinalDirection.West, CardinalDirection.South, CardinalDirection.East];
                    result = dirs.map( dir => node.moveDir(dir) );
                    result = result.filter( next => next.point.notEqual(node.point) );

                    node.square.moveFlag = true;            // Record this tile as travellable.
                    node.square.value = node.movePoints;    // Record the efficiency in reaching this tile.

                    if (node.square.occupiable(unit))
                        projectAttackRange(node.point);
                }
                
                return result;
            }
        });

        // Color all tiles the given unit may reach with an attack.
            // get unit's attack-shape (object which manages boolean[][])
            // get square of influence
            // from each inhabitable, project the attack shape onto the map
            //   (but if move-and-attack is false, only project the shape from the source point)
            // use square.value to mark squares which have already been targetability-checked
            //   (a minor optimization; a targetability check isn't intensive to begin with)
    }

    /** Returns a rectangle area by which a given unit may hypothetically interact. */
    squareOfInfluence(unit: UnitObject): PIXI.Rectangle {
        // Describe a square (2r + 1)^2, where r is movement range + max attack range.
        // Limit this square by the size of the board.
        let range = unit.movementPoints + 1; // TODO unit.maxAttackRange;
        let tl = {
            x: Common.confine(unit.boardLocation.x - range, 0, this.width - 1), // -1: this is considered an index value
            y: Common.confine(unit.boardLocation.y - range, 0, this.height - 1)
        }
        let br = {
            x: Common.confine(unit.boardLocation.x + range + 1, 0, this.width), // +1: include the column/row the unit exists in
            y: Common.confine(unit.boardLocation.y + range + 1, 0, this.height),
        }
        return new PIXI.Rectangle(tl.x, tl.y, (br.x - tl.x), (br.y - tl.y));
    }

    /** Given a source point (a square to move from) and the unit whom is traveling, ....*/
    generateMovementMap(unit: UnitObject) {
        this.generateColorMap(unit);

        let rect = this.squareOfInfluence(unit);
        for (let y = 0; y < rect.height; y++)
        for (let x = 0; x < rect.width; x++) {
            let square = this.squareAt({x: x + rect.x, y: y + rect.y});
            if (!square.attackable(unit))
                square.attackFlag = false;
        }
    }

    /** Shows on the map which tiles a given unit is capable of reaching for attack. Generated map
     * is clearable with Map.clearMovementMap(). */
    generateAttackRangeMap(unit: UnitObject) {
        this.generateColorMap(unit);

        let rect = this.squareOfInfluence(unit);
        for (let y = 0; y < rect.height; y++)
        for (let x = 0; x < rect.width; x++) {
            let square = this.squareAt({x: x + rect.x, y: y + rect.y});
            square.moveFlag = false;
        }
    }

    /** Given a new board location, re-route the board's mapping of some unit's projected travel
     * path to this new board location, if possible. */
    recalculatePathToPoint(unit: UnitObject, destination: PointPrimitive) {
        // If destination is not within movement range, don't bother — do not clear old path.
        if (this.squareAt(destination).moveFlag == false)
            return;

        // Closurable reference
        let map = this;

        // Algorithm flags/vars
        let newPathFound = false;
        let newPath: Point[] = [];  // Segment of path calculated by the algorithm from some point.

        // The traveler's base location.
        let sourcePoint = new Point(unit.boardLocation);
        
        // The inspector accesses the point/square being examined at any instant.
        let inspector = {
            point: sourcePoint.clone(),
            movePoints: unit.movementPoints,
            stepCounter: 0,
            lastMove: CardinalDirection.None,

            // Returns the square object located on the board at the point the inspector is watching.
            get square() { return map.squareAt(inspector.point); },

            // Resets the inspector to some condition
            reconfigure(point: Point, movePoints: number) {
                this.point = point;
                this.movePoints = movePoints;
                this.stepCounter = 0;
                this.lastMove = CardinalDirection.None;
            },
            // Move the inspector relative to its current position.
            moveInspector(point: Point) {
                this.point = this.point.add(point);
                this.movePoints -= this.square.terrain.getMovementCost(unit.moveType);
                this.stepCounter += 1;
                this.lastMove = CardinalVectorToCardinal(point);

                Debug.assert(this.stepCounter < 201,
                    `Path leading from traveler may be looping: steps counted > 200`);
            },
            // Returns the inspector to its last position, if one is known.
            // This is a convenience and not comprehensive. It only remembers single-space directions.
            undoLastMove() {
                if (this.lastMove) {
                    this.stepCounter -= 1;
                    this.movePoints += this.square.terrain.getMovementCost(unit.moveType);
                    this.point = this.point.add( CardinalVector(this.lastMove).negative() );
                    this.lastMove = CardinalDirection.None;
                }
            }
        }

        // An object describing the up-to-date current path leading from the traveler's square.
        let travelPath = {
            // A list of –all– points describing the traveler's journey (meaning it includes the traveler's location)
            points: (() => {
                let l = [sourcePoint];
                if (sourcePoint.equal(destination)) // As we check all other points below, so check this one here.
                    return l;

                // Compile any pre-existing travel path.
                inspector.reconfigure(sourcePoint, unit.movementPoints);
                while (inspector.square.arrowTo != 0) {
                    inspector.moveInspector( CardinalVector(inspector.square.arrowTo) );
                    l.push(inspector.point);

                    // If the destination point is found in the pre-existing path, save us some work.
                    if (inspector.point.equal(destination))
                        break;
                }

                return l;
            })(),

            // Returns the traveled path — all tiles excluding the one the unit is already stationed on.
            get path() {
                return this.points.slice(1, this.points.length);
            },

            // Returns true if the travel path crosses over the destination point.
            get containsDestination() {
                return this.last.equal(destination);    // ←— I can't think of a reason this wouldn't be true.
                return this.path.some( point => point.equal(destination) );
            },
            // Shortens the travel path by some number of travel steps. Cannot shorten to less than a travel distance of zero.
            shorten(n: number) {
                this.points.splice(this.points.length - n, n);
                // Path —always— contains unit's location.
                if (this.points.length == 0)
                    this.points = [sourcePoint];
            },
            // Reduces the travel path to an effective distance of zero.
            clear() {
                this.points = [sourcePoint];
            },
            // Returns the end point of this path
            get last() {
                return this.points[this.points.length - 1];
            },
            // Sums the travel cost of moving into each point given by path's list of points
            get travelCost() {
                return this.path.reduce( (sum: number, point: Point) => {
                    return sum + map.squareAt(point).terrain.getMovementCost(unit.moveType);
                }, 0);
            },
            // Returns the remaining travel points after travel through the end of this path.
            get remainingMovePoints() {
                return unit.movementPoints - this.travelCost;
            }
        }

        // Breadth-first search for the destination point.
        // Returns a list of points leading from the given point (exclusive) to the destination point (inclusive).
        function calculatePathFrom(point: Point, movePoints: number): Point[] {
            // Iterable list of cardinal vectors
            const directionVectors = [Point.Up, Point.Down, Point.Left, Point.Right];

            let newPath: Point[] = [];
            map.clearTemporaryValues();

            // Package containing up-to-current path and remaining move points.
            type queuedSquare = {path: Point[], movePoints: number};
            let queue: queuedSquare[] = [{
                path: [point],
                movePoints: movePoints
            }];

            while (queue.length) {
                let current = queue.shift() as queuedSquare;
                inspector.reconfigure(current.path[current.path.length - 1], current.movePoints);

                // Cancel-path checks
                let selfLooping = current.path.some(p => p.equal(inspector.point) && p !== inspector.point);
                let oldPathLooping = travelPath.path.some(p => p.equal(inspector.point) && p !== inspector.point);
                let notTraversable = !inspector.square.traversable(unit);
                let worseEfficiencyThanPrevious = current.movePoints <= inspector.square.value;
                let notEnoughTravelPoints = current.movePoints < 0;

                // Confirm this point is worth considering
                if (selfLooping || oldPathLooping || notTraversable || worseEfficiencyThanPrevious || notEnoughTravelPoints)
                    continue;

                // Inform next occurrence of this point in the search that we've been here.
                inspector.square.value = inspector.movePoints;

                // Check if we've found a path to the board location we're looking for.
                if (inspector.point.equal(destination)) {
                    current.path.shift();               // Remove the search's source point
                    newPath = current.path;             // Set our return result
                    break;                              // End search loop
                }

                // Add each cardinal direction to the search queue.
                directionVectors.forEach( dirVector => {
                    inspector.moveInspector(dirVector);

                    // Copy and extend current path
                    let nextPath = current.path.slice();
                    nextPath.push(inspector.point);

                    // Queue this new path for consideration later.
                    queue.push({
                        path: nextPath,
                        movePoints: inspector.movePoints
                    });

                    inspector.undoLastMove();
                });
            }

            // Return resulting path — which may be empty
            return newPath;
        }

        // Is destination contained in the old travelPath?
        newPathFound = travelPath.containsDestination;

        // Try calculating the new path from the n furthest travel points in the old path.
        for (let i = 0; i < 2; i++) {
            if (!newPathFound) {
                newPath = calculatePathFrom(travelPath.last, travelPath.remainingMovePoints);
                newPathFound = newPath.length > 0;

                // Roll back the path if a solution still wasn't found.
                if (!newPathFound)
                    travelPath.shorten(1);
            }
        }

        // Otherwise, completely recalculate a new path
        if (!newPathFound) {
            travelPath.clear();
            newPath = calculatePathFrom(travelPath.last, unit.movementPoints);
            newPathFound = newPath.length > 0;
        }

        // At this point, a new path ~must~ be found; if not, something went wrong.
        Debug.assert(newPathFound,
            `Could not find a path to the given destination.`);

        // Scrub the map of the old path and draw the new one.
        let path = travelPath.points.concat(newPath);
        this.clearTileArrows();
        for (let i = 1; i < path.length; i++) {
            let point2 = path[i];
            let point1 = path[i-1];
            this.squareAt(point1).arrowTo = CardinalVectorToCardinal( point2.subtract(point1) );
            this.squareAt(point2).arrowFrom = CardinalVectorToCardinal( point1.subtract(point2) );
        }
    }

    /** Prints the map's tile-contents to the console as a grid for inspection. */
    log() {
        let string = "";
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                string += this.squareAt({x:x,y:y}).terrain.name.slice(0,2) + ' ';
            }
            string += '\n';
        }

        console.log(string);
    }
}