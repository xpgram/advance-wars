//@ts-check

import { Terrain } from "./Terrain";
import { Square } from "./Square";
import { NeighborMatrix } from "../NeighborMatrix";
import { LowResTransform } from "../LowResTransform";
import { MapLayers } from "./MapLayers";
import { Game } from "../..";

/**
 * @typedef Point
 * @property {number} x number coordinate
 * @property {number} y number coordinate
 */

// Error Messages
function InvalidLocationError(point) {
    return `Attempting to access invalid grid location: (${point.x}, ${point.y})`;
}

/**
 * 
 * @author Dei Valko
 * @version 0.1.1
 */
export class Map {
    layers = MapLayers; // Reference to the dictionary of image layers

    /**
     * 2D Dictionary (speedy) representing the grid of tiles and map entities.
     * Should never be used directly unless you intend to deal with the border of blank terrain objects.
     * @type {Object.<number, Object.<number, Square>>} 
     */
    _board;

    /**
     *
     * @param {number} width 
     * @param {number} height 
     */
    constructor(width, height) {
        this.layers.init();
        this._constructMap(width, height); // 15,10 will eventually be given by some kind of map file. I just realized this can be JSON. Hell yeah.
        this._generateMap();        // Generates a pleasant-looking map.
        this._initializeMap();     // Turn all types into objects.
        this._configureMap();       // Preliminary setup for things like sea-tiles knowing they're shallow.
        this._blendMap();           // Ask each tile to formally align themselves with their surroundings (e.g.: sea(neighbors) → shallow/cliff sprites)
    }

    /**
     * I don't even know where to begin.
     * Should probably destroy layers, and that will destroy textures (it should)
     * Then destroy all terrain objects in the board (units too, prolly)
     * Then forget the board.
     */
    destroy() {

    }

    /**
     * Builds the data structure representing the map given its width and height.
     * This method does not populate.
     * @param {number} width
     * @param {number} height 
     */
    _constructMap(width, height) {
        // Enforce maximum
        if (width > Square.MAX_COORDS || height > Square.MAX_COORDS)
            throw "Map dimensions are too big! Cannot handle without increasing Square's memory allocation for coordinates."

        // Include a null-object border around the map.
        width += 2;
        height += 2;

        this._board = {};
        for (let x = 0; x < width; x++) {
            this._board[x] = {};
            for (let y = 0; y < height; y++) {
                this._board[x][y] = new Square(x, y);

                // Add null-object border
                if (x == 0 || x == (width - 1) || y == 0 || y == (height - 1))
                    this._board[x][y].terrain = new Terrain.Void();
            }
        }
    }

    /**
     * Generates a random map of terrain types (not objects).
     * Implementation is a testing ground, don't get too hung up over the silliness of it.
     */
    _generateMap() {
        // Build a map of tiles based on chance-percentage spawns.
        for (let x = 0; x < this.width; x++)
        for (let y = 0; y < this.height; y++) {
            this.squareAt({x:x, y:y}).terrain = new Terrain.Plain();
        }

        for (let x = 2; x < this.width-2; x++)
        for (let y = 2; y < this.height-2; y++) {
            if (Math.random() < 0.01) {
                for (let xx = -3; xx < 4; xx++)
                for (let yy = -3; yy < 4; yy++) {
                    let pos = {x:xx+x, y:yy+y};
                    this.squareAt(pos).terrain = new Terrain.Sea();
                }
            }
        }

        this._generateTile(Terrain.Sea,      [.02,.60,.70,.50,.60,.70,.70,.70,.70], 1, .10);
        this._generateTile(Terrain.Mountain, [.10,.15,.15,.15,.25,.30,.40,.40,.40],.4, 1);
        this._generateTile(Terrain.Wood,     [.08,.30,.30,.20,.20,.20,.20,.20,.20],.4, 1);
        this._generateTile(Terrain.City,     [.05,.05,.05,.05,.05,.05,.05,.05,.05],.3, 1);
        this._generateTile(Terrain.Ruins,    [.03,.05,.05,.05,.05,.05,.05,.05,.05],.3, 1);
        this._generateTile(Terrain.Wasteland,[.05,.15,.15,.15,.25,.30,.40,.40,.40],.4, 1);
        this._generateTile(Terrain.Road,     [.10,.98,.90,.70,.40,.05,.05,.05,.05],.4, .35);
        this._generateTile(Terrain.River,    [.05,.90,.80,.60,.40,.05,.05,.05,.05],.4, .35);
        this._generateTile(Terrain.Bridge,   [.05,.98,.90,.70,.40,.05,.05,.05,.05],.4, .35);
        this._generateTile(Terrain.Fire,     [.02,.02,.02,.02,.02,.02,.02,.02,.02],.3, 1);
        this._generateTile(Terrain.Beach,    [.10,.70,.90,.50,.20,.20,.20,.20,.20],.4, .7);
        this._generateTile(Terrain.Mist,     [.03,.50,.70,.50,.50,.20,.20,.20,.20],.3, .7);
        this._generateTile(Terrain.RoughSea, [.20,.20,.20,.10,.05,.05,.05,.05,.05],.3, .7);
        this._generateTile(Terrain.Reef,     [.20,.20,.20,.05,.05,.05,.05,.05,.05],.3, 1);
    }

    _generateTile(type, chanceMatrix, existingLandmarkRate, diagonalRate) {
        // Generate a list of indices to access the board
        let points = [];
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

        function multipass(parent, multipassRate) {
            for (let i = 0; i < points.length; i++) {
                // Get context and skip if pointless
                let pos = points[i];
                let neighbors = parent.neighborsAt(pos);
                if (type == neighbors.center.type) continue;
                if (type.legalPlacement(neighbors) == false) continue;

                // Build our new tile
                let prevTile = parent.squareAt(pos).terrain;
                let newTile = new type(prevTile);

                // Neighbors should generate a score, not a flat rate.
                // But, I should also keep the flat rate; it's good for lines.

                // Calculate final chance ratio
                let sameKindNeighbors = neighbors.list.filter(tile => { return (tile.type == type); }).length;
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
        multipass(this, 0.4);
    }

    /**
     * Asks each tile on the board to set up its graphics objects and add them to the scene.
     */
    _initializeMap() {
        let tileSize = Game().display.standardLength;

        for (let x = 0; x < this.width; x++)
        for (let y = 0; y < this.height; y++) {
            // Build a transform for each tile (they'll never move, anyway)
            let trans = new LowResTransform();
            trans.position.x = x * tileSize;
            trans.position.y = y * tileSize;
            trans.position.z = (trans.position.y - trans.position.x) * 10;  // Leaves room for units and highlights, etc.

            // Initialize
            let pos = {x: x, y: y};
            this.squareAt(pos).terrain.init(trans);
        }

        // Apply z-ordering. Bottom layer never overlaps——is fine.
        this.layers['top'].sortChildren();
    }

    /**
     * Iterates through the map, applying some preliminary settings to various tiles based on their surroundings.
     * Generally, this is so water tiles surrounding land knows it ought to be shallow.
     */
    _configureMap() {
        for (let x = 0; x < this.width; x++)
        for (let y = 0; y < this.height; y++) {
            let pos = {x: x, y: y};

            // Declare all non-land tiles near this land tile are shallow waters.
            let square = this.squareAt(pos);
            if (square.terrain.landTile ||
                square.terrain.type == Terrain.Mist ||
                square.terrain.type == Terrain.Reef ||
                square.terrain.type == Terrain.Beach ||
                square.terrain.type == Terrain.Meteor) {
                let neighbors = this.neighborsAt(pos);
                for (let i = 0; i < neighbors.list.length; i++) {
                    if (!neighbors.list[i].landTile &&
                        !neighbors.list[i].shallowWaters) {
                        neighbors.list[i].shallowWaters = true;
                    }
                }
            }
        }
    }

    /**
     * Runs all terrain object's orientation methods, passing in their proximal neighbors.
     * → Gets Terrain.Sea to pick a cliff graphic that matches how many land tiles are nearby.
     */
    _blendMap() {
        for (let x = 0; x < this.width; x++)
        for (let y = 0; y < this.height; y++) {
            let pos = {x: x, y: y};
            let neighbors = this.neighborsAt(pos);
            this.squareAt(pos).terrain.orientSelf(neighbors);
        }
    }

    /**
     * @return {Number} The horizontal size of the grid map, including the border columns.
     */
    get _trueWidth() {
        // Length minus the border of blank objects.
        return (this._board) ? Object.keys(this._board).length : 0;
    }

    /**
     * @return {Number} The vertical size of the grid map, including the border rows.
     */
    get _trueHeight() {
        // Length minus the border of blank objects.
        return (this._board && this._board[0]) ? Object.keys(this._board[0]).length : 0;
    }

    /**
     * @return {Number} The horizontal size of the grid map.
     */
    get width() {
        // Returns the true width minus the null-object border columns.
        return (this._trueWidth) ? this._trueWidth - 2 : 0;
    }

    /**
     * @return {Number} The vertical size of the grid map.
     */
    get height() {
        // Returns the true height minus the null-object border rows.
        return (this._trueHeight) ? this._trueHeight - 2 : 0;
    }

    /**
     * @param {Point} pos Any object with x and y properties (integers).
     * @returns {Square} A grid-location container object.
     */
    squareAt(pos) {
        // (-1,-1) and (width,height) refer to the border objects. They are secret.
        if (pos.x < -1 || pos.y < -1 || pos.x >= this._trueWidth || pos.y >= this._trueHeight)
            throw InvalidLocationError(pos);
        // Obviously, (-1,-1) isn't memory legal. +1 corrects.
        pos = {x: (pos.x + 1), y: (pos.y + 1)};
        return this._board[pos.x][pos.y];
    }

    /**
     * Gathers the nearest-neighboring tiles adjacent to the tile at pos and returns them as a ProximityBox object.
     * @param {Point} pos The location on the map to inspect.
     * @returns {ProximityBox}
     */
    neighborsAt(pos) {
        if (!this.validPoint(pos))
            throw InvalidLocationError(pos);
        
        let list = [], terrain, cursor;
        pos = {x: (pos.x - 1), y: (pos.y - 1)};

        // Collect neighboring tiles
        for (let x = 0; x < 3; x++)
        for (let y = 0; y < 3; y++) {
            cursor = {x: (pos.x + x), y: (pos.y + y)};
            terrain = this.squareAt(cursor).terrain;    // this.squareAt(-1,-1) → Terrain.Void
            list.push(terrain);
        }

        return new ProximityBox(list);
    }

    /**
     * @param {Unit} unit Unit object to be placed on the grid.
     * @param {Point} pos Any object with x and y properties (integers).
     */
    placeUnit(unit, pos) {
        if (!this.validPoint(pos))
            throw InvalidLocationError(pos);
        this.squareAt(pos).unit = unit;
    }

    /**
     * @param {Point} pos Any object with x and y properties (integers).
     */
    removeUnit(pos) {
        if (!this.validPoint(pos))
            throw InvalidLocationError(pos);
        this.squareAt(pos).unit.destroy();
        this.squareAt(pos).unit = null;
    }

    /**
     * @param {Point} src Location of the unit to be moved. Accepts any object with x and y properties (integers).
     * @param {Point} dest Location to move the unit to. Accepts any object with x and y properties (integers).
     * @returns {boolean} True if the operation was successful.
     * @throws If either src or dest are invalid locations.
     */
    moveUnit(src, dest) {
        if (!this.validPoint(src))
            throw InvalidLocationError(src);
        if (!this.validPoint(dest))
            throw InvalidLocationError(dest);
        if (!this.squareAt(dest).occupiable)
            return false;
        // check if src.unit is null?

        let traveler = this.squareAt(src).unit;
        this.placeUnit(traveler, dest);
        this.removeUnit(src);

        // TODO This would be the prime location for a send-message in an Object Listener pattern…
        // ↑ Although, I forget why.
        return true;
    }

    /**
     * @param {Point} p A grid location to check the existence of.
     * @return {Boolean} True if point lies within the map's boundaries.
     */
    validPoint(p) {
        return p.x >= 0 && p.x < this.width &&
               p.y >= 0 && p.y < this.height;
    }
}