/**
 * Used by Map only. Maybe.
 * Generally a container for map information, but also features many self-managing method for
 * search propogation and map UI artifacts.
 * 
 * @author Dei Valko
 * @version 0.1.0
 */
export class Square {
    terrain: Terrain;
    unit: Unit | null;

    /** A 64-bit number representing all or most of Square's relevant information. */
    private displayInfo = 0;

    // Constants/accessor-values for displayInfo —— Any way to make these numbers
    // auto-configurable, by the way, would be wonderful.
    private static readonly moveableShift = 0;
    private static readonly attackableShift = 1;
    private static readonly dangerousShift = 2;
    private static readonly COEffectedShift = 3;
    private static readonly hiddenShift = 4;
    private static readonly arrowFromShift = 5;
    private static readonly arrowToShift = 8;
    private static readonly xCoordShift = 11;
    private static readonly yCoordShift = 19;
    
    private static readonly boolLength = 1;
    private static readonly directionLength = 3;
    private static readonly coordinateLength = 8;

    private static readonly Max_Coords = 255;

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        this.terrain = new Terrain.Void();
    }

    /** Destroys this object and its children. */
    destroy() {
        this.terrain.destroy();
        this.unit.destroy();
    }

    /**
     * Retrieves bits from the object's information number. All JS numbers are 64-bit.
     * @param length The length of the bit-mask.
     * @param shift How far left the bit-mask is applied.
     */
    private displayInfoGet(length: number, shift: number) {
        let mask = Math.pow(2,length) - 1;  // Get us a series of 1 bits.
        return (this.displayInfo >> shift & mask);
    }

    /**
     * Writes bits to the object's information number. All JS numbers are 64-bit.
     * @param length The length of the bit-mask.
     * @param shift How far left the bit-mask is applied.
     * @param value The value to write into info (overages are not possible; mask is applied to value, too).
     */
    private displayInfoSet(length: number, shift: number, value: number) {
        let mask = Math.pow(2,length) - 1;  // Get us a series of 1 bits.
        this.displayInfo = this.displayInfo & ~(mask << shift);
        this.displayInfo += (value & mask) << shift;
        this.updateHighlight();
    }

    /** Whether this tile is reachable by a traveling unit. */
    get moveable(): boolean {
        return 1 == this.displayInfoGet(Square.boolLength, Square.moveableShift);
    }
    /** Whether this tile is attackable by a unit. */
    get attackable(): boolean {
        return 1 == this.displayInfoGet(Square.boolLength, Square.attackableShift);
    }
    /** Whether this tile is attackable by enemy troops. */
    get dangerous(): boolean {
        return 1 == this.displayInfoGet(Square.boolLength, Square.dangerousShift);
    }
    /** Whether this tile is affected by CO Unit influence. */
    get COEffected(): boolean {
        return 1 == this.displayInfoGet(Square.boolLength, Square.COEffectedShift);
    }
    /** Whether this tile's contents are obscured by Fog of War. */
    get hidden(): boolean {
        return 1 == this.displayInfoGet(Square.boolLength, Square.hiddenShift);
    }
    /** The from direction of the movement arrow splice. Range 0–4: none, up, right, down, left. */
    get arrowFrom(): number {
        return this.displayInfoGet(Square.directionLength, Square.arrowFromShift);
    }
    /** The to direction of the movement arrow splice. Range 0–4: none, up, right, down, left. */
    get arrowTo(): number {
        return this.displayInfoGet(Square.directionLength, Square.arrowToShift);
    }
    /** Represents this square's x-coordinate on the map. */
    get x(): number {
        return this.displayInfoGet(Square.coordinateLength, Square.xCoordShift);
    }
    /** Represents this square's y-coordinate on the map. */
    get y(): number {
        return this.displayInfoGet(Square.coordinateLength, Square.yCoordShift);
    }
    /** A point object representing this square's positional coordinates on the map. */
    get pos(): Point {
        return {x: this.x, y: this.y};
    }

    set moveable(value) {
        this.displayInfoSet(Square.boolLength, Square.moveableShift, ~~value);
    }
    set attackable(value) {
        this.displayInfoSet(Square.boolLength, Square.attackableShift, ~~value);
    }
    set dangerous(value) {
        this.displayInfoSet(Square.boolLength, Square.dangerousShift, ~~value);
    }
    set COEffected(value) {
        this.displayInfoSet(Square.boolLength, Square.COEffectedShift, ~~value);
    }
    set hidden(value) {
        this.displayInfoSet(Square.boolLength, Square.hiddenShift, ~~value);
    }
    set arrowFrom(value) {
        this.displayInfoSet(Square.directionLength, Square.arrowFromShift, value);
    }
    set arrowTo(value) {
        this.displayInfoSet(Square.directionLength, Square.arrowToShift, value);
    }
    set x(value) {
        this.displayInfoSet(Square.coordinateLength, Square.xCoordShift, value);
    }
    set y(value) {
        this.displayInfoSet(Square.coordinateLength, Square.yCoordShift, value);
    }
    set pos(point) {
        this.x = point.x;
        this.y = point.y;
    }

    updateHighlight(): void {
        // Maintain a sprite object at this position (the terrain.transform, probably)
        // Highlight precedence: blue > red > maroon > grey
        // Dark grey, Fog of War is separate and underneath the above colors.

        // If blue, red, maroon and grey are all false, destroy (null?) the sprite
        // If seeable is true, destroy (null?) the FoW sprite
    }

    occupiable(unit: Unit): boolean {
        // does terrain.moveCost(unit) return >= 1?
        // does unit == null?
        return true;
    }

    traversable(unit: Unit): boolean {
        // does this.terrain.moveCost(unit) return >= 1?
        // is this.unit either null or allied to unit?
        return true;
    }

    // ↓ Methods for iteratively depth-searching tiles ↓
}