import { Transformable } from "./CommonTypes";

/**
 * A solution to the problem of LowResTransform being unable to accept lists.
 * This is an intermediary class, acting as a transform for a list of things, but
 * ultimately meant to be transformed itself.
 */
export class TransformableList {
    list: Transformable[] = [];
    controlZIndex = true;

    push(obj: Transformable) {
        this.list.push(obj);
    }

    pop(): Transformable | undefined {
        return this.list.pop();
    }

    destroy() {
        this.list = [];
    }

    get length(): number {
        return this.list.length;
    }

    // FIXME There are no protections against an empty list.

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
    // Which is naturally a problem of having no frame of reference.
    // PIXI.Container behavior is what I want, and I think those use the calculated height of their entire package.
    // The way I use this class is as if it's always a 16x16 square that I want to enbiggen.
    // Technically, I could solve this issue be scaling width directly and height proportionally.
    // That doesn't feel very mathematical, however.

    get width(): number { return this.list[0].width; }
    set width(num) { /*this.list.forEach( obj => obj.width = num );*/ }

    get height(): number { return this.list[0].height; }
    set height(num) { /*this.list.forEach( obj => obj.height = num );*/ }
}