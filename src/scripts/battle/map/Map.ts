import 'regenerator-runtime/runtime';
import { Terrain } from "./Terrain";
import { Square } from "./Square";
import { NeighborMatrix } from "../../NeighborMatrix";
import { MapLayer, MapLayerFunctions } from "./MapLayers";
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
import { TileInspector } from "./TileInspector";
import { QueueSearch } from "../../Common/QueueSearch";
import { RegionMap, CommonRangesRetriever } from "../unit-actions/RegionMap";

// Common error messages
function InvalidLocationError(point: PointPrimitive) {
    return `Attempting to access invalid grid location: (${point.x}, ${point.y})`;
}

/**
 * Builds and maintains a grid of terrain and unit types.
 * For all purposes, this class is the 'board' that players play on.
 * 
 * @author Dei Valko
 * @version 0.2.2
 */
export class Map {

    /** 2D array representing the grid of tiles and map entities.
     * Should never be used directly unless you intend to deal with the border of blank terrain objects. */
    private board: Square[][] = [];

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
        width = height = 50;

        MapLayerFunctions.Init();
        this.constructMap(width, height);

        let screenWidth = width * Game.display.standardLength;
        let screenHeight = height * Game.display.standardLength

        this.setupBoardMask(screenWidth, screenHeight);
        TerrainMethods.addSeaLayer(screenWidth, screenHeight);
        this.generateMap();     // Randomly generates a pleasant-looking map.
        this.forceLegalTiles(); // Removes any illegal tiles left behind by the map generation process.
        this.configureMap();    // Preliminary setup for things like sea-tiles knowing they're shallow.
        this.initializeMap();   // Ask all types to build their graphical objects.
        MapLayerFunctions.SortBatchLayerIntoPartitions();
        MapLayerFunctions.FreezeInanimateLayers();
        TerrainMethods.startPaletteAnimation();

        MapLayerFunctions.PostLayerIndexToConsole(); // TODO Remove
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
        MapLayer('top', 'static').mask = mapMask;
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

        this.board = [];
        for (let x = 0; x < width; x++) {
            this.board[x] = [];
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
        MapLayer('top', 'static').sortChildren();
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

        let p = {x: pos.x + 1, y: pos.y + 1};   // Void tile border adjustment
        return new NeighborMatrix(this.board, new Point(p));
    }

    /** Gathers the TerrainObjects nearest-neighboring the tile at pos and returns them as a NeighborMatrix object.
     * @param pos The location on the map to inspect.
     */
    neighboringTerrainAt(pos: PointPrimitive): NeighborMatrix<TerrainObject> {
        let neighbors = this.neighborsAt(pos);
        return neighbors.map( square => square.terrain );
    }

    /** Returns an iterable of all squares along the traced travel path starting from pos.
     * @param pos (Point) The path-start board location.
     * @throws Error: Inferred path is looping indefinitely.
     */
    private pathIterableFrom(pos: Point): Iterable<Square> {
        const map = this;
        const maxSteps = 200;

        return { *[Symbol.iterator]() {
            let stepCount = 0;
            let point = pos.clone();
            let square = map.squareAt(point);
            let dir = square.arrowTo;

            while (dir) {
                yield square;
                point = point.add(CardinalVector(dir));
                square = map.squareAt(point);
                dir = square.arrowTo;
                stepCount++;

                if (stepCount > maxSteps)
                    throw `Inferred path might be looping indefinitely; exceeded ${maxSteps} steps.`;
            }
        }}
    }

    // After a refactor, pathFrom is the only method to still use pathIterable, but... eh.

    /** Returns a list of directions from the given point to some other as they have been
     * drawn with the map's square-linking system.
     * @param pos The path-start board location.
     * @throws Error: Inferred path is looping indefinitely.
     */
    pathFrom(pos: Point): CardinalDirection[] {
        const path: CardinalDirection[] = [];
        for (const square of this.pathIterableFrom(pos)) {
            path.push(square.arrowTo);
        }
        return path;
    }

    /** Returns the cumulative travel cost for the given path and movement type.
     * @param start The path-start point location.
     * @param path The list of directions.
     * @param moveType The method of travel which infers the cost.
     */
    travelCostForPath(start: Point, path: CardinalDirection[], moveType: MoveType): number {
        let inspector = new TileInspector(this, start, 0, moveType);
        for (const dir of path)
            inspector = inspector.moveDir(dir);
        const travelCost = Math.abs(inspector.movePoints);
        return travelCost;
    }

    /** Connects a unit to a location cell on this map. Useful for spawning.
     * Do NOT use this method to move units on the board.
     * @param unit Unit object to be placed on the board.
     * @param pos The location on the map to modify.
     */
    placeUnit(unit: UnitObject, pos: Point) {
        if (!this.validPoint(pos))
            throw new Error(InvalidLocationError(pos));
        this.squareAt(pos).unit = unit;
        unit.boardLocation = pos;
    }

    /** Removes a Unit object on the map. Does not destroy it.
     * @param pos The location on the map to modify.
     */
    removeUnit(pos: PointPrimitive) {
        if (!this.validPoint(pos))
            throw new Error(InvalidLocationError(pos));
        let square = this.squareAt(pos);
        if (square.unit) {
            square.unit = null;
        }
    }

    /**
     * @param src Location of the unit to be moved.
     * @param dest Location to move the unit to.
     * @returns True if the operation was successful.
     * @throws If either src or dest are invalid locations.
     */
    moveUnit(src: Point, dest: Point): boolean {
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

        MapLayer('top', 'static').sortChildren();

        return true;
    }

    /** Removes and destroys a Unit object on the map.
     * @param pos The location on the map to modify.
     */
    destroyUnit(pos: PointPrimitive) {
        if (!this.validPoint(pos))
            throw new Error(InvalidLocationError(pos));
        let square = this.squareAt(pos);
        if (square.unit) {
            square.unit.destroy();
            square.unit = null;
        }
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

    /** Sets all temporary store values on the map to zero.
     * Note that this method is often invoked by other clear-fields methods. */
    clearTemporaryValues() {
        this.clearMapValues({tempVals: true});
    }

    /** Sets all colored tile overlays to off and clears all temporary store values. */
    clearTileOverlay() {
        this.clearMapValues({tempVals: true, colorFlags: true});
    }

    /** Sets all arrow-path overlays to off. */
    clearTileArrows() {
        this.clearMapValues({arrowPaths: true});
    }

    /** Sets all colored tile and arrow-path overlays to off and clears all temporary store values. */
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

    /** Given a unit to project from, draws the unit's movement and attack reach onto the map
     * via settable flags on each Square object. */
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

        // Projects a unit's attack-range-shape from a given point.
        const projectAttackRange = (origin: Point) => {
            const attackRange = unit.rangeMap;
            const affectedPoints = (
                attackRange.points
                .map( p => p.add(origin) )
                .filter( p => this.validPoint(p) )
            );
            affectedPoints.forEach( p => {
                let square = this.squareAt(p);
                if (!square.flag) {
                    square.attackFlag = true;
                    square.flag = true;
                }
            });
        }
        
        /// Algorithm ///
        // Color all tiles the given unit may move into.
        new QueueSearch({
            firstNode: inspector,
            searchMode: QueueSearch.SearchMode.BreadthFirst,
            nodeHandler: (node: TileInspector) => {
                let tileEvaluation = this.travelEvaluationFunction(unit, node);
                let result = null;

                // If this square is algorithmically travellable, add its neighbors to queue.
                if (tileEvaluation) {
                    let dirs = [CardinalDirection.North, CardinalDirection.West, CardinalDirection.South, CardinalDirection.East];
                    result = dirs.map( dir => node.moveDir(dir) );
                    result = result.filter( next => next.point.notEqual(node.point) );

                    node.square.moveFlag = true;            // Record this tile as travellable.
                    node.square.value = node.movePoints;    // Record the efficiency in reaching this tile.

                    if (node.square.occupiable(unit)) {
                        if (unit.canMoveAndAttack || node.point.equal(unit.boardLocation))
                            projectAttackRange(node.point);
                    }
                }
                
                return result;
            }
        });
    }

    /** Returns a rectangle area by which a given unit may hypothetically interact. */
    squareOfInfluence(unit: UnitObject): PIXI.Rectangle {
        // Describe a square (2r + 1)^2, where r is movement range + max attack range.
        // Limit this square by the size of the board.
        let range = unit.movementPoints + unit.range.max;
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

    /** Given a unit, shows the nearby squares reachable by movement. */
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

    /** Given a unit, shows the nearby squares attackable from some reachable position. */
    generateAttackRangeMap(unit: UnitObject) {
        this.generateColorMap(unit);

        let rect = this.squareOfInfluence(unit);
        for (let y = 0; y < rect.height; y++)
        for (let x = 0; x < rect.width; x++) {
            let square = this.squareAt({x: x + rect.x, y: y + rect.y});
            square.moveFlag = false;
        }
    }

    /** Recalculates the travel path from some unit to some location which can 'see' the
     * destination point and draws it onto the map via the square-linking system. The
     * recalculated path prefers similarity to the old path to a degree.
     * @param unit The travelling unit.
     * @param destination The board location to pathfind to.
     * @param rangeMap A map which describes relationally which locations 'see' the destination.
     * By default, this is the unit's point location post travel.
     */
    // TODO Left a little messy. Clean it up.
    recalculatePathToPoint(unit: UnitObject, destination: PointPrimitive, rangeMap?: RegionMap) {
        // TODO This is done.. ish. I feel I've left it a little messy, though. But it works.
        // TODO Export some common RegionMaps in the RegionMap class file.
        // Default rangeMap is the point-location: i.e. a range of 0.
        const rangeMapSelf = CommonRangesRetriever({min: 0, max: 0});
        let range = rangeMap || rangeMapSelf;
        // TODO TurnState, I think, has to be the one to determine whether the cursor is on
        // an enemy and needs to pass in Adjacents or not.
        // If we assume I don't know what kind of attack unit is about to use, having
        // TurnState pass this in makes sense, I suppose.

        // If destination is not reachable (pre-calculated), then don't bother — do not clear old path.
        if (this.squareAt(destination).moveFlag == false)
            return;

        // TODO Standardize/fold-together these error messages.
        Debug.assert(this.validPoint(unit.boardLocation),
            `Given unit is located at ${new Point(unit.boardLocation).toString()}, an invalid board location.`);
        Debug.assert(this.validPoint(destination),
            `Given destination is located at ${new Point(destination).toString()}, an invalid board location.`);
        
        // Setup the inspector and any pre-existing track.
        let inspector = new TileInspector(
            this,
            new Point(unit.boardLocation),
            unit.movementPoints,
            unit.moveType
        );
        inspector = inspector.buildExistingTrack();
        
        /** Returns true if destination is within the shape described by rangeMap relative to the inspector. */
        let withinRange = (node: TileInspector) => {
            let relative = new Point(destination).subtract(node.point);
            return range.get(relative);
        }

        // Map crawling algorithm
        // Extends the first node out as far as its remaining travel points will allow,
        // looking for a position from which the destination is visible through the range map.
        let newPathfinder = (firstNode: TileInspector) => {
            return new QueueSearch({
                firstNode: firstNode,
                searchMode: QueueSearch.SearchMode.BreadthFirst,
                nodeHandler: (node: TileInspector) => {
                    let tileEvaluation = this.travelEvaluationFunction(unit, node);
                    let result = null

                    // If this square is algorithmically travellable, add its neighbors to queue.
                    if (tileEvaluation) {
                        let dirs = [CardinalDirection.North, CardinalDirection.West, CardinalDirection.South, CardinalDirection.East];
                        result = dirs.map( dir => node.moveDir(dir) );
                        result = result.filter( next => next.point.notEqual(node.point) );

                        node.square.moveFlag = true;            // Record this tile as travellable.
                        node.square.value = node.movePoints;    // Record the efficiency in reaching this tile.

                        if (node.point.equal(destination) || node.square.occupiable(unit))
                            if (withinRange(node))
                                return "break";
                    }

                    // Between this and generateColorMap, "if occupiable" are the only
                    // different bits. I could write a map crawler that calls a function on
                    // every square reached. If it's worth it.
                    // TODO Map crawler?

                    return result;
                }
            });
        }

        let lastIdx = inspector.path.length - 1;
        let pathIndices = [lastIdx, (lastIdx - 1), 0];  // "Search from position" pattern: cur, prev, base

        //@ts-ignore The search-result container.
        let search: QueueSearch<TileInspector> = null;

        // Step 1: If destination exists in path, shorten and return.
        let destIdx = inspector.path.findIndex( p => p.equal(destination) );
        if (destIdx != -1) inspector = inspector.shortenToIndex(destIdx);

        // Step 2: If not, invoke the map crawler until a solution is found.
        if (!withinRange(inspector)) {
            for (let i of pathIndices) {
                this.clearTemporaryValues();
                inspector = inspector.shortenToIndex(i);
                search = newPathfinder(inspector);
                if (search.resultNode && withinRange(search.resultNode)) {
                    inspector = (search.resultNode as TileInspector);
                    break;
                }
            }
        }

        // At this point, a new path ~must~ be found; if not, something went wrong.
        Debug.assert(withinRange(inspector), `Could not find a path to the given destination.`);

        // Clear the existing path and bake-in the new one.
        this.clearTileArrows();
            // TODO Modify method to use squareOfInfluence()?
            // Maybe not (unit) but (square). All clear...() methods should allow me to pass in
            // an area they're to scrub. By default, the whole map.
        
        for (let i = 1; i < inspector.path.length; i++) {
            let point2 = inspector.path[i];
            let point1 = inspector.path[i-1];
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