import { Point } from "../../Common/Point";
import { CardinalDirection } from "../../Common/CardinalDirection";
import { Instruction } from "../EnumTypes";

/** Represents a drop-held-unit instruction. */
export type CommandDropInstruction = {
    which: number,
    where: Point,
}

/** Represents a discrete unit turn-instruction in its most basic terms. */
export class CommandInstruction {
    /** The place with which to give the order; usually contains an actor. */
    place?: Point;

    /** The actor's movement path. */
    path?: CardinalDirection[];

    /** The codified contextual action to be taken. */
    action?: Instruction;

    /** The action's codified variation. */
    which?: number;

    /** The action's point of execution. */
    focal?: Point;

    /** The seed for any random nummber generation. */
    seed: number = Math.trunc(Math.random() * Number.MAX_SAFE_INTEGER);

    /** A list of of the actor's held units to drop onto the map. */
    drop: CommandDropInstruction[] = [];
}