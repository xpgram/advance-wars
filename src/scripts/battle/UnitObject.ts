import { Common } from "../CommonUtils";
import { LowResTransform } from "../LowResTransform";
import { Game } from "../..";
import { UnitClass, FactionColors, MoveType, ArmorType, Faction, AttackMethod } from "./EnumTypes";
import { Debug } from "../DebugUtils";
import { fonts } from "./ui-windows/DisplayInfo";
import { MapLayer, MapLayerFunctions } from "./map/MapLayers";
import { Unit } from "./Unit";
import { Slider } from "../Common/Slider";
import { Map } from "./map/Map";
import { PointPrimitive, Point } from "../Common/Point";
import { CommonRangesRetriever, RegionMap } from "./unit-actions/RegionMap";
import { BoardPlayer } from "./BoardPlayer";

export class UnitConstructionError extends Error {
    name = "UnitConstructionError";
}

/** An uninstantiated Unit class type. */
export interface UnitType {
    new (): UnitObject;
}

// Write bit-masking constants: length and shift amount
let shift = 0;
function genBitmask(length: number) {
    let mask = {shift: shift, length: length};
    shift += length;
    Debug.assert(shift < 32, `UnitObject.info cannot make use of more than 32 bits of information.`);
    return mask;
}
const hpBits = genBitmask(7);
const ammoBits = genBitmask(4);
const captureBits = genBitmask(5);
const gasBits = genBitmask(7);
const rankBits = genBitmask(2);
const orderableBits = genBitmask(1);

shift = 0;
const typeBits = genBitmask(6);
const factionBits = genBitmask(3);
const xCoordBits = genBitmask(8);
const yCoordBits = genBitmask(8);
const reverseFacingBits = genBitmask(1);

// Other constants
const hpLimit = 100;
const captureLimit = 20;
const rankLimit = 3;

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
    private static transform: LowResTransform = new LowResTransform();
    private static TintShade = 0x888888;
    private _sprite!: PIXI.AnimatedSprite;
    private uiBox!: PIXI.Container;
    private hpMeter!: PIXI.BitmapText;
    private statusIcons!: PIXI.Sprite;
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
    abstract get serial(): number;

    /** The sprite container for this unit. */
    get sprite(): PIXI.Sprite {
        return this._sprite;
    }

    /** A 16x16 thumbnail image for this unit type. */
    get preview(): PIXI.Sprite {
        // TODO This process, identifying the filepath, asking about soldier sprites because they're different, is common. Encapsulate it somewhere.
        let name = this.name.replace(' ','').replace('-','').toLowerCase();
        let color = FactionColors[this.faction];
        let army = ['rubinelle', 'lazurian'][this.faction % 2]; // TODO Get this from team.CO.armyType or something.
        let sprite;

        if (this.type == Unit.Infantry || this.type == Unit.Mech || this.type == Unit.Bike)
            sprite = new PIXI.Sprite(Unit.sheet.textures[`${name}/${army}/${color}/idle-1.png`]);
        else
            sprite = new PIXI.Sprite(Unit.sheet.textures[`${name}/${color}/idle-1.png`]);

        return sprite;
    }

    // TODO Rename this; 'exhibit' is stupid, I'm tired of reading it.
    /** A larger preview image of this unit type.  */
    get infoPortrait(): PIXI.Sprite {
        let name = this.name.replace(' ','').replace('-','').toLowerCase();
        return new PIXI.Sprite();

        //@ts-ignore    unitPortraitSheet doesn't exist yet or whatever; I'm tired of looking at it.
        return new PIXI.Sprite(Unit.unitPortraitSheet.textures[`${name}-portrait.png`]);
    }

    /** An object containing the texture sets for the sprite's three movement facings (left must be reflected for right-facing.) */
    get movementAnimations() {
        let name = this.name.replace(' ','').replace('-','').toLowerCase();
        let color = FactionColors[this.faction];
        let army = ['rubinelle', 'lazurian'][this.faction % 2];

        // Spriteset lookup functions
        let soldierSprites = (name: string, army: string, color: string, action: string): PIXI.Texture[] => {
            return Unit.sheet.animations[`${name}/${army}/${color}/${action}`];
        }
        let vehicleSprites = (name: string, army: string, color: string, action: string): PIXI.Texture[] => {
            return Unit.sheet.animations[`${name}/${color}/${action}`];
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
        Debug.assert(Boolean(o.up) && Boolean(o.down) && Boolean(o.left), `Generated set of movement textures is not complete or does not exist. [Up:${Boolean(o.up)}, Down:${Boolean(o.down)}, Left:${Boolean(o.left)}]`);

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

    /** The unit's maximum gas: a stat depleted while moving. */
    abstract get maxGas(): number;

    /** The unit's maximum ammunition: a stat depleted by attacking. */
    abstract get maxAmmo(): number;

    /** The unit's maximum travel distance, or travel effort, depending on terrain travel efficiency. */
    abstract get maxMovementPoints(): number;

    /** The distance this unit can see into fog of war conditions. */
    get vision() { return 2; }

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


    /* Left blank so that units can be instantiated as reference material without building expensive graphic objects, etc. */
    constructor() { }

    /** Must be called before use. Builds unit graphics, configures important stats. */
    init(options: {boardPlayer: BoardPlayer, faction: Faction}) {
        let sheet = Game.app.loader.resources['UnitSpritesheet'].spritesheet as PIXI.Spritesheet;
        // TODO If spritesheet is undefined... what happens?

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

        if (this.type == Unit.Infantry || this.type == Unit.Mech || this.type == Unit.Bike)
            this._sprite = new PIXI.AnimatedSprite(sheet.animations[`${name}/${country}/${color}/idle`]);
        else
            this._sprite = new PIXI.AnimatedSprite(sheet.animations[`${name}/${color}/idle`]);
        //this.sprite.scale.x = (team.playerNumber % 2 == 0) ? 1 : -1;
        this.reverseFacing = (this.faction % 2 == 1);
        // TODO Make this more permenant. LowResT just erases it.
        
        // TODO Square.placeUnit() already does this. Is this step necessary?
        const row = MapLayerFunctions.RowLayerFromWorldPosition(this.boardLocation);
        MapLayer('top', row, 'unit').addChild(this.sprite);

        // Build UI elements.
        this.uiBox = new PIXI.Container();

        this.hpMeter = new PIXI.BitmapText('', fonts.smallScriptOutlined);
        this.hpMeter.anchor = 1; // 1,1: bottom right corner
        this.hpMeter.x = 15; // Sprite b-right corner of the sprite
        this.hpMeter.y = 18; // Font height adjustment
        this.uiBox.addChild(this.hpMeter);

        this.statusIcons = new PIXI.Sprite(); // Empty
        this.statusIcons.y = 8;    // middle left of the unit box (texture anchor is top left)
        this.uiBox.addChild(this.statusIcons);

        MapLayer('ui').addChild(this.uiBox);
        
        // TODO Create an Army class which keeps track of CO and a list of all allied units, represents a team/player, etc.
        // TODO Use Army to fill in this unit object's faction, player orientation (player 2 always faces left), etc.

        // Configure basic stats.
        this.stateInfo = Common.writeBits(this.stateInfo, this.serial, typeBits.length, typeBits.shift);
        this.hp = 100;
        this.ammo = this.maxAmmo;
        this.gas = this.maxGas;

        // *Activate* this unit's update step.
        Game.scene.ticker.add(this.update, this);
    }

    /** Loads unit info (a 32-bit number) into this unit object. */
    load(stateInfo: number, conditionInfo: number) {
        this.stateInfo = stateInfo;
        this.conditionInfo = conditionInfo;
    }

    /* TODO Not yet implemented. */
    destroy() { 
        this.boardPlayer.map.removeUnit(this.boardLocation);
        this.boardPlayer.unspawnUnit(this);
        
        //@ts-expect-error
        this.boardPlayer = undefined;
        this.sprite.destroy({children: true});
        this.uiBox.destroy({children: true});
        Game.scene.ticker.remove(this.update, this);
    }

    /** The unit's team-assocation. */
    get faction(): number {
        return Common.readBits(this.stateInfo, factionBits.length, factionBits.shift);
    }
    set faction(faction: number) {
        this.stateInfo = Common.writeBits(this.stateInfo, faction, factionBits.length, factionBits.shift);
    }

    /** The unit's remaining health. */
    get hp(): number {
        return Common.readBits(this.conditionInfo, hpBits.length, hpBits.shift);
    }
    set hp(num) {
        num = Common.confine(num, 0, hpLimit);
        this.conditionInfo = Common.writeBits(this.conditionInfo, num, hpBits.length, hpBits.shift);
        
        // Update unit's UI layer
        if (this.hp <= 90)
            this.hpMeter.text = this.displayHP.toString();
        else
            this.hpMeter.text = '';
    }

    /** The unit's HP, but as a number between 0 and 10. A UI feature. */
    get displayHP(): number {
        return Math.ceil(this.hp * 0.1);
    }

    /** The unit's remaining ammo. */
    get ammo(): number {
        return Common.readBits(this.conditionInfo, ammoBits.length, ammoBits.shift);
    }
    set ammo(num) {
        this.conditionInfo = Common.writeBits(this.conditionInfo, num, ammoBits.length, ammoBits.shift);
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

    /** Returns true if this unit can attack distant targets. */
    get isIndirect(): boolean {
        return this.range.max > 1;
    }

    /** The unit's progress toward capturing a building. */
    get capture(): number {
        return Common.readBits(this.conditionInfo, captureBits.length, captureBits.shift);
    }
    set capture(num) {
        this.conditionInfo = Common.writeBits(this.conditionInfo, num, captureBits.length, captureBits.shift);
        this.rebuildStatusIcons();
    }

    /** Whether this unit has made any progress toward capturing the building they're located over. */
    get capturing(): boolean {
        return this.capture > 0;
    }

    /** The unit's remaining gas or movement points. */
    get gas(): number {
        return Common.readBits(this.conditionInfo, gasBits.length, gasBits.shift);
    }
    set gas(num) {
        this.conditionInfo = Common.writeBits(this.conditionInfo, num, gasBits.length, gasBits.shift);
        this.rebuildStatusIcons();
    }

    /** Whether this unit is low on gas. */
    get lowGas(): boolean {
        let lowGasThreshold = this.maxGas / 2;
        return (this.gas <= lowGasThreshold);
    }

    /** The unit's acquired rank or experience level through battle. */
    get rank(): number {
        return Common.readBits(this.conditionInfo, rankBits.length, rankBits.shift);
    }
    set rank(num) {
        num = Common.confine(num, 0, rankLimit);
        this.conditionInfo = Common.writeBits(this.conditionInfo, num, rankBits.length, rankBits.shift);
        this.rebuildStatusIcons();
    }

    /** Whether this unit is capable of receiving commands. */
    get orderable(): boolean {
        let n = Common.readBits(this.conditionInfo, orderableBits.length, orderableBits.shift);
        return n == 1;
    }
    set orderable(b: boolean) {
        let n = Number(b);
        this.conditionInfo = Common.writeBits(this.conditionInfo, n, orderableBits.length, orderableBits.shift);
    }

    /** Whether this unit has carried out its order. */
    get spent(): boolean {
        let n = Common.readBits(this.conditionInfo, orderableBits.length, orderableBits.shift);
        return (n !== 1 && this.sprite.tint === UnitObject.TintShade);
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

    /** The unit's x-coordinate on the game board. */
    private get x(): number {
        return Common.readBits(this.stateInfo, xCoordBits.length, xCoordBits.shift);
    }
    private set x(num) {
        this.stateInfo = Common.writeBits(this.stateInfo, num, xCoordBits.length, xCoordBits.shift);
    }

    /** The unit's y-coordinate on the game board. */
    private get y(): number {
        return Common.readBits(this.stateInfo, yCoordBits.length, yCoordBits.shift);
    }
    private set y(num) {
        this.stateInfo = Common.writeBits(this.stateInfo, num, yCoordBits.length, yCoordBits.shift);
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

        // Recalculate z-index
        // if (has y position changed?)
        //   MapLayer('top', 'unit').addChild(this.sprite);
        //   MapLayerFunctions.SortBatchLayerIntoPartitions();
        // this.sprite.zIndex = Map.calculateZIndex(point, 'unit');
        this.uiBox.zIndex = -1; // Below the cursor, menus etc.
    }

    get reverseFacing() {
        let n = Common.readBits(this.stateInfo, reverseFacingBits.length, reverseFacingBits.shift);
        return Boolean(n);
    }
    set reverseFacing(b: boolean) {
        let n = Number(b);
        this.stateInfo = Common.writeBits(this.stateInfo, n, reverseFacingBits.length, reverseFacingBits.shift);
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
        let sheet = Game.scene.resources['UISpritesheet'].spritesheet as PIXI.Spritesheet;
        let color = FactionColors[this.faction];

        this.statusTextures = [];
        if (this.rank > 0) this.statusTextures.push( sheet.textures[`icon-level-${this.rank}.png`] );
        if (this.lowGas) this.statusTextures.push( sheet.textures[`icon-low-gas-${color}.png`] );
        if (this.materialsInsteadOfAmmo) {
            if (this.lowAmmo) this.statusTextures.push( sheet.textures[`icon-low-material-${color}.png`] );
        } else {
            if (this.lowAmmo) this.statusTextures.push( sheet.textures[`icon-low-ammo-${color}.png`] );
        }
        if (this.capturing) this.statusTextures.push( sheet.textures[`icon-capturing-${color}.png`] );

        this.setCurrentStatusIcon();
    }

    /** Chooses a status icon to display on the unit's UI box. */
    private setCurrentStatusIcon() {
        if (this.statusTextures.length > 0) {
            let updateFrequency = 1.2 * 60;   // desired seconds * fps
            let intervalCount = Math.floor(Game.frameCount / updateFrequency);
            let frameIdx = intervalCount % this.statusTextures.length;
            this.statusIcons.texture = this.statusTextures[frameIdx];
        }
        else {      // Nothing to set, so empty.
            //@ts-ignore
            this.statusIcons.texture = null;
        }
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
        this.capture = Common.confine(this.capture, 0, captureLimit);
    }

    /** Returns true if this unit has successfully captured the building they are located over. */
    buildingCaptured() {
        return this.capture == captureLimit;
    }

    /** Resets the unit's capture meter. */
    stopCapturing() {
        this.capture = 0;
    }

    /** Returns true if this unit has resources that need resupplying. */
    resuppliable(unit?: UnitObject): boolean {
        const lowGas = (this.gas < this.maxGas);
        const lowAmmo = (this.ammo < this.maxAmmo && !this.materialsInsteadOfAmmo);
        const supplierUnit = (unit?.type === Unit.Rig);
        const alliedSupplier = (unit?.faction === this.faction);
        const notSelf = (unit !== this);
        return (lowGas || lowAmmo) && (!unit || supplierUnit && alliedSupplier && notSelf);
    }

    /** Resupplies this unit with operational resources. */
    resupply() {
        this.gas = this.maxGas;
        if (!this.materialsInsteadOfAmmo)
            this.ammo = this.maxAmmo;
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
    canCounterAttack(unit: UnitObject) {
        const targetable = this.canTarget(unit);
        const inRange = (this.range.min == 1);
        const distance = new Point(this.boardLocation).manhattanDistance(unit.boardLocation);
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
}