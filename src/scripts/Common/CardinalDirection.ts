import { Point } from "./Point";

export enum CardinalDirection {
    None,
    North,
    East,
    South,
    West
}

/** Returns a 2D identity vector (Point object) corresponding to the given CardinalDirection. */
export function CardinalVector(dir: CardinalDirection): Point {
    let vectors = [
        new Point(),
        Point.Up,
        Point.Right,
        Point.Down,
        Point.Left
    ];
    return vectors[dir];
}

/** Returns a CardinalVector value given a point-vector. This function is strict and will only
 * accept one of the four unit-vector directions (one integer up, down, left or right), and
 * will otherwise return CardinalDirection.None. */
export function CardinalVectorToCardinal(point: Point) {
    let points = [new Point(), Point.Up, Point.Right, Point.Down, Point.Left];
    let dirs = [CardinalDirection.None,
                CardinalDirection.North,
                CardinalDirection.East,
                CardinalDirection.South,
                CardinalDirection.West];

    for (let i = 0; i < points.length; i++) {
        if (points[i].equals(point))
            return dirs[i];
    }

    // Default
    return CardinalDirection.None;
};