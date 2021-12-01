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
    const p = Point;
    let vectors = [p.Origin, p.Up, p.Right, p.Down, p.Left];
    return vectors[dir];
}

/** Returns a CardinalVector value given a point-vector. This function is strict and will only
 * accept one of the four unit-vector directions (one integer up, down, left or right), and
 * will otherwise return CardinalDirection.None. */
export function CardinalVectorToCardinal(point: Point) {
    const p = Point;
    const cd = CardinalDirection;

    const points = [p.Origin, p.Up, p.Right, p.Down, p.Left];
    const dirs = [cd.None, cd.North, cd.East, cd.South, cd.West];

    const final = dirs.find( (dir, idx) => points[idx].equal(point) ) || cd.None;
    return final;
};

/** Given a list of directions, returns a cumulative sum vector as a Point object. */
export function SumCardinalsToVector(dirs: CardinalDirection[]): Point {
    if (dirs.length == 0)
        return Point.Origin;
    const vectors = dirs.map( dir => CardinalVector(dir) );
    const final = vectors.reduce( (sum, next) => sum.add(next) );
    return final;
}