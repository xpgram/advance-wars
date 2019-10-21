import { LowResTransform } from "./LowResTransform"

/** Captures PIXI's object-transform style. */
type Transformable = {
    x: number,
    y: number,
    zIndex: number,
    rotation: number,
    scale: {
        x: number,
        y: number
    },
    width: number,
    height: number
}

type TransformContainer = {
    transform: LowResTransform
}

/** Represents a point in 2D space. */
type Point = {
    x: number,
    y: number
}

/** Represents a point in 3D space. */
type Point3D = {
    x: number,
    y: number,
    z: number
}

/** A dictionary-type which uses numbers as keys. */
type NumericDictionary<T> = {
    [key: number]: T
}

/** A dictionary-type which uses strings as keys. */
type StringDictionary<T> = {
    [key: string]: T
}