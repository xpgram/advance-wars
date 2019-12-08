import * as PIXI from "pixi.js";
import * as PixiFilters from "pixi-filters";
import { TerrainObject } from "./TerrainObject";
import { UnitObject } from "./UnitObject";
import { Terrain } from "./Terrain";
import { Point } from "../CommonTypes";
import { Game } from "../..";

/**
 * Used by Map only. Maybe.
 * Generally a container for map information, but also features many self-managing method for
 * search propogation and map UI artifacts.
 * 
 * @author Dei Valko
 * @version 0.1.0
 */
export class Square {
    terrain: TerrainObject;
    unit: UnitObject | null = null;
    panel: PIXI.Container | null = null;

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

    static readonly Max_Coords = 255;

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        this.terrain = new Terrain.Void();
    }

    /** Destroys this object and its children. */
    destroy() {
        this.terrain.destroy();
        if (this.unit)
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

    // TODO Use Common.writeBits() instead
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
        //reconfigureHighlight()    ← Determines terrain tint / whether to show unit, etc.
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
        let colors = {
            natural: null,
            blue: 0x8888FF,
            red: 0xFFAAAA,
            maroon: 0xCC88AA,
            grey: 0xBBBBBB,
            darkgrey: 0x888888
        }

        if (this.unit)
            this.unit.visible = true;

        if (this.hidden) {
            // this.terrain.tint = colors.darkgrey;
            if (this.panel === null) {
                this.panel = this.generateWhiteTexture(colors.blue);
                this.panel.x = this.x * 16 - 16;
                this.panel.y = this.y * 16 - 32;
                Game.stage.addChild(this.panel);
            }
            if (this.unit)
                this.unit.visible = false;
        }

        else if (this.moveable)
            this.terrain.tint = colors.blue;
        else if (this.attackable)
            this.terrain.tint = colors.red;
        else if (this.dangerous)
            this.terrain.tint = colors.maroon;
        else if (this.COEffected)
            this.terrain.tint = colors.grey;
        else if (this.terrain)
            this.terrain.tint = colors.natural;

        // TODO Improve
        // So, neat as this is, this isn't the solution to my problem.
        // In Pixi, sprites are tinted white all the time, this means any other color is necessarily darker than natural,
        // which particularly means I can't tint blue without tinting dark blue.
        // For bright blues, I'm going to need to create a 16x20 shape, mask it with the terrain's shape... they're on different layers.
        // I may have to do that twice. Ugh.
        // Anyway, shape (color) → masked → overlay (add, probably)
        // 
        // I should probably tinker with these ideas in a Pixi demo before trying to apply them.
        //
        // Also, hidden buildings need to be the white variant.
        // Also-also, sea tiles are technically empty, so they don't darken much when tinting (deep sea doesn't darken at all.)
    }

    generateWhiteTexture(color: number) {
        let s = new PIXI.Sprite();
        s.texture = this.terrain.preview.texture;
        let mask = new PIXI.Sprite();
        mask.addChild(s);

        let filter = new PixiFilters.AdjustmentFilter({
            red: (color >> 16 & 0xFF) / 127,
            green: (color >> 8 & 0xFF) / 127,
            blue: (color & 0xFF) / 127
        });
        s.filters = [filter];
        s.cacheAsBitmap = true;

        mask.alpha = 0.4;
        return mask;
    }

    occupiable(unit: UnitObject): boolean {
        let traversable = this.traversable(unit);
        let empty = (this.unit == null);
        return traversable && empty;
    }

    traversable(unit: UnitObject): boolean {
        let legalMovement = (this.terrain.getMovementCost(unit.moveType) > 0);
        let unitAlliedOrEmpty = (this.unit == null || this.unit.faction == unit.faction);
        return legalMovement && unitAlliedOrEmpty;
    }

    // ↓ Methods for iteratively depth-searching tiles ↓
}