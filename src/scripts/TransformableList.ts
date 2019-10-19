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

    get width(): number { return this.list[0].width; }
    set width(num) { this.list.forEach( obj => obj.width = num ); }

    get height(): number { return this.list[0].height; }
    set height(num) { this.list.forEach( obj => obj.height = num ); }
}