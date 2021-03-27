import { Point } from "../../Common/Point";
import { CardinalDirection } from "../../Common/CardinalDirection";

// TODO Is this right?
export enum InstructedAction {
    Wait = 0,
    Attack,
    Build,
    Special1,
    Special2,
}

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

    /** The seed for any random nummber generation. */
    seed: number | null,
}