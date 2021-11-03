import { Point } from "../../Common/Point";
import { CardinalDirection } from "../../Common/CardinalDirection";

/**  */
export type CommandInstruction = {
    /** The place with which to give the order; usually contains an actor. */
    place?: Point,

    /** The actor's movement path. */
    path?: CardinalDirection[],

    /** The codified contextual action to be taken. */
    action?: number,
    // TODO An enum?

    /** The action's codified variation. */
    which?: number,
    // TODO Hard to boil down to an enum.

    /** The action's point of execution. */
    focal?: Point,

    /** The seed for any random nummber generation. */
    seed?: number,
}