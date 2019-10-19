import { NeighborMatrix } from "../NeighborMatrix";
import { TerrainObject, TerrainType } from "./TerrainObject";
import { Terrain } from "./Terrain";

export const TerrainMethods = {
    randomPlainTile(): string {
        let n = (Math.random() < 0.3) ? (Math.floor(Math.random()*6) + 1) : 0;
        return `plain-${n}.png`;
    },

    randomTileVariant(max: number) {
        let n = Math.floor(Math.random()*max);
        return `${n}`;
    },

    seaCliffVariant(neighbors: NeighborMatrix<TerrainObject>) {
        // 0 = none, 1 = land border, 2 = border corner
        //  l=2 u=1 u=2
        //  l=1 src r=1
        let u, r, d, l;
    
        // If side is adjacent to land, set side.
        u = (neighbors.up.landTile) ? 1 : 0;
        r = (neighbors.right.landTile) ? 1 : 0;
        d = (neighbors.down.landTile) ? 1 : 0;
        l = (neighbors.left.landTile) ? 1 : 0;
    
        // Set corner if counter-clockwise is empty, and clockwise isn't adjacent to land.
        u = (neighbors.upright.landTile && u == 0 && r != 1)   ? 2 : u;
        r = (neighbors.downright.landTile && r == 0 && d != 1) ? 2 : r;
        d = (neighbors.downleft.landTile && d == 0 && l != 1)  ? 2 : d;
        l = (neighbors.upleft.landTile && l == 0 && u != 1)    ? 2 : l;
    
        return `sea-cliff-${u}${r}${d}${l}.png`;
    },

    seaShallowVariant(neighbors: NeighborMatrix<TerrainObject>) {
        let n = {
            up:        neighbors.up.shallowWater || neighbors.up.landTile,
            upleft:    neighbors.upleft.shallowWater || neighbors.upleft.landTile,
            upright:   neighbors.upright.shallowWater || neighbors.upright.landTile,
            down:      neighbors.down.shallowWater || neighbors.down.landTile,
            downleft:  neighbors.downleft.shallowWater || neighbors.downleft.landTile,
            downright: neighbors.downright.shallowWater || neighbors.downright.landTile,
            left:      neighbors.left.shallowWater || neighbors.left.landTile,
            right:     neighbors.right.shallowWater || neighbors.right.landTile
        }
    
        // 0 = deep, 1 = shallow
        // ul=1 --- ur=1
        // ---  src ---
        let ur, dr, dl, ul;
    
        // If the corner and two adjacent sides are shallow, the corner is 'full'
        ur = (n.up && n.upright && n.right)     ? 1 : 0;
        dr = (n.down && n.downright && n.right) ? 1 : 0;
        dl = (n.down && n.downleft && n.left)   ? 1 : 0;
        ul = (n.up && n.upleft && n.left)       ? 1 : 0;
    
        return `sea-shallow-${ur}${dr}${dl}${ul}.png`;
    },

    beachVariant(neighbors: NeighborMatrix<TerrainObject>) {
        let u, r, d, l;
    
        u = (neighbors.up.landTile) ? 1 : 0;
        r = (neighbors.right.landTile) ? 1 : 0;
        d = (neighbors.down.landTile) ? 1 : 0;
        l = (neighbors.left.landTile) ? 1 : 0;
        
        u = (neighbors.up.type == Terrain.Beach) ? 2 : u;
        r = (neighbors.right.type == Terrain.Beach) ? 2 : r;
        d = (neighbors.down.type == Terrain.Beach) ? 2 : d;
        l = (neighbors.left.type == Terrain.Beach) ? 2 : l;
    
        return `beach-${u}${r}${d}${l}.png`;
    },

    fourDirectionalVariant(neighbors: NeighborMatrix<TerrainObject>,
        type1: TerrainType, type2?: TerrainType) {
        
        // 0 = none, 1 = same type, 2 = alt type
        // l=2 u=1 u=2
        // l=1 src r=1
        let u = 0, r = 0, d = 0, l = 0;
    
        // If side is adjacent to type1, set 1
        u = (neighbors.up.type == type1)    ? 1 : 0;
        r = (neighbors.right.type == type1) ? 1 : 0;
        d = (neighbors.down.type == type1)  ? 1 : 0;
        l = (neighbors.left.type == type1)  ? 1 : 0;
    
        // If side is adjacent to type2, set 1  (entirely because rivers/sea)
        if (type2) {
            u = (neighbors.up.type == type2)    ? 1 : 0;
            r = (neighbors.right.type == type2) ? 1 : 0;
            d = (neighbors.down.type == type2)  ? 1 : 0;
            l = (neighbors.left.type == type2)  ? 1 : 0;
        }
    
        // Patch fix for bridges
        if (type1 == Terrain.Bridge) {
            u = (neighbors.up.landTile)    ? 1 : u;
            r = (neighbors.right.landTile) ? 1 : r;
            d = (neighbors.down.landTile)  ? 1 : d;
            l = (neighbors.left.landTile)  ? 1 : l;
        }
    
        return `${u}${r}${d}${l}`;
    },

    lineDirectionalVariant(neighbors: NeighborMatrix<TerrainObject>, type: TerrainType) {
        // 0 = none, 1 = same type
        // l=1 src r=1
        let l, r;
    
        // If adjacent to the same tile type, set 1
        l = (neighbors.left.type == type)  ? 1 : 0;
        r = (neighbors.right.type == type) ? 1 : 0;
    
        return `${l}${r}`;
    },

    populateSeaLayer(container: PIXI.Container, neighbors: NeighborMatrix<TerrainObject>) {
        // We do this instead of creating a new one I think because I can't overwrite
        // a TerrainObject's container or something.
        // I've done some heavy lifting regarding its implementation, I should confirm.

        // Also, how does beach know to use a shallow-1111 and to skip the cliff?
        // I remember the cliff, actually, but the point is cut that shit out.
        // Configure this method not to include them to begin with why not.
        container.removeChildren();
    
        let v;
        let sea = new PIXI.AnimatedSprite(Terrain.tilesheet().animations['sea']);
        container.addChild(sea);
        sea.animationSpeed = 0.1;
        sea.play();
    
        // Add shallow waters
        let shallow = new PIXI.Sprite();
        container.addChild(shallow);
        shallow.blendMode = PIXI.BLEND_MODES.ADD;
        shallow.alpha = 0.1;
        if (neighbors.center.shallowWater) {
            v = TerrainMethods.seaShallowVariant(neighbors);
            if (v != "0000")
                shallow.texture = PIXI.Texture.from(`sea-shallow-${v}.png`);
        }
    
        let cliff = new PIXI.Sprite();
        container.addChild(cliff);
        v = TerrainMethods.seaCliffVariant(neighbors);
        if (v != "0000")
            cliff.texture = PIXI.Texture.from(`sea-cliff-${v}.png`);
    }
}