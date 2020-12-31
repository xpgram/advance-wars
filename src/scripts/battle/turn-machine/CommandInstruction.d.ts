import { Point } from "../../Common/Point";
import { CardinalDirection } from "../../Common/CardinalDirection";

export type CommandInstruction = {
    /** The place with which to give the order; usually contains an actor. */
    place: Point | null,

    /** The actor's movement path. */
    path: CardinalDirection[] | null,

    /** The codified contextual action to be taken. */
    action: number | null,
    // TODO An enum?

    /** The action's codified variation. */
    which: number | null,
    // TODO Hard to boil down to an enum.

    /** The action's point of execution. */
    focal: Point | null,
}