import { Common } from "../CommonUtils";

/** An uninstantiated Unit class type. */
export interface UnitType {
    new (): UnitObject;
}

/**
 * This class is a container for unit variable-stat information.
 * Things like its HP, its remaining Gas, etc.
 * Constant stats are accessible through this class, but are not actually determined here;
 * Unit simply asks its UnitType what the number should be and passes it along.
 * 
 * For fun, and because Advance Wars itself does this, I have packed all or most of its
 * vital information into one 64-bit value to save memory. This actually saves a lot of space.
 * 
 * TODO:
 * This is the main class,
 * other's will extend this one.
 * 
 * This class holds most of the gameplay methods,
 * extenders add constants and sprite info.
 * Particularly:
 *  - buildSprite()                             Loads and sets the sprite representing this unit in the game world and gives the reference to this.sprite (this is always/only the idle animation)
 *     - animSpeed is assumed to be ??? unless we are an infantry/mech, in which case it is ???
 *     - When units are moving up/down, ~when~ do they change their z-index? Do they? Does the railcar just display over everything?
 *        - I mean, clearly not important for idle animations, but still a pertinent question.
 *  - damageMatrix(type: UnitType): number      Given a unit type (like terrain.type), return a number representing base damage.
 *  - moveType: MoveType                        Return this units method of travel as a MoveType value (enum)
 *  - 
 * 
 * TODO: Unit sprites
 * TODO: Link-up sprites (kind) to the movement car?
 * TODO: Read unit-type constants into the unit container (this)
 * TODO: Come up with a more maintainable bit-reading-writing architecture.
 * 
 * @author Dei Valko
 * @version 0.1.0
 */
export abstract class UnitObject {
    /** A reference to this object's unit-kind. Used for retrieving constants about the unit. */
    abstract readonly type: UnitType;

    /** A 64-bit number representing all or most of Unit's relevant information. */
    private info = 0;

    // Constants/accessor-values for Unit.info —— Any way to make these numbers
    // auto-configurable, by the way, would be wonderful.
    private static readonly hpShift = 0;
    private static readonly ammoShift = 7;
    private static readonly captureShift = 11;
    private static readonly gasShift = 16;
    private static readonly rankShift = 23;
    private static readonly xCoordShift = 26;
    private static readonly yCoordShift = 34;

    private static readonly oneHundredLength = 7;   // Up to "100" in decimal numbers
    private static readonly twentyLength = 5;       // Up to "20" in decimal numbers
    private static readonly tenLength = 4;          // Up to "10"
    private static readonly eightLength = 3;        // Integers 0–7
    private static readonly coordinateLength = 8;   // Up to 255

    constructor() {
        this.hp = 100;
        this.ammo = 0;  // this.type.ammo
        this.gas = 99;  // this.type.Gas
    }

    /* TODO Not yet implemented. */
    destroy() { 

    }

    /** The unit's remaining health. */
    get hp(): number {
        return Common.readBits(this.info, Unit.oneHundredLength, Unit.hpShift);
    }
    set hp(num) {
        this.info = Common.writeBits(this.info, num, Unit.oneHundredLength, Unit.hpShift);
    }

    /** The unit's remaining ammo. */
    get ammo(): number {
        return Common.readBits(this.info, Unit.tenLength, Unit.ammoShift);
    }
    set ammo(num) {
        this.info = Common.writeBits(this.info, num, Unit.tenLength, Unit.ammoShift);
    }

    /** The unit's progress toward capturing a building. */
    get capture(): number {
        return Common.readBits(this.info, Unit.twentyLength, Unit.captureShift);
    }
    set capture(num) {
        this.info = Common.writeBits(this.info, num, Unit.twentyLength, Unit.captureShift);
    }

    /** The unit's remaining gas or movement points. */
    get gas(): number {
        return Common.readBits(this.info, Unit.oneHundredLength, Unit.gasShift);
    }
    set gas(num) {
        this.info = Common.writeBits(this.info, num, Unit.oneHundredLength, Unit.gasShift);
    }

    /** The unit's acquired rank or experience level through battle. */
    get rank(): number {
        return Common.readBits(this.info, Unit.eightLength, Unit.rankShift);
    }
    set rank(num) {
        this.info = Common.writeBits(this.info, num, Unit.eightLength, Unit.rankShift);
    }

    /** The unit's x-coordinate on the game board. */
    get x(): number {
        return Common.readBits(this.info, Unit.coordinateLength, Unit.xCoordShift);
    }
    set x(num) {
        this.info = Common.writeBits(this.info, num, Unit.coordinateLength, Unit.xCoordShift);
    }

    /** The unit's y-coordinate on the game board. */
    get y(): number {
        return Common.readBits(this.info, Unit.coordinateLength, Unit.yCoordShift);
    }
    set y(num) {
        this.info = Common.writeBits(this.info, num, Unit.coordinateLength, Unit.yCoordShift);
    }

    // ↓ Methods for acquiring unit-type constants ↓
}