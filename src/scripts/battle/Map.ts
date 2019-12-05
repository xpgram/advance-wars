import * as PIXI from "pixi.js";
import { Terrain } from "./Terrain";
import { Square } from "./Square";
import { NeighborMatrix } from "../NeighborMatrix";
import { MapLayers } from "./MapLayers";
import { Game } from "../..";
import { NumericDictionary, Point } from "../CommonTypes";
import { TerrainObject, TerrainType } from "./TerrainObject";
import { UnitObject } from "./UnitObject";
import { TerrainMethods } from "./Terrain.helpers";

// Common error messages
function InvalidLocationError(point: Point) {
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
                this.board[x][y] = new Square(x, y);

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
        let points: Point[] = [];
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
                let neighbors = parent.neighborsAt(pos);
                let prevTile = parent.squareAt(pos).terrain;
                let newTile = new type(prevTile);

                if (type == neighbors.center.type) continue;
                if (newTile.legalPlacement(neighbors) == false) continue;

                // Neighbors should generate a score, not a flat rate.
                // But, I should also keep the flat rate; it's good for lines.

                // Calculate final chance ratio
                let sameKindNeighbors = neighbors.list.filter((tile: TerrainObject) => { return (tile.type == type); }).length;
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
            let neighbors = this.neighborsAt(pos);

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
                this.neighborsAt(pos).list.forEach(tile => {
                    tile.shallowWater = true;
                });
            }
        }
    }

    /** Asks each tile on the board to set up its graphics objects and add them to the scene. */
    private initializeMap() {
        let tileSize = Game.display.standardLength;

        // Initialize each tile, providing its adjacent neighbors and game-world position (in pixels).
        for (let x = 0; x < this.width; x++)
        for (let y = 0; y < this.height; y++) {
            let neighbors = this.neighborsAt({x:x,y:y});
            let pos = {x:x,y:y};
            let worldPos = {x: x * tileSize, y: y * tileSize, z: (y*2 - x)*10};
            this.squareAt(pos).terrain.init(neighbors, worldPos);
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
    squareAt(pos: Point): Square {
        // (-1,-1) and (width,height) refer to the border objects. They are secret.
        if (pos.x < -1 || pos.y < -1 || pos.x >= this.trueWidth || pos.y >= this.trueHeight)
            throw new Error(InvalidLocationError(pos));
        // Obviously, (-1,-1) isn't memory legal. +1 corrects.
        pos = {x: (pos.x + 1), y: (pos.y + 1)};
        return this.board[pos.x][pos.y];
    }

    /** Gathers the nearest-neighboring tiles adjacent to the tile at pos and returns them as a ProximityBox object.
     * @param pos The location on the map to inspect.
     */
    neighborsAt(pos: Point): NeighborMatrix<TerrainObject> {
        if (!this.validPoint(pos))
            throw new Error(InvalidLocationError(pos));
        
        let list = [], terrain, cursor;
        pos = {x: (pos.x - 1), y: (pos.y - 1)};

        // Collect neighboring tiles
        for (let x = 0; x < 3; x++)
        for (let y = 0; y < 3; y++) {
            cursor = {x: (pos.x + x), y: (pos.y + y)};
            terrain = this.squareAt(cursor).terrain;    // this.squareAt(-1,-1) → Terrain.Void
            list.push(terrain);
        }

        return new NeighborMatrix(list);
    }

    /**
     * @param unit Unit object to be placed on the grid.
     * @param pos The location on the map to place it.
     */
    placeUnit(unit: UnitObject, pos: Point) {
        if (!this.validPoint(pos))
            throw new Error(InvalidLocationError(pos));
        this.squareAt(pos).unit = unit;
        unit.boardLocation = pos;
    }

    /** Removes and destroys a Unit object on the map.
     * @param pos The location on the map to modify.
     */
    removeUnit(pos: Point) {
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
    moveUnit(src: Point, dest: Point): boolean {
        if (!this.validPoint(src))
            throw new Error(InvalidLocationError(src));
        if (!this.validPoint(dest))
            throw new Error(InvalidLocationError(dest));
        if (!this.squareAt(dest).occupiable)
            return false;
        // check if src.unit is null?

        let traveler = this.squareAt(src).unit;
        if (!traveler)
            throw new Error("Attempting to move a unit that does not exist: " + src + " to " + dest)
        
        this.placeUnit(traveler, dest);
        this.removeUnit(src);

        // TODO This would be the prime location for a send-message in an Object Listener pattern…
        // ↑ Although, I forget why.
        // Oh. Just that something moved. Uh. Nah, I still don't remember why.
        return true;
    }

    /**
     * @param p A grid location to check the existence of.
     * @return True if point lies within the map's boundaries.
     */
    validPoint(p: Point): boolean {
        return p.x >= 0 && p.x < this.width &&
               p.y >= 0 && p.y < this.height;
    }

    /**
     * Prints the map's tile-contents to the console as a grid for inspection.
     */
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