import * as PIXI from "pixi.js";
import { NeighborMatrix } from "../NeighborMatrix";
import { TerrainObject, TerrainType } from "./TerrainObject";
import { Terrain } from "./Terrain";
import { Faction } from "./EnumTypes";

export const TerrainMethods = {
    randomPlainTile(): string {
        let n = (Math.random() < 0.3) ? (Math.floor(Math.random()*6) + 1) : 0;
        return `${n}`;
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
            if (neighbors.up.type == Terrain.River)     u = 3;
            if (neighbors.right.type == Terrain.River)  r = 3;
            if (neighbors.down.type == Terrain.River)   d = 3;
            if (neighbors.left.type == Terrain.River)   l = 3;
        }
    
        return `${u}${r}${d}${l}`;
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
        // These variants are about giving you 'full' corners
        ur = (n.up && n.upright && n.right)     ? 1 : 0;
        dr = (n.down && n.downright && n.right) ? 1 : 0;
        dl = (n.down && n.downleft && n.left)   ? 1 : 0;
        ul = (n.up && n.upleft && n.left)       ? 1 : 0;
    
        return `${ur}${dr}${dl}${ul}`;
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
    
        return `${u}${r}${d}${l}`;
    },

    fourDirectionalVariant(neighbors: NeighborMatrix<TerrainObject>, ...types: TerrainType[]) {
        
        // 0 = none, 1 = same type, 2 = alt type
        // l=2 u=1 u=2
        // l=1 src r=1
        let u = 0, r = 0, d = 0, l = 0;

        // For every type given, set a 1 if that type is directly adjacent.
        types.forEach(type => {
            u = (neighbors.up.type == type)    ? 1 : u;
            r = (neighbors.right.type == type) ? 1 : r;
            d = (neighbors.down.type == type)  ? 1 : d;
            l = (neighbors.left.type == type)  ? 1 : l;    
        });
    
        // Patch fix for bridges: Extend to any land tile that isn't a river
        if (neighbors.center.type == Terrain.Bridge) {
            u = (neighbors.up.landTile && neighbors.up.type != Terrain.River)       ? 1 : u;
            r = (neighbors.right.landTile && neighbors.right.type != Terrain.River) ? 1 : r;
            d = (neighbors.down.landTile && neighbors.down.type != Terrain.River)   ? 1 : d;
            l = (neighbors.left.landTile && neighbors.left.type != Terrain.River)   ? 1 : l;
        }

        // Patch fix for rivers: Extend to any tile that is by nature a sea tile (except f**ing beaches)
        if (neighbors.center.type == Terrain.River) {
            u = (!neighbors.up.landTile && neighbors.up.type != Terrain.Beach)       ? 1 : u;
            r = (!neighbors.right.landTile && neighbors.right.type != Terrain.Beach) ? 1 : r;
            d = (!neighbors.down.landTile && neighbors.down.type != Terrain.Beach)   ? 1 : d;
            l = (!neighbors.left.landTile && neighbors.left.type != Terrain.Beach)   ? 1 : l;
        }

        // Never extend to a void tile on purpose
        u = (neighbors.up.type == Terrain.Void) ? 0 : u;
        r = (neighbors.right.type == Terrain.Void) ? 0 : r;
        d = (neighbors.down.type == Terrain.Void) ? 0 : d;
        l = (neighbors.left.type == Terrain.Void) ? 0 : l;
    
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

        // Default options properties
        if (!options) options = {};
        if (options.includeCliffs == undefined) options.includeCliffs = true;
        if (options.includeShallowWater == undefined) options.includeShallowWater = true;

        let container = new PIXI.Container();
    
        let sea = new PIXI.AnimatedSprite(Terrain.sheet.animations['sea']);
        sea.animationSpeed = 0.10;
        sea.play();
        container.addChild(sea);
    
        // Add shallow waters
        if (options.includeShallowWater) {
            if (neighbors.center.shallowWater || neighbors.center.shallowWaterSourceTile) {
                // Skip particularity if the tile we're building is always surrounded.
                let variant = "1111";
                if (!neighbors.center.shallowWaterSourceTile)
                    variant = TerrainMethods.seaShallowVariant(neighbors);

                // Only if orientation isn't 'none'
                if (variant != "0000") {
                    let shallow = new PIXI.Sprite(Terrain.sheet.textures[`sea-shallow-${variant}.png`]);
                    shallow.blendMode = PIXI.BLEND_MODES.ADD;
                    shallow.alpha = 0.1;
                    container.addChild(shallow);
                }
            }
        }
    
        // Add cliffs
        if (!options || options.includeCliffs) {
            let variant = TerrainMethods.seaCliffVariant(neighbors);

            // Only if orientation isn't 'none'
            if (variant != "0000") {
                let cliffs = new PIXI.Sprite(Terrain.sheet.textures[`sea-cliff-${variant}.png`]);
                container.addChild(cliffs);
            }
        }

        return container;
    },

    createPlainLayer() {
        let variant = TerrainMethods.randomPlainTile();
        return new PIXI.Sprite(Terrain.sheet.textures[`plain-${variant}.png`]);
    },

    createBuildingLayers(building: string, faction: Faction) {
        let bottom: PIXI.Container = TerrainMethods.createPlainLayer();
        
        // TODO Remove this
        faction = Math.floor(Math.random()*3) + 1;
        faction = (Math.random() < 0.4) ? 1 : faction;

        // Building
        let color = Terrain.City.colors[faction];
        let top = new PIXI.AnimatedSprite(Terrain.sheet.animations[`${building}-${color}`]);
        top.anchor.y = 0.5;

        return {bottom: bottom, top: top};
    }
}