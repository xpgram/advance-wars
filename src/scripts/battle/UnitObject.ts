import { Common } from "../CommonUtils";
import { LowResTransform } from "../LowResTransform";
import { Game } from "../..";
import { UnitClass, FactionColors, MoveType, ArmorType, Faction, AttackMethod } from "./EnumTypes";
import { Debug } from "../DebugUtils";
import { fonts } from "./ui-windows/DisplayInfo";
import { MapLayers } from "./MapLayers";
import { Unit } from "./Unit";
import { Slider } from "../Common/Slider";
import { Map } from "./Map";
import { PointPrimitive } from "../Common/Point";

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
 * vital information into one 64-bit value to save memory. This actually saves a lot of space.
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
    private sprite!: PIXI.AnimatedSprite;
    private uiBox!: PIXI.Container;
    private hpMeter!: PIXI.BitmapText;
    private statusIcons!: PIXI.Sprite;
    private statusTextures: PIXI.Texture[] = []

    transparent = false;
    private transparencySlider = new Slider({
        max: .7,
        granularity: .35     // About 3 frames between min and max.
    });

    private team!: Army;

    /** A 64-bit number representing all of the Unit's volatile information. */
    private conditionInfo = 0;
    private stateInfo = 0;      // TODO Come up with good names for these

    /** A reference to this object's unit-kind. Used for retrieving constants about the unit. */
    abstract get type(): UnitType;

    /** Numerical index of unit types. Used for saving/loading, primarily. */
    abstract get serial(): number;

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
    get exhibitImage(): PIXI.Sprite {
        let name = this.name.replace(' ','').replace('-','').toLowerCase();
        return new PIXI.Sprite(Unit.exhibitSheet.textures[`${name}-exhibit.png`]);
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

    /** The unit's maximum gas: a stat depleted while moving. */
    abstract get maxGas(): number;

    /** The unit's maximum ammunition: a stat depleted by attacking. */
    abstract get maxAmmo(): number;

    /** The unit's maximum travel distance, or travel effort, depending on terrain travel efficiency. */
    abstract get maxMovementPoints(): number;

    /** The distance this unit can see into fog of war conditions. */
    get vision() { return 2; }

    /** Whether this unit is a soldier-type. Soldier's have unique graphics depending on faction,
     * and have the unique ability to capture properties. */
    get soldierUnit() { return false; }

    /** Whether this unit has materials for building instead of ammunition for attacking.
     * Materials take over the ammunition stat when in effect. */
    get materialsInsteadOfAmmo() { return false; }

    /** The unit's class: either Groundforce, Airforce or Navy. */
    abstract get unitClass(): UnitClass;

    /** The unit's method of movement, which affects its efficiency of travel over terrain. */
    abstract get moveType(): MoveType;

    /** The unit's armor kind, which affects what may attack it. Generally, a marginal player convenience. */
    abstract get armorType(): ArmorType;

    /** A 6x2 matrix of unit armor-types and booleans indicating attackable/non-attackable armors. */
    protected abstract readonly armorTargetMatrix: number[][];

    /** An Nx2 matrix of base damage numbers, where N is the number of unit types. */
    protected abstract baseDamageMatrix: number[][];


    /* Left blank so that units can be instantiated as reference material without building expensive graphic objects, etc. */
    constructor() { }

    /** Must be called before use. Builds unit graphics, configures important stats. */
    init(team: Army) {
        let sheet = Game.app.loader.resources['UnitSpritesheet'].spritesheet;

        this.team = team;   // TODO Is this property necessary? When will Unit need to ask its team for something, outside of this method?
        this.faction = [Faction.Red, Faction.Black][ Math.floor(Math.random()*2) ];

        // Pick the right idle animation
        let name = this.name.replace(' ','').replace('-','').toLowerCase();
        let color = FactionColors[this.faction];
        //let country = team.country;
        let country = ['rubinelle','lazurian'][this.faction  % 2];

        if (this.type == Unit.Infantry || this.type == Unit.Mech || this.type == Unit.Bike)
            this.sprite = new PIXI.AnimatedSprite(sheet.animations[`${name}/${country}/${color}/idle`]);
        else
            this.sprite = new PIXI.AnimatedSprite(sheet.animations[`${name}/${color}/idle`]);
        //this.sprite.scale.x = (team.playerNumber % 2 == 0) ? 1 : -1;
        this.reverseFacing = (this.faction % 2 == 1);
        // TODO Make this more permenant. LowResT just erases it.
        
        MapLayers['top'].addChild(this.sprite);

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

        MapLayers['ui'].addChild(this.uiBox);
        
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

    /** Loads unit info (a 64-bit number) into this unit object. */
    load(stateInfo: number, conditionInfo: number) {
        this.stateInfo = stateInfo;
        this.conditionInfo = conditionInfo;
    }

    /* TODO Not yet implemented. */
    destroy() { 

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

    /** Returns the maximum number of movement points this unit currently has available for use.
     * This is either their move-points limit, or their remaining gas. */
    get movementPoints() {
        return (this.gas < this.maxMovementPoints) ? this.gas : this.maxMovementPoints;
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
        // Visually indicate un-orderable-ness.
        this.sprite.tint = (b) ? 0xFFFFFF : 0x888888;
        // Visually ... the UI Box as well.
        this.uiBox.children.forEach( child => {
            if ((child as PIXI.Sprite).tint)
                (child as PIXI.Sprite).tint = (b) ? 0xFFFFFF : 0x888888;
        });
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
    get boardLocation(): PointPrimitive {
        return {x: this.x, y: this.y};
    }
    set boardLocation(point: PointPrimitive) {
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
        this.sprite.zIndex = Map.calculateZIndex(point, 'unit');
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

        this.sprite.alpha = 1 - this.transparencySlider.value;
        this.uiBox.alpha = 1 - this.transparencySlider.value * 1.15;
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

    /** Resupplies this unit with operational resources. */
    resupply() {
        this.gas = this.maxGas;
        this.ammo = this.maxAmmo;
    }

    /** Returns the AttackMethod-type if the given target is attackable via either this unit's
     * primary or secondary weapons; if it isn't, returns AttackMethod.None */
    attackMethodFor(target: UnitObject): AttackMethod {
        let armorType = target.armorType;

        // TODO Debug.assert(something)
        // Just make sure armorType (number) is legal, ya know? A legal index

        let armorTuple = this.armorTargetMatrix[target.armorType];
        let primary = armorTuple[0];
        let secondary = armorTuple[1];

        if (primary && this.ammo > 0)
            return AttackMethod.Primary;
        else if (secondary)
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

    /** Returns a number representing the base damage of an attack on the target.
     * Defaults to primary weapon when applicable.
     * Note: this method ~does not~ reduce the unit's ammunition. */
    baseDamage(target: UnitObject): number {
        Debug.assert((target.serial < this.baseDamageMatrix.length && target.serial > 0),
            `Unit type ${target.name} has a serial not found in unit type ${this.name}'s base-damage matrix.`);

        let damageTuple = this.baseDamageMatrix[target.serial];
        let attackType = this.attackMethodFor(target);
        let damage = 0;

        if (attackType == AttackMethod.Primary)
            damage = damageTuple[0];
        else if (attackType == AttackMethod.Secondary)
            damage = damageTuple[1];
        
        return damage;
    }
}