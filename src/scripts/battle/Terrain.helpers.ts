import * as PIXI from "pixi.js";
import * as PixiFilters from "pixi-filters";
import { NeighborMatrix } from "../NeighborMatrix";
import { TerrainObject, TerrainType } from "./TerrainObject";
import { Terrain } from "./Terrain";
import { Faction } from "./EnumTypes";
import { Game } from "../..";
import { MapLayers } from "./MapLayers";

export const TerrainMethods = {

    /** Used to animate the shoreline where land meets sea. */
    shorelineFilter: new PixiFilters.MultiColorReplaceFilter([[0, 0], [0, 0], [0, 0], [0, 0]], 0.015),

    /** An array of colors for MultiColorReplace to swap; contributes to
     * animating the shoreline where land meets sea. */
    shorelinePaletteSwaps: [
        // Beach Light Blue     Beach Dark Blue       Cliff ~Dark~ Blue     Cliff Dark Blue
        [[0xC6DEEF, 0xcde6f7], [0x6d9dce, 0x96b5d6], [0x637b9c, 0x5d6f8c], [0x9cb5ce, 0x96b5d6]],
        [[0xC6DEEF, 0xc9e5f7], [0x6d9dce, 0x94b4d6], [0x637b9c, 0x5c6e94], [0x9cb5ce, 0x94b4d6]],
        [[0xC6DEEF, 0xbfe4f7], [0x6d9dce, 0x8aaad6], [0x637b9c, 0x627594], [0x9cb5ce, 0x8aaad6]],
        [[0xC6DEEF, 0xbbd9ef], [0x6d9dce, 0x88abce], [0x637b9c, 0x687d9c], [0x9cb5ce, 0x88abce]],
        [[0xC6DEEF, 0xb0d9ef], [0x6d9dce, 0x80a1ce], [0x637b9c, 0x667c9c], [0x9cb5ce, 0x80a1ce]],
        [[0xC6DEEF, 0xadcfe7], [0x6d9dce, 0x7fa2c6], [0x637b9c, 0x6b82a5], [0x9cb5ce, 0x7fa2c6]],
        [[0xC6DEEF, 0xa3d0e7], [0x6d9dce, 0x7a9bc6], [0x637b9c, 0x698bad], [0x9cb5ce, 0x7a9bc6]],
        [[0xC6DEEF, 0xa0c3e7], [0x6d9dce, 0x7899c6], [0x637b9c, 0x7188ad], [0x9cb5ce, 0x7899c6]],
        [[0xC6DEEF, 0x9dc5de], [0x6d9dce, 0x7090bd], [0x637b9c, 0x7293b5], [0x9cb5ce, 0x7090bd]],
        [[0xC6DEEF, 0x93b9de], [0x6d9dce, 0x7292bd], [0x637b9c, 0x7c91bd], [0x9cb5ce, 0x7292bd]],
        [[0xC6DEEF, 0x95bcd6], [0x6d9dce, 0x6c8bb5], [0x637b9c, 0x7e9ebd], [0x9cb5ce, 0x6c8bb5]],
        [[0xC6DEEF, 0x90b2d6], [0x6d9dce, 0x6e8cb5], [0x637b9c, 0x87a6c6], [0x9cb5ce, 0x6e8cb5]],
        [[0xC6DEEF, 0x93b3d6], [0x6d9dce, 0x698fad], [0x637b9c, 0x8aa8c6], [0x9cb5ce, 0x698fad]],
        [[0xC6DEEF, 0x8dadce], [0x6d9dce, 0x6a87ad], [0x637b9c, 0x93b0ce], [0x9cb5ce, 0x6a87ad]],
        [[0xC6DEEF, 0x90afce], [0x6d9dce, 0x6488ad], [0x637b9c, 0x9eb9d6], [0x9cb5ce, 0x6488ad]],
        [[0xC6DEEF, 0x8ba8c6], [0x6d9dce, 0x6681a5], [0x637b9c, 0xa1bad6], [0x9cb5ce, 0x6681a5]]
        // Beach dark blue and cliff dark blue are the same source color.
        // Or, they would have been if I hadn't messed with 'em during ripping.
    ],

    animTime: 0,
    animFrame: 0,
    animateShoreline: (delta: number) => {
        // Collect time (I don't know what 6 means——six frames?)
        TerrainMethods.animTime += delta;
        if (TerrainMethods.animTime > 6) {
            TerrainMethods.animTime -= 6;
            
            // Choose a new palette-swap color matrix: use a triangle wave pattern to decide.
            let colorMatrix = TerrainMethods.shorelinePaletteSwaps[TerrainMethods.animFrame];
            if (TerrainMethods.animFrame > 15)
                colorMatrix = TerrainMethods.shorelinePaletteSwaps[31 - TerrainMethods.animFrame];

            // Insert the new palette swap in to the color-replacement filter.
            TerrainMethods.shorelineFilter.replacements = colorMatrix;
            
            // Frame-counting maintenance.
            TerrainMethods.animFrame++;
            if (TerrainMethods.animFrame > 31)
                TerrainMethods.animFrame = 0;

        }
    },

    /** Initiates the shoreline animation ticker and adds the color-swap filter to the bottom texture layer. */
    startPaletteAnimation: () => {
        MapLayers['bottom'].filters = [TerrainMethods.shorelineFilter];
        //MapLayers['bottom'].filterArea = camera rect
        Game.app.ticker.add( TerrainMethods.animateShoreline );
    },

    /** Stops the shoreline animation ticker, and removes the color filter. */
    stopPaletteAnimation: () => {
        MapLayers['bottom'].filters = null;
        Game.app.ticker.remove( TerrainMethods.animateShoreline );  // TODO Does this work?
    },

    /** Adds an animated, background sea layer to the overall map image.
     * Should be added first before anything else.
     * @param width In pixels, the horizontal size of the sea background layer.
     * @param height In pixels, the vertical size of the sea background layer.
     */
    addSeaLayer: (width: number, height: number) => {
        let anim = new PIXI.AnimatedSprite(Terrain.sheet.animations['sea']);
        let tsprite = new PIXI.TilingSprite(anim.texture, width, height);
        MapLayers['bottom'].addChild(tsprite);

        anim.onFrameChange = () => {
            tsprite.texture = anim.texture;
        };
        anim.animationSpeed = 0.1;
        anim.play();
    },

    /** Removes the animated, background sea layer from the map image.
     * (Not implemented) */
    removeSeaLayer: () => {
        // This function cannot see anim or tsprite.
        // Plus, I feel there should be a way to get PIXI to clear
        // all of its display/ticker objects without writing my own.
    },

    randomPlainTile(): string {
        // This should grab '6' as the length of a plainTile textures array, but I don't have one set up in the atlas.
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
    
        // Patch fix for bridges: Extend to any land tile that isn't a river or mountain
        // TODO Add an excludeTypes: TerrainType[] parameter.
        if (neighbors.center.type == Terrain.Bridge) {
            u = (neighbors.up.landTile && neighbors.up.type != Terrain.River && neighbors.up.type != Terrain.Mountain)          ? 1 : u;
            r = (neighbors.right.landTile && neighbors.right.type != Terrain.River && neighbors.right.type != Terrain.Mountain) ? 1 : r;
            d = (neighbors.down.landTile && neighbors.down.type != Terrain.River && neighbors.down.type != Terrain.Mountain)    ? 1 : d;
            l = (neighbors.left.landTile && neighbors.left.type != Terrain.River && neighbors.left.type != Terrain.Mountain)    ? 1 : l;
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