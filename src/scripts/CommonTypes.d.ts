import { LowResTransform } from "./LowResTransform"

/** Captures generic classes. */
type Class<T> = {
    new (...args: any[]): T
};

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

/** Describes any object whose draw-to-screen is toggleable. */
type RenderToggleable = {
    renderable: boolean,
}

/** An object with a 2d grid of toggleably renderable objects. */
type Cullable = {
    getGrid(): RenderToggleable[][],
    readonly gridCellPixelSize: number
}