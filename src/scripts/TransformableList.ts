import { Transformable } from "./CommonTypes";

/**
 * A solution to the problem of LowResTransform being unable to accept lists.
 * This is an intermediary class, acting as a transform for a list of things, but
 * ultimately to be controlled itself.
 */
export class TransformableList {
    list: Transformable[] = [];

    push(obj: Transformable) {
        this.list.push(obj);
    }

    pop(): Transformable | undefined {
        return this.list.pop();
    }

    destroy() {
        this.list = [];
    }

    get x(): number { return this.list[0].x; }
    set x(num) { this.list.forEach( obj => obj.x = num ); }

    get y(): number { return this.list[0].y; }
    set y(num) { this.list.forEach( obj => obj.y = num ); }

    get zIndex(): number { return this.list[0].zIndex; }
    set zIndex(num) { this.list.forEach( obj => obj.zIndex = num ); }

    get rotation(): number { return this.list[0].rotation; }
    set rotation(num) { this.list.forEach( obj => obj.rotation = num ); }

    get scale() { return ((parent) => { return { 
        get x(): number { return parent.list[0].scale.x; },
        set x(num) { parent.list.forEach( obj => obj.scale.x = num ); },

        get y(): number { return parent.list[0].scale.y; },
        set y(num) { parent.list.forEach( obj => obj.scale.y = num ); }
    }})(this)}

    // TODO TransformableList forces every child to conform to the first child's height and width.
    // This naturally squishes 16x32 sprites like Mountains.
    // PIXI.Container behavior is what I want, but I think those do the relative scaling at render time;
    // any PIXI.Sprite will tell you its natural dimensions even though on-screen it's always upscaled waaay bigger.

    // LowResTransform just wants each sprite to floor its height and width, that's all. It solved this issue by
    // asking each sprite to modify its own. This class, though, can't do that when all it's told is "set height to 16 pixels,"
    // the already floored value passed in by LowRes.

    // Note this as well, although LowRes handled pixel-confinement scaling just fine, if I had tried to set its
    // height or width directly (an option I don't think I left myself), I would have run into this exact same problem.

    // I think, naively, the easiest way to 'fix' this is to just extend PIXI.Container to begin with and strip out
    // anything beyond children and transforms.

    get width(): number { return this.list[0].width; }
    set width(num) { /*this.list.forEach( obj => obj.width = num );*/ }

    get height(): number { return this.list[0].height; }
    set height(num) { /*this.list.forEach( obj => obj.height = num );*/ }
}