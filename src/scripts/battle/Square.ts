import { TerrainObject } from "./TerrainObject";
import { UnitObject } from "./UnitObject";
import { Terrain } from "./Terrain";
import { MapLayers } from "./MapLayers";
import { TerrainBuildingObject } from "./TerrainBuildingObject";
import { Map } from "./Map";
import { Point, PointPrimitive } from "../Common/Point";
import { Game } from "../..";
import { NeighborMatrix } from "../NeighborMatrix";

/**
 * Used by Map only. Maybe.
 * Generally a container for map information, but also self-manages appearance for UI purposes, etc.
 * 
 * // TODO Needs major refactoring, along with its associated links to Map and Terrain.
 *  - Bitwise properties should be converted to the UnitObject model.
 *  - The order of initialization between Map→Square→Terrain is weird and disfunctional.
 *  - overlayPanel can be alpha'd and tinted cheaply, but the overhead-lights effect I haven't worked out.
 * 
 * @author Dei Valko
 * @version 0.1.0
 */
export class Square {
    private _terrain!: TerrainObject;
    /**  */
    get terrain() { return this._terrain; }
    set terrain(terr: TerrainObject) {
        this._terrain = terr;

    }

    private _unit: UnitObject | null = null;
    /**  */
    get unit() { return this._unit; }
    set unit(unitObj: UnitObject | null) {
        this._unit = unitObj;
        // TODO Conform unit's display properties to this tile's.
        // You know, like hidden being hidden.
    }

    /** The tinted-glass tile highlight that informs the player what actions or information is available for this square. */
    private overlayPanel = new PIXI.Sprite();
    /** The arrow-path layer which, by segment, informs the player what path a travelling unit would intend to take. */
    private overlayArrow = new PIXI.Sprite();

    /** A 32-bit number representing all or most of Square's relevant information. */
    private displayInfo = 0;

    // TODO Fit this into the bitshifted properties below
    /** Whether this square should hide its unit if one is present. */
    hideUnit = false;

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
    private static readonly tempShift = 27;
    private static readonly searchVisitedShift = 31;
    
    private static readonly boolLength = 1;
    private static readonly directionLength = 3;
    private static readonly coordinateLength = 8;
    private static readonly tempLength = 4;

    static readonly Max_Coords = 255;

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        this.terrain = new Terrain.Void();

        MapLayers['top'].addChild(this.overlayPanel);
        MapLayers['ui'].addChild(this.overlayArrow);
    }

    /** Destroys this object and its children. */
    destroy() {
        this.terrain.destroy();
        if (this.unit)
            this.unit.destroy();
    }

    /** This method sets up terrain graphics, grabs its white texture, etc.
     * I'm trying to figure out, between this class and Map, which *should*
     * hold responsibility over what, though.
     * // TODO Make it work, but like, better-like. */
    finalize(neighbors: NeighborMatrix<TerrainObject>) {
        let tileSize = Game.display.standardLength;

        // Terrain Graphic Layer
        let worldPos = {
            x: this.x * tileSize,
            y: this.y * tileSize,
            z: Map.calculateZIndex({x: this.x, y: this.y})
        };
        this.terrain.init(neighbors, worldPos);

        // Tinted-Glass Panel Layer
        this.overlayPanel.x = this.x * tileSize - tileSize; // Generated textures (32x32) do not have
        this.overlayPanel.y = this.y * tileSize - tileSize; // preset origins, so adjust position by tileSize
        this.overlayPanel.zIndex = Map.calculateZIndex({x:this.x, y:this.y}, 'glass-overlay');
        this.overlayPanel.texture = this.terrain.whiteTexture.texture;

        // Arrow Layer
        this.overlayArrow.x = this.x * tileSize;
        this.overlayArrow.y = this.y * tileSize;
        this.overlayArrow.zIndex = 10;  // Puts arrows above unit info. // TODO Put this in a function somewhere? Like Map.calculateZIndex()?

        this.updateHighlight();
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
        this.updateArrows();
    }

    /** Whether this tile is reachable by a traveling unit. */
    get moveFlag(): boolean {
        return 1 == this.displayInfoGet(Square.boolLength, Square.moveableShift);
        //reconfigureHighlight()    ← Determines terrain tint / whether to show unit, etc.
    }
    /** Whether this tile is attackable by a unit. */
    get attackFlag(): boolean {
        return 1 == this.displayInfoGet(Square.boolLength, Square.attackableShift);
    }
    /** Whether this tile is attackable by enemy troops. */
    get dangerFlag(): boolean {
        return 1 == this.displayInfoGet(Square.boolLength, Square.dangerousShift);
    }
    /** Whether this tile is affected by CO Unit influence. */
    get COAffectedFlag(): boolean {
        return 1 == this.displayInfoGet(Square.boolLength, Square.COEffectedShift);
    }
    /** Whether this tile's contents are obscured by Fog of War. */
    get hiddenFlag(): boolean {
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
    get pos(): PointPrimitive {
        return {x: this.x, y: this.y};
    }
    /** Temporary store: A 4-bit number (value range 0–15) useful in search algorithms. */
    get value(): number {
        return this.displayInfoGet(Square.tempLength, Square.tempShift);
    }
    /** Temporary store: A boolean value useful in search algorithms. */
    get flag(): boolean {
        return 1 == this.displayInfoGet(Square.boolLength, Square.searchVisitedShift);
    }

    set moveFlag(value) {
        this.displayInfoSet(Square.boolLength, Square.moveableShift, ~~value);
    }
    set attackFlag(value) {
        this.displayInfoSet(Square.boolLength, Square.attackableShift, ~~value);
    }
    set dangerFlag(value) {
        this.displayInfoSet(Square.boolLength, Square.dangerousShift, ~~value);
    }
    set COAffectedFlag(value) {
        this.displayInfoSet(Square.boolLength, Square.COEffectedShift, ~~value);
    }
    set hiddenFlag(value) {
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
    set value(n: number) {
        this.displayInfoSet(Square.tempLength, Square.tempShift, n);
    }
    set flag(b: boolean) {
        this.displayInfoSet(Square.boolLength, Square.searchVisitedShift, ~~b);
    }

    /** Updates the tile overlay to reflect whatever UI state the tile is in. */
    private updateHighlight(): void {
        // 2-second sawtooth wave, range 0–1
        //let wave = Math.abs((Game.frameCount % 120) - 120) / 60;

        // Define glassy-overlay presets.
        let colors = {
            natural:{color: 0xFFFFFF, alpha: 0.5, mode: PIXI.BLEND_MODES.NORMAL},  // Deprecated. Was for sprite tints.
            //blue: {color: 0x88FFFF, alpha: 0.8, mode: PIXI.BLEND_MODES.MULTIPLY},
            blue:   {color: 0x44CCDD, alpha: 0.5, mode: PIXI.BLEND_MODES.NORMAL},
            red:    {color: 0xFF6666, alpha: 0.5, mode: PIXI.BLEND_MODES.NORMAL},
            maroon: {color: 0x883388, alpha: 0.5, mode: PIXI.BLEND_MODES.NORMAL},
            grey:   {color: 0x222222, alpha: 0.25, mode: PIXI.BLEND_MODES.MULTIPLY}, // CO Affected, // TODO Animate shades
            darkgrey: {color: 0x000000, alpha: 0.4, mode: PIXI.BLEND_MODES.MULTIPLY}
        }

        // Adjusts the look of the glassy overlay to some preset.
        let setColor = (options: {color:number, alpha:number, mode:number}) => {
            this.overlayPanel.tint = options.color;
            this.overlayPanel.alpha = options.alpha;
            this.overlayPanel.blendMode = options.mode;
            this.overlayPanel.visible = true;
        }

        // Hidden by default
        this.overlayPanel.visible = false;

        // Choose glassy overlay preset
        if (this.moveFlag)
            setColor(colors.blue);
        else if (this.attackFlag)
            setColor(colors.red);
        else if (this.dangerFlag)
            setColor(colors.maroon);
        else if (this.hiddenFlag)
            setColor(colors.darkgrey);
        else if (this.COAffectedFlag)
            setColor(colors.grey);

        // Hidden tiles in Fog of War — Hide units and building details
        if (this.terrain instanceof TerrainBuildingObject)
            this.terrain.hidden = this.hiddenFlag;
        if (this.unit)
            this.unit.visible = !this.hiddenFlag && !this.hideUnit;
    }

    /** Updates the tile's arrow-path overlay to reflect its UI state.  */
    private updateArrows() {
        let sheet = Game.scene.resources['UISpritesheet'].spritesheet as PIXI.Spritesheet;

        // char decrementers for arrow path directions
        let from = this.arrowFrom
        let to = this.arrowTo;

        // char decrementer for arrow head direction (always opposite 'from')
        let arrowHead = (this.arrowFrom && !this.arrowTo) ? this.arrowFrom + 2 : 0;
        if (arrowHead > 4) arrowHead -= 4;  // Cap at 4; only 4 directions

        // Find the arrow-graphic variation described by path directions.
        // This method depends on up-right-down-left being the standard order of cardinal directions.
        let variation = '';
        let c = 4
        while (c > 0) {
            c--; from--; to--; arrowHead--;

            if (arrowHead == 0)
                variation += '2';
            else if (from == 0 || to == 0)
                variation += '1';
            else
                variation += '0';
        }

        // Blank old setting
        this.overlayArrow.visible = false;

        // If variation isn't "none," set new arrow path graphic.
        if (variation != '0000') {
            this.overlayArrow.texture = sheet.textures[`MovementArrow/movement-arrow-${variation}.png`];
            this.overlayArrow.visible = true;
        }
    }

    /** Returns true if the given unit may legally inhabit this square. */
    occupiable(unit: UnitObject): boolean {
        let traversable = this.traversable(unit);
        let empty = (this.unit == null || this.unit === unit);  // Do not return 'inoccupiable' if the unit is already located there.
        return traversable && empty;
    }

    /** Returns true if the given unit object may legally pass through this square, false
     * only if this square presents an obstruction to the travelling unit. */
    traversable(unit: UnitObject): boolean {
        let legalMovement = (this.terrain.getMovementCost(unit.moveType) > 0);              // Ships ≠ Land, Any ≠ Void Tiles
        let unitAlliedOrEmpty = (this.unit == null || this.unit.faction == unit.faction);   // Team ≠ not-Team
        return legalMovement && unitAlliedOrEmpty;
    }

    /** Returns true if the given unit may launch an attack on a unit inhabiting this square.
     * Returns false if there is no inhabiting unit to attack, or if the inhabiting unit is not targetable
     * by the given unit. */
    attackable(unit: UnitObject): boolean {
        if (this.unit)
            return unit.canTarget(this.unit);
        else
            return false;
    }
}