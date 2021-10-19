import { TerrainObject } from "./TerrainObject";
import { UnitObject } from "../UnitObject";
import { Terrain } from "./Terrain";
import { MapLayer, MapLayerFunctions } from "./MapLayers";
import { TerrainBuildingObject } from "./TerrainBuildingObject";
import { Map } from "./Map";
import { Point, PointPrimitive } from "../../Common/Point";
import { Game } from "../../..";
import { NeighborMatrix } from "../../NeighborMatrix";
import { Debug } from "../../DebugUtils";
import { DiagnosticLayer } from "../../DiagnosticLayer";
import { CardinalDirection } from "../../Common/CardinalDirection";
import { Common } from "../../CommonUtils";
import { ArmorType, MoveType } from "../EnumTypes";

/**
 * Used by Map only. Maybe.
 * Generally a container for map information, but also self-manages appearance for UI purposes, etc.
 * 
 *  - overlayPanel: colors well, but the overhead-lights effect is incomplete. (low priority)
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
        const oldUnit = this._unit;
        this._unit = unitObj;

        if (this._unit)
            MapLayer('top', this.y, 'unit').addChild(this._unit.sprite);
        if (oldUnit) {
            const container = MapLayer('top', this.y, 'unit');
            container.removeChild(oldUnit.sprite);
        }

        // TODO Conform unit's display properties to this tile's.
        // You know, like hidden being hidden.
    }

    /** The tinted-glass tile highlight that informs the player what actions or information is available for this square. */
    private overlayPanel = new PIXI.Sprite();

    private tileReflectionBox = new PIXI.Container();

    private tileReflection = new PIXI.Sprite();

    /** The arrow-path layer which, by segment, informs the player what path a travelling unit would intend to take. */
    private overlayArrow = new PIXI.Sprite();

    /** A 32-bit number representing all or most of Square's relevant information. */
    private displayInfo = 0;

    // Constants/accessor-values for displayInfo —— Any way to make these numbers
    // auto-configurable, by the way, would be wonderful.
    private static readonly moveableShift = 0;
    private static readonly attackableShift = 1;
    private static readonly dangerousShift = 2;
    private static readonly COEffectedShift = 3;
    private static readonly hiddenShift = 4;
    private static readonly hideUnitShift = 5;
    private static readonly arrowFromShift = 6;
    private static readonly arrowToShift = 9;
    private static readonly xCoordShift = 12;
    private static readonly yCoordShift = 19;
    private static readonly tempShift = 26;
    private static readonly tempFlagShift = 30;
    
    private static readonly boolLength = 1;
    private static readonly directionLength = 3;
    private static readonly coordinateLength = 7;
    private static readonly tempLength = 4;

    static readonly Max_Coords = Math.pow(2, Square.coordinateLength);

    constructor(x = 0, y = 0) {
        this.setCoords(x,y);
        this.terrain = new Terrain.Void();
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

        // Overlay Panel
        MapLayer('top', this.y, 'glass-tile').addChild(this.overlayPanel);
        this.overlayPanel.x = worldPos.x;
        this.overlayPanel.y = worldPos.y;
        this.overlayPanel.anchor.set(0,.5);
        this.overlayPanel.visible = false;

        // Overlay panel continuous texture update step
        Game.scene.ticker.add( () => {
            if (!this.overlayPanel.visible)
                return;

            const rate = 5;
            if (Game.frameCount % rate === 0) {
                this.overlayPanel.texture = this.terrain.getOverlayTexture(this.terrain.shapeId);
            }
        });

        // Arrow Layer
        MapLayer('ui').addChild(this.overlayArrow);
        this.overlayArrow.x = worldPos.x;
        this.overlayArrow.y = worldPos.y;
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
    /** Whether this square should hide its unit if one is present. */
    get hideUnit(): boolean {
        return 1 == this.displayInfoGet(Square.boolLength, Square.hideUnitShift);
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
    /** Temporary store: A 4-bit number (value range -1–14) useful in search algorithms. */
    get value(): number {
        return this.displayInfoGet(Square.tempLength, Square.tempShift) - 1;    // -1 corrects the shifted range as it was stored
    }
    /** Temporary store: A boolean value useful in search algorithms. */
    get flag(): boolean {
        return 1 == this.displayInfoGet(Square.boolLength, Square.tempFlagShift);
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
    set hideUnit(value) {
        this.displayInfoSet(Square.boolLength, Square.hideUnitShift, ~~value);
    }
    set arrowFrom(value) {
        this.displayInfoSet(Square.directionLength, Square.arrowFromShift, value);
    }
    set arrowTo(value) {
        this.displayInfoSet(Square.directionLength, Square.arrowToShift, value);
    }
    private setCoords(x: number, y: number) {
        this.displayInfoSet(Square.coordinateLength, Square.xCoordShift, x);
        this.displayInfoSet(Square.coordinateLength, Square.yCoordShift, y);
    }
    set value(n: number) {
        this.displayInfoSet(Square.tempLength, Square.tempShift, n + 1);    // +1 shifts the range to -1 through 14
    }
    set flag(b: boolean) {
        this.displayInfoSet(Square.boolLength, Square.tempFlagShift, ~~b);
    }

    /** Updates the tile overlay to reflect whatever UI state the tile is in. */
    private updateHighlight(): void {
        if (!this.terrain)
            return;

        // First frame texture gather.  // TODO This should be a method.
        this.overlayPanel.texture = this.terrain.getOverlayTexture(this.terrain.shapeId);
        
        // Define glassy-overlay presets.
        let colors = {
            natural:{color: 0xFFFFFF, alpha: 0.50, mode: PIXI.BLEND_MODES.NORMAL},      // Deprecated. Was for sprite tints.
            //blue: {color: 0x88FFFF, alpha: 0.80, mode: PIXI.BLEND_MODES.MULTIPLY},
            blue:   {color: 0x33CCBB, alpha: 0.45, mode: PIXI.BLEND_MODES.NORMAL},
            red:    {color: 0xFF6060, alpha: 0.45, mode: PIXI.BLEND_MODES.NORMAL},
            maroon: {color: 0x883388, alpha: 0.45, mode: PIXI.BLEND_MODES.NORMAL},
            grey:   {color: 0x222222, alpha: 0.25, mode: PIXI.BLEND_MODES.MULTIPLY},    // CO Affected, // TODO Animate shades
            darkgrey: {color: 0x000000, alpha: 0.4, mode: PIXI.BLEND_MODES.MULTIPLY},
            shape:  {color: 0xFFFFFF, alpha: 1.0, mode: PIXI.BLEND_MODES.NORMAL}        // Show white mask sprite
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

        // String array and index accessors——setup to build variation string.
        let variationChars = ['0','0','0','0'];
        let fromIdx = this.arrowFrom - 1;
        let toIdx = this.arrowTo - 1;
        let arrowHeadIdx = (fromIdx + 2) % variationChars.length;

        // Set 'from' direction flag——and 'to' direction flag if path ends here.
        if (this.arrowFrom != CardinalDirection.None) {
            variationChars[fromIdx] = '1';
            if (this.arrowTo == CardinalDirection.None)
                variationChars[arrowHeadIdx] = '2';
        }
        // Set 'to' direction flag
        if (this.arrowTo != CardinalDirection.None)
            variationChars[toIdx] = '1';

        // Assemble string
        let variation = '';
        variationChars.forEach( char => {
            variation += char;
        });

        // If variation isn't "none," set new arrow path graphic, otherwise hide the old one.
        this.overlayArrow.visible = false;

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

    /** Returns true if the given unit can successfully target this square for attack. */
    targetable(unit: UnitObject): boolean {
        if (this.terrain.type == Terrain.Void)
            return false;

        let targetable = false;

        // Used to quick-check if at least one movement type in the list is allowed in this square.
        let sumMovementCosts = (list: MoveType[]) => {
            let sum = 0;
            list.forEach( moveType => {
                sum += this.terrain.getMovementCost(moveType);
            });
            return sum;
        };

        // Check if this _square_ is targetable. If uninhabited, use hypotheticals.
        // (As a visual convenience, treat ally-unit squares as empty)
        if (this.unit == null || this.unit.faction == unit.faction) {
            // Unit can attack land units + this square allows land units
            if (unit.couldTarget(ArmorType.Infantry) || unit.couldTarget(ArmorType.Vehicle))
                targetable = (sumMovementCosts([MoveType.Infantry, MoveType.Mech, MoveType.Tread, MoveType.TireA, MoveType.TireB]) > 0);
            // Unit can attack air units + this square allows air units
            if (unit.couldTarget(ArmorType.Air) || unit.couldTarget(ArmorType.Heli))
                targetable = (sumMovementCosts([MoveType.Air]) > 0) || targetable;
            // Unit can attack sea units + this square allows sea units
            if (unit.couldTarget(ArmorType.Ship) || unit.couldTarget(ArmorType.Sub))
                targetable = (sumMovementCosts([MoveType.Ship, MoveType.Transport]) > 0) || targetable;
        } else {  // a unit resides here
            targetable = unit.canTarget(this.unit);
        }

        return targetable;
    }

    /** Returns true if the given unit may launch an attack on a unit inhabiting this square.
     * Returns false if there is no inhabiting unit to attack, or if the inhabiting unit is not
     * targetable by the given.
     */
    attackable(unit: UnitObject): boolean {
        if (this.unit)
            return unit.canTarget(this.unit);
        else
            return false;
    }
}