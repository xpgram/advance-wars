import { Class } from "./CommonTypes";
import { Debug } from "./DebugUtils";

/**
 * A 3x3 matrix representing the neighboring elements surrounding a central element.
 * @param list A linear list of all 9 matrice elements. NeighborMatrix interprets this list as list[column][row] or list[x][y].
 * 
 * @author Dei Valko
 * @version 0.1.2
 */
export class NeighborMatrix<T> {
    /** An iterable list of all neighboring elements, excluding the center element. */
    private readonly grid: T[];

    constructor(list: T[]) {
        if (list.length != 9)
            Debug.error(`Expected a list of 9 elements, recieved ${list.length}`);

        this.grid = list;
    }

    get upleft() { return this.grid[0]; }
    get left() { return this.grid[1]; }
    get downleft() { return this.grid[2]; }
    get up() { return this.grid[3]; }
    get center() { return this.grid[4]; }
    get down() { return this.grid[5]; }
    get upright() { return this.grid[6]; }
    get right() { return this.grid[7]; }
    get downright() { return this.grid[8]; }

    /** A value-copy of the 3x3 matrix in list form. */
    get list() { return this.grid.slice(0,9); }
    /** All 8 surrounding objects of type T returned as an array. */
    get surrounding() { return this.grid.slice(0,4).concat( this.grid.slice(5,9) ); }
    /** The four orthogonal direction-objects of type T returned as an array. */
    get orthogonals() { return [this.up, this.right, this.down, this.left]; }
    /** The four diagonal direction-objects of type T returned as an array. */
    get diagonals() { return [this.upright, this.downright, this.downleft, this.upleft]; }

    countInstances<Y>(type: Class<Y>, list: T[]): number {
        let count = 0;
        list.forEach(obj => {
            if (obj instanceof type)
                count += 1;
        });
        return count;
    }
}