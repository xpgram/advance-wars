import * as PIXI from "pixi.js";
import { NeighborMatrix } from "../NeighborMatrix";
import { TerrainObject, TerrainType } from "./TerrainObject";
import { Terrain } from "./Terrain";
import { Faction } from "./EnumTypes";

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

        // If graphic would be one side, and that side is a river, correct.
        let sides = u + r + d + l;
        if (sides == 1) {
            if (neighbors.up.type == Terrain.River) u = 3;
            if (neighbors.up.type == Terrain.River) r = 3;
            if (neighbors.up.type == Terrain.River) d = 3;
            if (neighbors.up.type == Terrain.River) l = 3;
        }
    
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

    createSeaLayer(neighbors: NeighborMatrix<TerrainObject>,
            options?: {includeCliffs?: boolean, includeShallowWater?: boolean}) {

        let container = new PIXI.Container();
    
        let sea = new PIXI.AnimatedSprite(Terrain.sheet.animations['sea']);
        sea.animationSpeed = 0.1;
        sea.play();
        container.addChild(sea);
    
        // Add shallow waters
        if (options && options.includeShallowWater) {
            if (neighbors.center.shallowWater) {
                // Skip particularity if the tile we're building is always surrounded.
                let variant = "1111";
                if (!neighbors.center.shallowWaterSourceTile)
                    variant = TerrainMethods.seaShallowVariant(neighbors);

                // Only if orientation isn't 'none'
                if (variant != "0000") {
                    let shallow = new PIXI.Sprite(Terrain.sheet.textures[variant]);
                    shallow.blendMode = PIXI.BLEND_MODES.ADD;
                    shallow.alpha = 0.1;
                    container.addChild(shallow);
                }
            }
        }
    
        // Add cliffs
        if (options && options.includeCliffs) {
            let variant = TerrainMethods.seaCliffVariant(neighbors);

            // Only if orientation isn't 'none'
            if (variant != "0000") {
                let cliffs = new PIXI.Sprite(Terrain.sheet.textures[variant]);
                container.addChild(cliffs);
            }
        }

        return container;
    },

    createPlainLayer() {
        let variant = TerrainMethods.randomPlainTile();
        return new PIXI.Sprite(Terrain.sheet.textures[variant]);
    },

    createBuildingLayers(building: string, faction: Faction) {
        let bottom = TerrainMethods.createPlainLayer();
        
        // Building
        let color = Terrain.City.colors[faction];
        let top = new PIXI.AnimatedSprite(Terrain.sheet.animations[`${building}-${color}`]);
        top.anchor.y = 0.5;

        return {bottom: bottom, top: top};
    }
}