import { Point } from "../../Common/Point";
import { CardinalDirection } from "../../Common/CardinalDirection";
import { Instruction } from "../EnumTypes";

/** Represents a basic  */
export type CommandInstruction = {
    /** The place with which to give the order; usually contains an actor. */
    place?: Point,

    /** The actor's movement path. */
    path?: CardinalDirection[],

    /** The codified contextual action to be taken. */
    action?: Instruction,

    /** The action's codified variation. */
    which?: number,

    /** The action's point of execution. */
    focal?: Point,

    /** The seed for any random nummber generation. */
    seed?: number,

    /** A list of of the actor's held units to drop onto the map. */
    drop: { which: number, where: Point }[],
}