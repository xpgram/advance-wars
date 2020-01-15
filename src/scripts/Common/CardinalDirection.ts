import { Point } from "./Point";

export enum CardinalDirection {
    North,
    East,
    South,
    West
}

/** Returns a 2D identity vector (Point object) corresponding to the given CardinalDirection. */
export function CardinalVector(dir: CardinalDirection): Point {
    let vectors = [
        Point.Up,
        Point.Right,
        Point.Down,
        Point.Left
    ];
    return vectors[dir];
}