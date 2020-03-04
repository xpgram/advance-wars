import { TerrainObject } from "./TerrainObject";
import { UnitObject } from "./UnitObject";
import { Terrain } from "./Terrain";
import { MapLayers } from "./MapLayers";
import { TerrainBuildingObject } from "./TerrainBuildingObject";
import { Map } from "./Map";
import { Point, PointPrimitive } from "../Common/Point";
import { Game } from "../..";

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

        //this.overlay = terr.whiteTexture; // This should work, but... ??
        // I believe terrain gets added to square before initialization/graphics-configuration
        // TODO Have map initialize tile graphics by calling Square.init() instead of Square.terrain.init()?
        // Is that even what it does?
    }

    private _unit: UnitObject | null = null;
    /**  */
    get unit() { return this._unit; }
    set unit(unitObj: UnitObject | null) {
        this._unit = unitObj;
        // TODO Conform unit's display properties to this tile's.
        // You know, like hidden being hidden.
    }

    /**  */
    private overlay = new PIXI.Container();
    private overlayPanel = new PIXI.Sprite();
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

        this.overlay.x = this.x * 16;
        this.overlay.y = this.y * 16;
        this.overlay.zIndex = Map.calculateZIndex({x:this.x, y:this.y}, 'glass-overlay');

        this.overlay.addChild(this.overlayPanel);
        this.overlay.addChild(this.overlayArrow);
        this.overlayPanel.x = this.overlayPanel.y = -16;

        MapLayers['top'].addChild(this.overlay);
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
        this.updateArrows();            // TODO Using arrowTo/arrowFrom, display arrow graphics
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

    private updateHighlight(): void {
        if (!this.terrain)      // TODO Remove this——after converting displayInfoSet, of course.
            return;
        
        // I think this only works here, not on terrain assignment, because
        // terrain is never assigned pre-initialized. So, this.overlay was always a blank sprite.
        // There is a small chance this was also the failure of my mask technique (it was.)
        // Whatever my technique, don't use masks, they're too slow to shade every tile on the map.
        //
        // There might be a way to use VoidFilter to something-something multiply-blend one sprite
        // over another without affecting the entire stage. This would (in theory) allow me to "mask"
        // the rotating light onto movement tiles without invoking the masking process.
        // Also, filters:
        //      let filter = new Filter(??)
        //      filter.resolution = Game.app.renderer.resolution;
        //      sprite.filters = [filter]
        // This fixes (well, untested) the pixel sprites getting curfuggled by filters issue.
        // Filters still be slow, tho.

        // So, I found out about a trick.
        // You can get a container of things to blend into each other in isolation if you
        // run the filters engine with a blank filter. Sort of like masking. Faster, too.
        // Or, you *could* do this. In the past. v4, specifically.
        // So, really, you *can't* do this. Ugh.

        // This is very temporary—I need some major refactoring between square, map and terrain.
        if (this.overlayPanel.texture.height <= 1) {
            let whiteSprite = this._terrain.whiteTexture;
            if (whiteSprite.texture)
                this.overlayPanel.texture = whiteSprite.texture;
        }

        // TODO Initialize Squares → initialize terrains. Maybe? This would allow me to set this.overlay once.

        // TODO Before doing anything else here, run some experiments.
        // Try to get like 25x9 different little squares doing the thing to different shapes.
        // You know what I should do? Use one of my scenes as a test room.
        // That way I can (write and then) import my debug setup and post that right on the screen,
        // and the rest of that scene-writing space is just me dicking around.

        // Define glassy-overlay presets.
        let colors = {
            natural: {color: 0xFFFFFF, alpha: 0.5, mode: PIXI.BLEND_MODES.NORMAL},
            //blue: {color: 0x88FFFF, alpha: 0.8, mode: PIXI.BLEND_MODES.MULTIPLY},
            blue: {color: 0x44CCDD, alpha: 0.5, mode: PIXI.BLEND_MODES.NORMAL},
            red: {color: 0xFF6666, alpha: 0.5, mode: PIXI.BLEND_MODES.NORMAL},
            maroon: {color: 0x883388, alpha: 0.5, mode: PIXI.BLEND_MODES.NORMAL},
            grey: {color: 0x444444, alpha: 0.5, mode: PIXI.BLEND_MODES.MULTIPLY}, // CO Affected, should be animated
            darkgrey: {color: 0x000000, alpha: 0.4, mode: PIXI.BLEND_MODES.MULTIPLY}
        }

        // Function which adjusts the look of the glassy overlay to a preset.
        let setColor = (options: {color:number, alpha:number, mode:number}) => {
            this.overlayPanel.tint = options.color;
            this.overlayPanel.alpha = options.alpha;
            this.overlayPanel.blendMode = options.mode;
            this.overlayPanel.visible = true;
        }

        // Hidden tiles in Fog of War — Hide units and building details
        if (this.terrain instanceof TerrainBuildingObject)
            this.terrain.hidden = this.hiddenFlag;
        if (this.unit)
            this.unit.visible = !this.hiddenFlag;

        // Choose glassy overlay preset
        this.overlayPanel.visible = false;

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
    }

    /**  */
    private updateArrows() {
        if (!this.overlay)  // TODO Remove this after converting—something, something—the above. I dunno. Refactoring this whole class, maybe.
            return;

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
        let empty = (this.unit == null);
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
            return unit.targetable(this.unit);
        else
            return false;
    }
}