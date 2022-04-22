import { Point } from "./Common/Point";
import { LowResTransform } from "./LowResTransform"

/** Describes a partial object of type T where all children are also partial. */
type PartialDeep<T> = T extends object ? {
    [P in keyof T]?: PartialDeep<T[P]>;
} : T;

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

/** Selectively requires members of type T as described by the union type K.  
 * Written like `Include<Object, 'name' | 'range'>`. */
type Include<T, K extends keyof T> = Required<Pick<T,K>> & Omit<T,K>;

/** Selectively adds uncertainty to members of type T as described by the union type K.  
 * Written like `Optional<Object, 'name' | 'range'>`. */
type Optional<T, K extends keyof T> = Partial<Pick<T,K>> & Omit<T,K>;

/** Selectively immutablifies members of type T as described by the union type K.  
 * Written like `Const<Object, 'name' | 'range'>`. */
type Const<T, K extends keyof T> = Readonly<Pick<T,K>> & Omit<T,K>;

/** A dictionary-type which uses numbers as keys.
 * @deprecated Record<Y,T> makes this obsolete. */
type NumericDictionary<T> = Iterable<T> & {
    [key: number]: T
}

/** A dictionary-type which uses strings as keys.
 * @deprecated Record<Y,T> makes this obsolete. */
type StringDictionary<T> = Iterable<T> & {
    [key: string]: T
}

/** An object which maintains a set of key-value pairs.
 * @deprecated Record<Y,T> & Iterable<T> makes this obsolete. */
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

/** A callback-style function which is inteded to loop until it returns true. */
type WorkOrder = () => boolean | undefined;


