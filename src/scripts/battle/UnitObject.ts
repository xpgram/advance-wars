import { Common } from "../CommonUtils";
import { LowResTransform } from "../LowResTransform";
import { Game } from "../..";
import { UnitClass, FactionColors, MoveType, ArmorType, Faction, AttackMethod, Facing } from "./EnumTypes";
import { Debug } from "../DebugUtils";
import { fonts } from "./ui-windows/DisplayInfo";
import { MapLayer, MapLayerFunctions } from "./map/MapLayers";
import { Unit, UnitProperties } from "./Unit";
import { Slider } from "../Common/Slider";
import { Point } from "../Common/Point";
import { CommonRangesRetriever, RegionMap } from "./unit-actions/RegionMap";
import { BoardPlayer } from "./BoardPlayer";
import { TerrainObject } from "./map/TerrainObject";
import { NeighborMatrix } from "../NeighborMatrix";
import { Square } from "./map/Square";
import { BitIO } from "../Common/BitIncrementer";
import { PixiUtils } from "../Common/PixiUtils";
import { Terrain } from "./map/Terrain";

export class UnitConstructionError extends Error {
    name = "UnitConstructionError";
}

/** An uninstantiated Unit class type. */
export interface UnitType {
    new (): UnitObject;
    readonly serial: number
}

// Write bit-masking constants: length and shift amount
const BITMASK = Common.freezeObject({
    HP:         BitIO.Generate(7, 0),
    ammo:       BitIO.Generate(4),
    capture:    BitIO.Generate(5),
    gas:        BitIO.Generate(7),
    rank:       BitIO.Generate(2),
    orderable:  BitIO.Generate(1),
    CoOnBoard:  BitIO.Generate(1),

    type:       BitIO.Generate(6, 0),
    faction:    BitIO.Generate(3),
    xCoord:     BitIO.Generate(8),
    yCoord:     BitIO.Generate(8),
    reverseFacing:  BitIO.Generate(1),
});


/**
 * This class is a container for unit variable-stat information.
 * Things like its HP, its remaining Gas, etc.
 * Constant stats are accessible through this class, but are not actually determined here;
 * Unit simply asks its UnitType what the number should be and passes it along.
 * 
 * For fun, and because Advance Wars itself does this, I have packed all or most of its
 * vital information into one 32-bit value to save memory. This actually saves a lot of space.
 * 
 * This class holds most of the gameplay methods,
 * extenders add constants and sprite info.
 * Particularly:
 *     - When units are moving up/down, ~when~ do they change their z-index? Do they? Does the railcar just display over everything? [Yes, it does]
 *  - damageMatrix(type: UnitType): number      Given a unit type (like terrain.type), return a number representing base damage.
 *  - 
 * 
 * TODO: Link-up sprites (kind) to the movement car?
 * TODO: Read unit-type constants into the unit container (this)
 * TODO: Come up with a more maintainable bit-reading-writing architecture.
 * 
 * @author Dei Valko
 * @version 0.1.0
 */
export abstract class UnitObject {
    static readonly MaxHp = 100;
    static readonly MaxCapture = 20;
    static readonly MaxRank = 3;

    private static transform: LowResTransform = new LowResTransform();
    private static TintShade = 0x888888;
    private _sprite!: PIXI.AnimatedSprite;
    private uiBox!: PIXI.Container;
    private hpMeter!: PIXI.BitmapText;
    private previewHpMeter!: PIXI.BitmapText;
    private statusIcons!: PIXI.Sprite;
    private previewStatusIcons!: PIXI.Sprite;
    private statusTextures: PIXI.Texture[] = []

    transparent = false;
    private transparencySlider = new Slider({
        max: .7,
        granularity: .35     // About 3 frames between min and max.
    });

    /** Reference to the team object this unit is a member of. */
    readonly boardPlayer!: BoardPlayer;

    /** A 32-bit number representing all of the Unit's volatile information. */
    private conditionInfo = 0;
    private stateInfo = 0;      // TODO Come up with good names for these

    /** A reference to this object's unit-kind. Used for retrieving constants about the unit. */
    abstract get type(): UnitType;

    /** This unit type's serial number. */
    static readonly serial: number = -1;

    /** Numerical index of unit types. Used for saving/loading, primarily. */
    get serial(): number { return this.type.serial; }

    /** The sprite container for this unit. */
    get sprite(): PIXI.AnimatedSprite {
        return this._sprite;
    }

    /** A 16x16 thumbnail image for this unit object. Must be initiated. */
    // TODO unit.preview is not modifiable without first putting it in another
    // container: is this getter then misleading? I think so.
    get preview(): PIXI.Container {
        return this.shopPreview(this.faction);
    }

    /** A 16x16 thumbnail image for this unit object which includes status
     * information. Must be initiated. */
    get cargoPreview(): PIXI.Container {
        const sprite = this.preview;
        sprite.addChild(
            this.previewStatusIcons,
            this.previewHpMeter,
        );

        return sprite;
        // TODO How do I know GC eventually collects preview?
    }

    /** A 16x16 thumbnail image for this unit type. */
    shopPreview(faction: Faction, facing?: Facing): PIXI.Container {
        // TODO This process, identifying the filepath, asking about soldier sprites because they're different, is common. Encapsulate it somewhere.
        let name = this.name.replace(' ','').replace('-','').toLowerCase();
        let color = FactionColors[faction];
        let army = ['rubinelle', 'lazurian'][faction % 2]; // TODO Get this from team.CO.armyType or something.
        let sprite;

        if (this.type == Unit.Infantry || this.type == Unit.Mech || this.type == Unit.Bike)
            sprite = new PIXI.Sprite(UnitProperties.sheet.textures[`${name}/${army}/${color}/idle-1.png`]);
        else
            sprite = new PIXI.Sprite(UnitProperties.sheet.textures[`${name}/${color}/idle-1.png`]);
        
        if (this.reverseFacing || facing === Facing.Left) {
            sprite.anchor.x = 1;
            sprite.scale.x = -1;
        }

        let container = new PIXI.Container();
        container.addChild(sprite);
        return container;
    }

    // TODO Rename this; 'exhibit' is stupid, I'm tired of reading it.
    /** A larger preview image of this unit type.  */
    get illustration(): PIXI.Sprite {
        const sheet = UnitProperties.illustrationSheet;

        const name = this.name.replace(' ','').replace('-','').toLowerCase();
        const nationality = this.boardPlayer.officer.nationality;
        const color = FactionColors[this.boardPlayer.faction];

        const sprite = new PIXI.Sprite(sheet.textures[`${nationality}-${color}-${name}.png`]);
        sprite.scale.x = this.reverseFacing ? 1 : -1;
        sprite.x = this.reverseFacing ? 0 : sprite.width;

        return sprite;
    }

    /** An object containing the texture sets for the sprite's three movement facings (left must be reflected for right-facing.) */
    get movementAnimations() {
        let name = this.name.replace(' ','').replace('-','').toLowerCase();
        let color = FactionColors[this.faction];
        let army = ['rubinelle', 'lazurian'][this.faction % 2];

        // Spriteset lookup functions
        let soldierSprites = (name: string, army: string, color: string, action: string): PIXI.Texture[] => {
            return UnitProperties.sheet.animations[`${name}/${army}/${color}/${action}`];
        }
        let vehicleSprites = (name: string, army: string, color: string, action: string): PIXI.Texture[] => {
            const textures = UnitProperties.sheet.animations[`${name}/${color}/${action}`];
            return textures || [PIXI.Texture.EMPTY];
        }

        // Pick the spriteset lookup function relevant to this unit.
        let accessor: {(a:string, b:string, c:string, d:string): PIXI.Texture[]};
        accessor = (this.soldierUnit || this.type == Unit.Bike) ? soldierSprites : vehicleSprites;

        // Collect spritesets
        let o = {
            up: accessor(name, army, color, 'up'),
            down: accessor(name, army, color, 'down'),
            left: accessor(name, army, color, 'left')
        }

        // Typically, this happens because new Unit() does not .init(), meaning faction is left blank or whatever. No bueno. I need to refactor a bit.
        // I think this method just needs to ensure it's only called on 'existing' units, not just constructed ones.
        if (!(Boolean(o.up) && Boolean(o.down) && Boolean(o.left)))
            Debug.ping(`Generated set of movement textures is not complete or does not exist. [Up:${Boolean(o.up)}, Down:${Boolean(o.down)}, Left:${Boolean(o.left)}]`);

        return o;
    }

    /** The unit's proper name. */
    abstract get name(): string;

    /** The unit's shortened, space-conserving name. */
    abstract get shortName(): string;

    /** A short description of the unit's traits and purpose. */
    abstract get description(): string;

    /** The unit's price to build. */
    abstract get cost(): number;

    /** The unit's value after factoring in its present condition. */
    get adjustedCost(): number { return Math.ceil(this.cost * this.hp / UnitObject.MaxHp); }

    /** The unit's maximum gas: a stat depleted while moving. */
    abstract get maxGas(): number;

    /** The unit's maximum ammunition: a stat depleted by attacking. */
    abstract get maxAmmo(): number;

    /** The unit's maximum travel distance, or travel effort, depending on terrain travel efficiency. */
    abstract get maxMovementPoints(): number;

    /** The distance this unit can see into fog of war conditions. */
    get vision() { return 2; }

    /** Returns the vision stat after player or unit-specific bonuses have been calculated.
     * General conditions, such as Weather, must be applied separately. */
    appliedVision(square: Square) {
        // TODO Should this be overridden by soldier class types?
        const soldier = (this.soldierUnit);
        const highVantage = (square.terrain.type === Terrain.Mountain);
        const terrainBonus = (soldier && highVantage) ? 3 : 0;
        const officerBonus = this.boardPlayer.officer.getBonusStats(this).vision;
        return this.vision + terrainBonus + officerBonus;
    }

    /** Returns a NumericRange describing this unit's distance-of-attack limits. */
    get range(): NumericRange { return {min: 1, max: 1}; }

    /** Returns a boolean map of the shape of the unit's attack range. */
    get rangeMap(): RegionMap {
        if (this.ammo > 0 || this.weapon.secondary.name != '')
            return CommonRangesRetriever(this.range);
        return CommonRangesRetriever({min: -1, max: -1});
    }

    /** Whether this unit is a soldier-type. Soldier's have unique graphics depending on faction,
     * and have the unique ability to capture properties. */
    get soldierUnit() { return false; }

    /** Whether this unit has materials for building instead of ammunition for attacking.
     * Materials take over the ammunition stat when in effect. */
    get materialsInsteadOfAmmo() { return false; }

    /** Whether this unit may move and attack as an action pair during its turn.
     * This is, primarily, a distinction between direct and indirect units. */
    get canMoveAndAttack(): boolean { return true; }

    /** Whether this unit is a resupplier unit. */
    get canResupply(): boolean { return false; }

    /** Whether this unit's ammo can be resupplied. */
    get ammoCanBeResupplied(): boolean { return true; }

    /** Whether this unit is a resupplier-to-its-cargo unit. */
    get canResupplyHeldUnits(): boolean { return this.canResupply; }

    /** Whether this unit can hide itself from other players. */
    get canHide(): boolean { return false; }

    /** Whether this unit self-destructs when its gas is empty. */
    get destroyOnGasEmpty() {
        // TODO Move into Unit module properties? If it ever gets more complex, I guess.
        return ([UnitClass.Air, UnitClass.Naval].includes(this.unitClass));
    }

    /** The unit's class: either Groundforce, Airforce or Navy. */
    abstract get unitClass(): UnitClass;

    /** The unit's method of movement, which affects its efficiency of travel over terrain. */
    abstract get moveType(): MoveType;

    /** The unit's armor kind, which affects what may attack it. Generally, a marginal player convenience. */
    abstract get armorType(): ArmorType;

    /**  */
    abstract get weapon(): {
        primary: AttackInfo,
        secondary: AttackInfo
    };


    /* Left mostly blank so that units can be instantiated as reference material
     * without building expensive graphic objects, etc. */
    constructor() {
        this.x = -1;    // Indicate this unit is not "on map"
        this.y = -1;
    }

    /** Must be called before use. Builds unit graphics, configures important stats. */
    init(options: {boardPlayer: BoardPlayer, faction: Faction}) {
        let sheet = Game.loader.resources['UnitSpritesheet'].spritesheet as PIXI.Spritesheet;
        // TODO If spritesheet is undefined... what happens?

        // TODO faction is known by boardplayer...

        //@ts-expect-error // Team Object
        this.boardPlayer = options.boardPlayer;

        // Allied Faction
        if ([Faction.None, Faction.Neutral].includes(options.faction))
            throw new UnitConstructionError(`Cannot ally deployed unit with faction ${FactionColors[options.faction]}`);
        this.faction = options.faction;

        // Pick the right idle animation
        let name = this.name.replace(' ','').replace('-','').toLowerCase();
        let color = FactionColors[this.faction];
        //let country = team.country;
        let country = ['rubinelle','lazurian'][this.faction  % 2];

        // TODO Export this to a public method
        if (this.type == Unit.Infantry || this.type == Unit.Mech || this.type == Unit.Bike)
            this._sprite = new PIXI.AnimatedSprite(sheet.animations[`${name}/${country}/${color}/idle`]);
        else
            this._sprite = new PIXI.AnimatedSprite(sheet.animations[`${name}/${color}/idle`]);

        this.reverseFacing = (this.boardPlayer.armyFacing === Facing.Left);

        // Build UI elements.
        this.uiBox = new PIXI.Container();

        this.hpMeter = new PIXI.BitmapText('', fonts.smallScriptOutlined);
        this.hpMeter.anchor = 1; // 1,1: bottom right corner
        this.hpMeter.x = 15; // Sprite b-right corner of the sprite
        this.hpMeter.y = 18; // Font height adjustment
        this.uiBox.addChild(this.hpMeter);

        this.previewHpMeter = new PIXI.BitmapText('', fonts.smallScriptOutlined);
        this.previewHpMeter.anchor = 1;
        this.previewHpMeter.x = 15;
        this.previewHpMeter.y = 18;

        this.statusIcons = new PIXI.Sprite(); // Empty
        this.statusIcons.y = 8;    // middle left of the unit box (texture anchor is top left)
        this.uiBox.addChild(this.statusIcons);

        this.previewStatusIcons = new PIXI.Sprite(); // Empty
        this.previewStatusIcons.y = 8;

        MapLayer('ui').addChild(this.uiBox);
        
        // TODO Create an Army class which keeps track of CO and a list of all allied units, represents a team/player, etc.
        // TODO Use Army to fill in this unit object's faction, player orientation (player 2 always faces left), etc.

        // Configure basic stats.
        this.stateInfo = BitIO.WriteBits(this.stateInfo, this.serial, BITMASK.type);
        this.hp = 100;
        this.ammo = this.maxAmmo;
        this.gas = this.maxGas;

        // *Activate* this unit's update step.
        Game.scene.ticker.add(this.update, this);

        return this;
    }

    /** Loads unit info (a 32-bit number) into this unit object.
     * @deprecated In spirit. I should use it, though.
     * */
    load(stateInfo: number, conditionInfo: number) {
        this.stateInfo = stateInfo;
        this.conditionInfo = conditionInfo;
    }

    /** Unlinks this objects references and connections. */
    destroy() {
        this._cargo.forEach( u => u.destroy() );
        
        this.boardPlayer.unspawnUnit(this);
        
        //@ts-expect-error
        this.boardPlayer = undefined;
        this.sprite.destroy({children: true});
        this.uiBox.destroy({children: true});
        Game.scene.ticker.remove(this.update, this);
    }

    /** The unit's team-assocation. */
    get faction(): number {
        return BitIO.ReadBits(this.stateInfo, BITMASK.faction);
    }
    set faction(faction: number) {
        this.stateInfo = BitIO.WriteBits(this.stateInfo, faction, BITMASK.faction);
    }

    /** The unit's remaining health. */
    get hp(): number {
        return BitIO.ReadBits(this.conditionInfo, BITMASK.HP);
    }
    set hp(num) {
        num = Common.clamp(num, 0, UnitObject.MaxHp);
        this.conditionInfo = BitIO.WriteBits(this.conditionInfo, num, BITMASK.HP);
        
        // Update unit's UI layer
        if (this.hp <= 90) {
            this.hpMeter.text = this.displayHP.toString();
            this.previewHpMeter.text = this.displayHP.toString();
        } else {
            this.hpMeter.text = '';
            this.previewHpMeter.text = '';
        }
    }

    /** Returns true if this object has anything less than maximum HP. */
    get repairable() {
        return this.hp < UnitObject.MaxHp;
    }

    /** The unit's HP, but as a number between 0 and 10. A UI feature. */
    get displayHP(): number {
        return Math.ceil(this.hp * 0.1);
    }

    /** The unit's remaining ammo. */
    get ammo(): number {
        return BitIO.ReadBits(this.conditionInfo, BITMASK.ammo);
    }
    set ammo(num) {
        num = Common.clamp(num, 0, this.maxAmmo);
        this.conditionInfo = BitIO.WriteBits(this.conditionInfo, num, BITMASK.ammo);
        this.rebuildStatusIcons();
    }

    /** Whether this unit is low on ammo. */
    get lowAmmo(): boolean {
        if (this.maxAmmo == 0)
            return false;
        let lowAmmoThreshold = this.maxAmmo * 0.5;
        return (this.ammo <= lowAmmoThreshold);
    }

    /** Returns true if this unit has ammo in reserve for its primary attack or has a secondary.
     * Ammo for primary is ignored if this unit has materials to build with. */
    get attackReady() {
        const primary = (this.weapon.primary.name != '');
        const secondary = (this.weapon.secondary.name != '');
        const reserve = (this.ammo > 0 && !this.materialsInsteadOfAmmo);
        return (primary && reserve) || secondary;
    }

    /** Returns the maximum number of movement points this unit currently has available for use.
     * This is either their move-points limit, or their remaining gas. */
    get movementPoints() {
        return (this.gas < this.maxMovementPoints) ? this.gas : this.maxMovementPoints;
    }

    /** True if this unit can attack adjacent units. */
    get isDirect(): boolean {
        return Common.within(1, this.range.min, this.range.max);
    }

    /** True if this unit can attack adjacent units, and *only* adjacent units. */
    get isDirectOnly(): boolean {
        return this.range.max === 1;
    }

    /** True if this unit can attack distant targets. */
    get isIndirect(): boolean {
        return this.range.max > 1;
    }

    /** The unit's progress toward capturing a building. */
    get capture(): number {
        return BitIO.ReadBits(this.conditionInfo, BITMASK.capture);
    }
    set capture(num) {
        num = Common.clamp(num, 0, UnitObject.MaxCapture);
        this.conditionInfo = BitIO.WriteBits(this.conditionInfo, num, BITMASK.capture);
        this.rebuildStatusIcons();
    }

    /** Whether this unit has made any progress toward capturing the building they're located over. */
    get capturing(): boolean {
        return this.capture > 0;
    }

    /** The unit's remaining gas or movement points. */
    get gas(): number {
        return BitIO.ReadBits(this.conditionInfo, BITMASK.gas);
    }
    set gas(num) {
        num = Common.clamp(num, 0, this.maxGas);
        this.conditionInfo = BitIO.WriteBits(this.conditionInfo, num, BITMASK.gas);
        this.rebuildStatusIcons();
    }

    /** Whether this unit is low on gas. */
    get lowGas(): boolean {
        let lowGasThreshold = this.maxGas / 2;
        return (this.gas <= lowGasThreshold);
    }

    /** The unit's acquired rank or experience level through battle. */
    get rank(): number {
        return (this.CoOnBoard)
            ? UnitObject.MaxRank
            : BitIO.ReadBits(this.conditionInfo, BITMASK.rank);
    }
    set rank(num) {
        num = Common.clamp(num, 0, UnitObject.MaxRank);
        this.conditionInfo = BitIO.WriteBits(this.conditionInfo, num, BITMASK.rank);
        this.rebuildStatusIcons();
    }

    /** Whether this unit is capable of receiving commands. */
    get orderable(): boolean {
        return BitIO.GetBoolean(this.conditionInfo, BITMASK.orderable);
    }
    set orderable(b: boolean) {
        this.conditionInfo = BitIO.WriteBits(this.conditionInfo, ~~b, BITMASK.orderable);
    }

    /** Whether this unit is considered a CO unit. */
    get CoOnBoard(): boolean {
        return BitIO.GetBoolean(this.conditionInfo, BITMASK.CoOnBoard);
    }
    set CoOnBoard(b: boolean) {
        this.conditionInfo = BitIO.WriteBits(this.conditionInfo, ~~b, BITMASK.CoOnBoard);
        this.rebuildStatusIcons();
    }

    /** Whether this unit could potentially be a CO unit; a UI convenience. */
    get CoCouldBoard() { return this._CoCouldBoard; };
    set CoCouldBoard(b) {
        this._CoCouldBoard = b;
        this.rebuildStatusIcons();
    }
    private _CoCouldBoard = false;

    /** True if one of this unit's held units (recursive) is a CO unit. */
    get CoUnitIsCargo(): boolean {
        if (this._cargo.length === 0)
            return false;
        return this._cargo.some( u => u.CoOnBoard || u.CoUnitIsCargo );
    }

    /** True if at least one of this unit's held units (non-recursive) is not a CO unit. */
    get nonCoUnitIsCargo(): boolean {
        if (this._cargo.length === 0)
            return false;
        return this._cargo.some( u => !u.CoOnBoard ); // No recursion
    }

    /** True if this unit is located inside the CO Zone of its commanding officer. */
    get withinCoZone(): boolean {
        return this.boardPlayer.withinCoRange(this.boardLocation);
    }

    /** Whether this unit has carried out its order. */
    get spent(): boolean {
        return (!this.orderable && this.sprite.tint === UnitObject.TintShade);
    }
    set spent(b: boolean) {
        // Visually indicate un-orderable-ness.
        this.sprite.tint = (!b) ? 0xFFFFFF : UnitObject.TintShade;
        this.uiBox.children.forEach( child => {
            if ((child as PIXI.Sprite).tint)
                (child as PIXI.Sprite).tint = (!b) ? 0xFFFFFF : UnitObject.TintShade;
        });
        // Units *must* be set orderable deliberately, but spent units are always unorderable.
        if (b) this.orderable = false;
    }

    /** Whether this unit's sprite should show up on the board. */
    get visible() { return this.sprite.visible; }
    set visible(b: boolean) {
        this.sprite.visible = b;
        this.uiBox.visible = b;
    }

    /** Whether this unit is hidden from any non-allied players. */
    // TODO Shouldn't this be in stateInfo?
    get hiding() { return this._hiding; }
    set hiding(b: boolean) {
        this._hiding = b;
        this.rebuildStatusIcons();
    }
    private _hiding = false;

    /** Whether this unit is visible to the given player object.
     * @deprecated (Unless this is a shortcut to adjacency checks) */
    visibleToPlayer(player: BoardPlayer, neighbors: NeighborMatrix<Square>) {
        const revealedByEnemy = neighbors && neighbors.orthogonals
            .some( square => square.unit?.faction === player.faction );
        const revealedToSamePlayer = (this.faction === player.faction);
        return (!this.hiding || revealedByEnemy || revealedToSamePlayer);
    }

    /** Returns true if this unit has some applied status condition. */
    get statusApplied() { return this.statusTextures.length > 0; }

    /** The unit's x-coordinate on the game board. */
    private get x(): number {
        return BitIO.ReadBits(this.stateInfo, BITMASK.xCoord);
    }
    private set x(num) {
        this.stateInfo = BitIO.WriteBits(this.stateInfo, num, BITMASK.xCoord);
    }

    /** The unit's y-coordinate on the game board. */
    private get y(): number {
        return BitIO.ReadBits(this.stateInfo, BITMASK.yCoord);
    }
    private set y(num) {
        this.stateInfo = BitIO.WriteBits(this.stateInfo, num, BITMASK.yCoord);
    }

    /** This unit's position on the game board. This is *not* the unit-graphic's position in the game-world, though it does affect that. */
    get boardLocation(): Point {
        return new Point(this.x, this.y);
    }
    set boardLocation(point: Point) {
        if (point.notEqual(this.boardLocation))
            this.stopCapturing();

        this.x = point.x;
        this.y = point.y;

        // Update graphic transforms
        UnitObject.transform.x = this.x * Game.display.standardLength;
        UnitObject.transform.y = this.y * Game.display.standardLength;
        UnitObject.transform.scale.x = 1;
        UnitObject.transform.object = this.uiBox;   // Move to location set

        UnitObject.transform.object = this.sprite;  // Move to location set
        if (this.reverseFacing) {
            UnitObject.transform.scale.x = -1;
            UnitObject.transform.x += 16;
        }

        UnitObject.transform.object = null;
        
        this.uiBox.zIndex = -1; // Below the cursor, menus etc.
    }

    /** Returns true if this unit has a valid board location.
     * Does not report whether any map tile has this unit as a member. */
    get onMap(): boolean {
        // (255,255) is (-1,-1) after bit masking
        return this.boardLocation.notEqual(new Point(255,255));
    }

    get reverseFacing() {
        return BitIO.GetBoolean(this.stateInfo, BITMASK.reverseFacing);
    }
    set reverseFacing(b: boolean) {
        this.stateInfo = BitIO.WriteBits(this.stateInfo, ~~b, BITMASK.reverseFacing);
    }

    /** Callback function used to update this unit's internal state. */
    private update() {
        this.setCurrentAnimationFrame();
        this.setCurrentStatusIcon();
        this.setTransparencySlider();
    }

    /** Chooses an animation frame based on the unit's animation speed and the the Game's elapsed frame count.
     * This method is used so that every unit on screen is synced. */
    private setCurrentAnimationFrame() {
        let framesPerFrameUpdateInterval = 12;
        let intervalCount = Math.floor(Game.frameCount / framesPerFrameUpdateInterval);
        let frameIdx = intervalCount % this.sprite.totalFrames;
        this.sprite.texture = this.sprite.textures[frameIdx];
    }

    /** Status icons are a list of icon textures as frames in an animated sprite. This method includes only the icons relevant to this unit's condition. */
    private rebuildStatusIcons() {
        const sheet = Game.scene.resources['UISpritesheet'].spritesheet as PIXI.Spritesheet;
        const color = FactionColors[this.faction];

        // Icon conditions of inclusion
        const iconLabels = [
            {
                name: `icon-co-badge.png`,
                condition: (this.CoOnBoard),
            },
            {
                name: `icon-co-badge-faded.png`,
                condition: (this.CoCouldBoard),
                // blink: true,
            },
            {
                name: `icon-co-badge-folded.png`,
                condition: (this.CoUnitIsCargo),
            },
            {
                name: `icon-level-${this.rank}.png`,
                condition: (this.rank > 0 && !this.CoOnBoard),
            },
            {
                name: `icon-low-gas-${color}.png`,
                condition: (this.lowGas),
            },
            {
                name: `icon-low-ammo-${color}.png`,
                condition: (this.lowAmmo && !this.materialsInsteadOfAmmo),
            },
            {
                name: `icon-low-material-${color}.png`,
                condition: (this.lowAmmo && this.materialsInsteadOfAmmo),
            },
            {
                name: `icon-capturing-${color}.png`,
                condition: (this.capturing),
            },
            {
                name: `icon-boarded-${color}.png`,
                condition: (this._cargo.length > 0 && !this.CoUnitIsCargo),
            },
            {
                name: `icon-hidden-${color}.png`,
                condition: (this.hiding),
            },
        ];

        // Filter to applied icons only
        const iconValids = iconLabels.filter( i => i.condition );
        const iconSet = iconValids.map( i => sheet.textures[i.name] );

        if (iconValids.length === 1 && iconValids[0].blink)
            iconSet.push(PIXI.Texture.EMPTY);

        // Set and construct
        this.statusTextures = iconSet;
        this.setCurrentStatusIcon();
    }

    /** Chooses a status icon to display on the unit's UI box. */
    private setCurrentStatusIcon() {
        const updateFrequency = 50; // frames
        const intervalCount = Math.floor(Game.frameCount / updateFrequency);
        const frameIdx = intervalCount % this.statusTextures.length;

        if (this.statusTextures.length > 0) {
            const frame = this.statusTextures[frameIdx];
            this.statusIcons.texture = frame;
            this.previewStatusIcons.texture = frame;
        }
        else {      // Nothing to set, so empty.
            //@ts-expect-error
            this.statusIcons.texture = null;
            //@ts-expect-error
            this.previewStatusIcons.texture = null;
        }

        // TODO Keep or remove?
        // Blink the HP meter (preview) so we can see the unit underneath.
        // const intervalRaw = Game.frameCount / updateFrequency - intervalCount;
        // const alpha = (intervalCount % 3 === 0) ? 1 : 0;
        // this.previewStatusIcons.alpha = alpha;
        // this.previewHpMeter.alpha = alpha;
    }

    /** Increments the unit's transparency toward one of the slider's extremes, depending on the unit's transparency state. */
    private setTransparencySlider() {
        let dir = (this.transparent) ? 1 : -1;
        this.transparencySlider.increment(dir);

        this.sprite.alpha = 1 - this.transparencySlider.output;
        this.uiBox.alpha = 1 - this.transparencySlider.output * 1.15;
    }

    /** Request the unit to make progress toward capturing the building they are located over. */
    captureBuilding() {
        let captureAmt = Math.ceil(this.hp*0.1);    // A single digit, always at least 1 (unless the unit has been deadened.)
        this.capture += captureAmt;
        this.capture = Common.confine(this.capture, 0, UnitObject.MaxCapture);
    }

    /** Returns true if this unit has successfully captured the building they are located over. */
    buildingCaptured() {
        return this.capture == UnitObject.MaxCapture;
    }

    /** Resets the unit's capture meter. */
    stopCapturing() {
        this.capture = 0;
    }

    /** Returns true if this unit has resources that need resupplying. */
    resuppliable(unit?: UnitObject, options: {strict: boolean} = {strict: true}): boolean {
        const { strict } = options;
        const lowGas = (this.gas < this.maxGas);
        const lowAmmo = (this.ammo < this.maxAmmo && this.ammoCanBeResupplied);
        const supplierUnit = (unit?.canResupply === true);
        const alliedSupplier = (unit?.faction === this.faction);
        const notSelf = (unit !== this);
        return (lowGas || lowAmmo || !strict) && (!unit || supplierUnit && alliedSupplier && notSelf);
    }

    /** Resupplies this unit with operational resources. */
    resupply() {
        this.gas = this.maxGas;
        if (this.ammoCanBeResupplied)
            this.ammo = this.maxAmmo;
    }

    /** Resupplies this units on-board units, if it is a supplier unit.
     * Returns true if any units were resupplied by this function call. */
    resupplyHeldUnits() {
        if (this.canResupplyHeldUnits) {
            const resupplied = this._cargo.some( unit => unit.resuppliable() );
            this._cargo.forEach( unit => unit.resupply() );
            return resupplied;
        }
        return false;
    }

    /** Spends a set amount of gas needed to keep the unit aloft / whatever boats do. */
    expendMaintainanceGas() {
        // Instead of letting the units override, I'm just gonna write it here for now.
        if (this.unitClass === UnitClass.Air)
            this.gas -= 5;
        else if (this.type === Unit.Submarine && this.hiding)
            this.gas -= 5;
        else if (this.unitClass === UnitClass.Naval)
            this.gas -= 2;
    }

    /** Returns true if this unit can merge with the given unit as the result of a Join command. */
    mergeable(unit: UnitObject): boolean {
        const notSelf = (this !== unit);
        const sameType = (this.type === unit.type);
        const sameFaction = (this.faction === unit.faction);
        const oneRepairable = (this.repairable || unit.repairable);
        const notHolding = (this.cargo.length === 0 && unit.cargo.length === 0);
        return notSelf && sameType && sameFaction && oneRepairable && notHolding;
    }

    /** Returns true if this unit can hold the given unit, or is capable of
     * holding units generally if no unit was given. */
    boardable(unit?: UnitObject): boolean {
        return false;
    }

    /** Returns true if the given terrain is of a type this unit can unload units from. */
    unloadPosition(terrain: TerrainObject): boolean {
        return false;
    }

    /** A number 0, 1 or 2 indicating this unit's best attack effectiveness
     * rating against a given armor type among all its weapons. */
    getIdealAttackHeuristic(armorType: ArmorType) {
        const primaryRating = this.getAttackHeuristic(this.weapon.primary, armorType);
        const secondaryRating = this.getAttackHeuristic(this.weapon.secondary, armorType);
        return Math.max(primaryRating, secondaryRating);
    }

    /** Retrieves the attack-effectiveness rating of an action from this unit via an attack against an armor-type. */
    private getAttackHeuristic(attack: AttackInfo, armorType: ArmorType) {
        try {
            return attack.targetMap[armorType];
        } catch (err) {
            Debug.print(`UnitObject.getAttackHeuristic() → `, 'Armor Type: ', armorType, 'Attack: ', attack, err);
            return 0;
        }
    }

    /** Retrieves the base damage dealt from this unit via an attack to a unit-type designated by its serial. */
    private getAttackBaseDamage(attack: AttackInfo, unitSerial: number) {
        try {
            return attack.damageMap[unitSerial];
        } catch (err) {
            Debug.print(`UnitObject.getAttackBaseDamage() → `, 'Attack: ', attack, 'Unit Serial: ', unitSerial, err);
            return 0;
        }
    }

    /** Returns the AttackMethod-type if the given target is attackable via either this unit's
     * primary or secondary weapons; if it isn't, returns AttackMethod.None */
    attackMethodFor(target: UnitObject): AttackMethod {
        const primaryRating = this.getAttackHeuristic(this.weapon.primary, target.armorType);
        const secondaryRating = this.getAttackHeuristic(this.weapon.secondary, target.armorType);

        if (primaryRating > 0 && this.ammo > 0)
            return AttackMethod.Primary;
        else if (secondaryRating > 0)
            return AttackMethod.Secondary;
        else
            return AttackMethod.None;
    }

    /** Returns true if this unit can launch an attack against the given unit. */
    canTarget(unit: UnitObject) {
        let attackable = (this.attackMethodFor(unit) != AttackMethod.None);
        let nonAllied = (this.faction != unit.faction);
        return (attackable && nonAllied);
    }

    /** Returns true if this unit is capable of counter-attacking aggressors.
     * Counter-attacks are only valid against adjacent units; it is recommended to move
     * the aggressor's board location before calling this method. */
    canCounterAttack(unit: UnitObject, position: Point) {
        const targetable = this.canTarget(unit);
        const inRange = (this.range.min == 1);
        const distance = new Point(this.boardLocation).manhattanDistance(position);
        const adjacent = (distance == 1);
        return targetable && inRange && adjacent;
    }

    // TODO couldTarget() → canTargetArmor() && canTarget() → canTargetUnit()
    /** Returns true if this unit could attack the given armor type. */
    couldTarget(armorType: ArmorType) {
        const primaryRating = this.getAttackHeuristic(this.weapon.primary, armorType);
        const secondaryRating = this.getAttackHeuristic(this.weapon.secondary, armorType);
        return ((primaryRating > 0 && this.ammo > 0) || secondaryRating > 0);
    }

    /** Returns a number representing the base damage of an attack on the target.
     * Defaults to primary weapon when applicable.
     * Note: this method ~does not~ reduce the unit's ammunition. */
    baseDamage(target: UnitObject): number {
        const primaryDmg = this.getAttackBaseDamage(this.weapon.primary, target.serial);
        const secondaryDmg = this.getAttackBaseDamage(this.weapon.secondary, target.serial);
        return (primaryDmg > 0 && this.ammo > 0) ? primaryDmg : secondaryDmg;
    }

    /** This unit's list of loaded units. */
    get cargo() {
        return this._cargo.slice();
    }
    protected _cargo: UnitObject[] = [];

    /** Loads a unit into this unit's load list. */
    loadUnit(unit: UnitObject) {
        this._cargo.push(unit);
        this.rebuildStatusIcons();
    }

    /** Unloads the given unit from this unit's load list. */
    unloadUnit(n: number): UnitObject {
        if (!Common.within(n, 0, this._cargo.length - 1))
            throw new Error(`Can't unload unit at index ${n}`);
        const u = this._cargo[n];
        this._cargo = this._cargo.filter( (u,i) => i !== n );
        this.rebuildStatusIcons();
        return u;
    }

}
