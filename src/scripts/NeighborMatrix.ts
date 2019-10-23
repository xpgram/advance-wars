import { Class } from "./CommonTypes";

/**
 * A 3x3 matrix representing the neighboring elements surrounding a central element.
 * @param list A linear list of all 9 matrice elements. NeighborMatrix interprets this list as list[column][row] or list[x][y].
 * 
 * @author Dei Valko
 * @version 0.1.2
 */
export class NeighborMatrix<T> {
    /** An iterable list of all neighboring elements, excluding the center element. */
    readonly list: T[];
    /** The center element of the 3x3 matrix, or the source element of the neighoring list. */
    readonly center: T;

    constructor(list: T[]) {
        if (list.length != 9)
            throw new Error(`Expected a list of 9 elements, recieved ${list.length}`);
        this.center = list[4];
        list.splice(4,1);       // Remove index 4
        this.list = list;
    }

    get upleft() { return this.list[0]; }
    get left() { return this.list[1]; }
    get downleft() { return this.list[2]; }
    get up() { return this.list[3]; }
    get down() { return this.list[4]; }
    get upright() { return this.list[5]; }
    get right() { return this.list[6]; }
    get downright() { return this.list[7]; }

    get orthogonals() { return [this.up, this.right, this.down, this.left]; }
    get diagonals() { return [this.upright, this.downright, this.downleft, this.upleft]; }

    countInstances<Y>(type: Class<Y>, list: T[]): number {
        let count = 0;
        list.forEach(obj => {
            if (obj instanceof type)
                count += 1;
        });
        return count;
    }

    countPropertyValues(property: string, value: any, list: T[]): number {
        let count = 0;

        // TODO Implement countPropertyValues()?
        // The idea was to let me write:
        //    countPropertyValues('landTile', true, neighbors.orthogonals);
        // and have it return how many neighboring tiles ~were~ land tiles.
        // I'm just not sure how to do that, though.
        // NeighborMatrix is a generic class and I'm trying to keep it that way.

        list.forEach(obj => {
            if (typeof obj === 'object')
                if (obj === value) {}
        });
        return 0;
    }
}