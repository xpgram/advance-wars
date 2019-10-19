/**
 * A 3x3 matrix representing the neighboring elements surrounding a central element.
 * @param list A linear list of all 9 matrice elements. NeighborMatrix interprets this list as list[column][row] or list[x][y].
 * 
 * @author Dei Valko
 * @version 0.1.1
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
}