import * as PIXI from "pixi.js";
import * as PixiFilters from "pixi-filters";
import { TerrainObject } from "./TerrainObject";
import { UnitObject } from "./UnitObject";
import { Terrain } from "./Terrain";
import { Point } from "../CommonTypes";
import { Game } from "../..";
import { MapLayers } from "./MapLayers";
import { TerrainBuildingObject } from "./TerrainBuildingObject";

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
        if (!this.terrain)      // TODO Remove this
            return;

        let hidePanel = this.terrain.hiddenOverlay;
        let glassPanel = this.terrain.glassOverlay;

        let colors = {
            natural: {color: 0xFFFFFF, alpha: 0.5, mode: PIXI.BLEND_MODES.NORMAL},
            //blue: {color: 0x88FFFF, alpha: 0.8, mode: PIXI.BLEND_MODES.MULTIPLY},
            blue: {color: 0x44CCDD, alpha: 0.5, mode: PIXI.BLEND_MODES.NORMAL},
            red: {color: 0xFF6666, alpha: 0.5, mode: PIXI.BLEND_MODES.NORMAL},
            maroon: {color: 0x883388, alpha: 0.5, mode: PIXI.BLEND_MODES.NORMAL},
            grey: {color: 0x444444, alpha: 0.5, mode: PIXI.BLEND_MODES.MULTIPLY}, // CO Affected, should be animated
            darkgrey: {color: 0x000000, alpha: 0.4, mode: PIXI.BLEND_MODES.MULTIPLY}
        }
        let setColor = (panel: PIXI.Sprite, options: {color:number, alpha:number, mode:number}) => {
            panel.tint = options.color;
            panel.alpha = options.alpha;
            panel.blendMode = options.mode;
        }

        // Hidden tiles in Fog of War
        hidePanel.visible = this.hidden;
        setColor(hidePanel, colors.darkgrey);

        if (this.terrain instanceof TerrainBuildingObject)
            this.terrain.hidden = this.hidden;
        if (this.unit)
            this.unit.visible = !this.hidden;

        // Setup movement, attackable, etc. glass overlay.
        glassPanel.visible = true;
        if (this.moveable)
            setColor(glassPanel, colors.blue);
        else if (this.attackable)
            setColor(glassPanel, colors.red);
        else if (this.dangerous)
            setColor(glassPanel, colors.maroon);
        else if (this.COEffected)
            setColor(glassPanel, colors.grey);
        else
            glassPanel.visible = false;
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