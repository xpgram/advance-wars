import { Point } from "./Common/Point";
import { LowResTransform } from "./LowResTransform"

/** Captures any object-constructing class type. */
type Constructable = {
    new (...args: any[]): object;
}

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
    transform: Transformable,
}

type PositionContainer = {
    position: {x: number, y: number},
}

/** Represents a point in 3D space. */
type Point3D = {
    x: number,
    y: number,
    z: number
}

/** A dictionary-type which uses numbers as keys. */
type NumericDictionary<T> = Iterable<T> & {
    [key: number]: T
}

/** A dictionary-type which uses strings as keys. */
type StringDictionary<T> = Iterable<T> & {
    [key: string]: T
}

/** An object which maintains a set of key-value pairs. */
type Dictionary<T> = Iterable<T> & {
    [key: string | number]: T
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

/** A container type which attaches labels to sprites for depth categorization. */
type LayeredSprite = {
    /** An sprite-object or container of sprite-objects. */
    image: PIXI.Container,
    /** The name of the layer this sprite-set belongs to. */
    layerName: string
}