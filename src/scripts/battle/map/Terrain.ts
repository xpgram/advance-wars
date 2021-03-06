import * as PIXI from "pixi.js";
import { Game } from "../../..";
import { TerrainObject } from "./TerrainObject";
import { UnitClass, Faction } from "../EnumTypes";
import { Common } from "../../CommonUtils";
import { TerrainMethods } from "./Terrain.helpers";
import { NeighborMatrix } from "../../NeighborMatrix";
import { TerrainBuildingObject } from "./TerrainBuildingObject";

/**
 * Auto-generated.
 * A list of all terrain or map-tile classes.
 */
export const Terrain = {
    tileset: 'NormalMapTilesheet',
    landImageset: 'NormalMapLandscapeSheet',
    get sheet(): PIXI.Spritesheet { return Game.app.loader.resources[ Terrain.tileset ].spritesheet; },
    get infoPortraitSheet(): PIXI.Spritesheet { return Game.app.loader.resources[ Terrain.landImageset ].spritesheet; },

    Void: class VoidTile extends TerrainObject {
        // Not for nothin', but these properties are all technically condensible into one 64-bit value.
        get type() { return VoidTile; }
        get serial() { return -1; }
        get landTile() { return false; }
        get shallowWaterSourceTile() { return false; }
        shallowWater = false;

        get name() { return "Void"; }
        get shortName() { return "Void"; }
        get description() { return "Void"; }
        get defenseRating() { return 0; }

        movementCost = {
            infantry: 0,
            mech: 0,
            tireA: 0,
            tireB: 0,
            tread: 0,
            air: 0,
            ship: 0,
            transport: 0
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
        }
    },

    //start
    Plain: class PlainTile extends TerrainObject {
        get type() { return PlainTile; }
        get serial() { return 0; }
        get landscape(): PIXI.Sprite {
            if (this.variation == 1)
                return new PIXI.Sprite( Terrain.infoPortraitSheet.textures['plain-meteor-landscape.png'] );
            else if (this.variation == 2)
                return new PIXI.Sprite( Terrain.infoPortraitSheet.textures['plain-plasma-landscape.png'] );
            else
                return new PIXI.Sprite( Terrain.infoPortraitSheet.textures['plain-landscape.png'] );
        }
        private variation = 0;

        get name() { return "Plain"; }
        get shortName() { return "Plain"; }
        get description() { return "Plains are easily traveled but offer little defense."; }
        get defenseRating() { return 1; }

        movementCost = {
            infantry: 1,
            mech: 1,
            tireA: 2,
            tireB: 1,
            tread: 1,
            air: 1,
            ship: 0,
            transport: 0
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            // Plain
            let sprite = TerrainMethods.createPlainLayer();
            this.layers.push({object: sprite, name: 'bottom'});

            // if neighbors.center == Meteor: assume crater
            // if neighbors.center == Plasma: assume razed grass
            // set this.variation to whichever
        }
    },

    Road: class RoadTile extends TerrainObject {
        get type() { return RoadTile; }
        get serial() { return 1; }

        get name() { return "Road"; }
        get shortName() { return "Road"; }
        get description() { return "Well-surfaced roads provide optimum mobility, but little cover."; }
        get defenseRating() { return 0; }

        movementCost = {
            infantry: 1,
            mech: 1,
            tireA: 1,
            tireB: 1,
            tread: 1,
            air: 1,
            ship: 0,
            transport: 0
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            // Plain
            let sprite = TerrainMethods.createPlainLayer();
            this.layers.push({object: sprite, name: 'bottom'});
        
            // Road
            let variant = TerrainMethods.fourDirectionalVariant(neighbors,  // The rest are tiles we want to connect to.
                Terrain.Road, Terrain.Bridge, Terrain.HQ, Terrain.City, Terrain.Factory, Terrain.Airport,
                Terrain.Port, Terrain.Radar, Terrain.ComTower, Terrain.Silo, Terrain.TempAirpt, Terrain.TempPort);
            sprite = new PIXI.Sprite(Terrain.sheet.textures[`road-${variant}.png`]);
            this.layers.push({object: sprite, name: "bottom"});
        }
    },

    Wood: class WoodTile extends TerrainObject {
        get type() { return WoodTile; }
        get serial() { return 2; }

        get name() { return "Wood"; }
        get shortName() { return "Wood"; }
        get description() { return "Woods provide /hiding places/ for ground units in Fog of War."; }
        get defenseRating() { return 3; }
        get conceals() { return true; }

        movementCost = {
            infantry: 1,
            mech: 1,
            tireA: 3,
            tireB: 3,
            tread: 2,
            air: 1,
            ship: 0,
            transport: 0
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            // Plain
            let sprite = TerrainMethods.createPlainLayer();
            this.layers.push({object: sprite, name: 'bottom'});
        
            // Wood
            let variant = TerrainMethods.lineDirectionalVariant(neighbors, Terrain.Wood);
            sprite = new PIXI.Sprite(Terrain.sheet.textures[`wood-${variant}.png`]);
            this.layers.push({object: sprite, name: 'bottom'});
        }
    },

    Mountain: class MountainTile extends TerrainObject {
        get type() { return MountainTile; }
        get serial() { return 3; }

        get name() { return "Mountain"; }
        get shortName() { return "Mtn"; }
        get description() { return "In Fog of War, these add 3 to the /vision/ of infantry and mech units."; }
        get defenseRating() { return 4; }

        movementCost = {
            infantry: 2,
            mech: 1,
            tireA: 0,
            tireB: 0,
            tread: 0,
            air: 1,
            ship: 0,
            transport: 0
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            // Plain
            let sprite = TerrainMethods.createPlainLayer();
            this.layers.push({object: sprite, name: 'bottom'});
        
            // Mountain
            let variant = TerrainMethods.lineDirectionalVariant(neighbors, Terrain.Mountain);
            sprite = new PIXI.Sprite(Terrain.sheet.textures[`mountain-${variant}.png`]);
            this.layers.push({object: sprite, name: 'top', maskShape: true});

            // Mountain Shadow
            sprite = new PIXI.Sprite(Terrain.sheet.textures[`shadow.png`]);
            sprite.alpha = 0.25;
            this.layers.push({object: sprite, name: 'top'});
        }
    },

    Wasteland: class WastelandTile extends TerrainObject {
        get type() { return WastelandTile; }
        get serial() { return 4; }

        get name() { return "Wasteland"; }
        get shortName() { return "Wstlnd"; }
        get description() { return "This impairs mobility for all but infantry and mech units."; }
        get defenseRating() { return 2; }

        movementCost = {
            infantry: 1,
            mech: 1,
            tireA: 3,
            tireB: 3,
            tread: 2,
            air: 1,
            ship: 0,
            transport: 0
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            // Wasteland
            let variant = TerrainMethods.randomTileVariant(6);
            let sprite = new PIXI.Sprite(Terrain.sheet.textures[`wasteland-${variant}.png`]);
            this.layers.push({object: sprite, name: 'bottom'});
        }
    },

    Ruins: class RuinsTile extends TerrainObject {
        get type() { return RuinsTile; }
        get serial() { return 5; }

        get name() { return "Ruins"; }
        get shortName() { return "Ruins"; }
        get description() { return "Ruins provide /hiding places/ for ground units during Fog of War."; }
        get defenseRating() { return 1; }
        get conceals() { return true; }

        movementCost = {
            infantry: 1,
            mech: 1,
            tireA: 2,
            tireB: 1,
            tread: 1,
            air: 1,
            ship: 0,
            transport: 0
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            // Plain
            let sprite = TerrainMethods.createPlainLayer();
            this.layers.push({object: sprite, name: 'bottom'});

            // Ruins
            let variant = TerrainMethods.randomTileVariant(3);
            sprite = new PIXI.Sprite(Terrain.sheet.textures[`ruins-${variant}.png`]);
            this.layers.push({object: sprite, name: 'bottom'});
        }
    },

    Bridge: class BridgeTile extends TerrainObject {
        get type() { return BridgeTile; }
        get serial() { return 6; }
        readonly landTile: boolean;
        get shallowWaterSourceTile() { return false; }
        shallowWater = false;

        get name() { return "Bridge"; }
        get shortName() { return "Bridge"; }
        get description() { return "Naval units can't pass under river bridges."; }
        get defenseRating() { return 0; }

        movementCost = {
            infantry: 1,
            mech: 1,
            tireA: 1,
            tireB: 1,
            tread: 1,
            air: 1,
            ship: 0,
            transport: 0
        };

        constructor(prevTile?: TerrainObject) {
            super();
            this.landTile = false;
            if (prevTile)
                this.landTile = prevTile.landTile;
            if (!this.landTile) {
                this.movementCost.ship = 1;
                this.movementCost.transport = 1;
            }
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            if (this.landTile) {
                // River
                let variant = TerrainMethods.fourDirectionalVariant(neighbors, Terrain.River, Terrain.Bridge);
                let sprite = new PIXI.Sprite(Terrain.sheet.textures[`river-${variant}.png`]);
                this.layers.push({object: sprite, name: 'bottom'});
            } else {
                // Sea
                let container = TerrainMethods.createSeaLayer(neighbors);
                this.layers.push({object: container, name: 'bottom'});
            }

            // Bridge
            let variant = TerrainMethods.fourDirectionalVariant(neighbors, Terrain.Bridge, Terrain.Port, Terrain.TempPort);
            let sprite = new PIXI.Sprite(Terrain.sheet.textures[`bridge-${variant}.png`]);
            this.layers.push({object: sprite, name: 'bottom'});
        }

        legalPlacement(neighbors: NeighborMatrix<TerrainObject>): boolean {
            return (neighbors.center.type == Terrain.Sea ||
                    neighbors.center.type == Terrain.River ||
                    neighbors.center.type == Terrain.Bridge);
        }
    },

    River: class RiverTile extends TerrainObject {
        get type() { return RiverTile; }
        get serial() { return 7; }

        get name() { return "River"; }
        get shortName() { return "River"; }
        get description() { return "Only foot soldiers can ford rivers."; }
        get defenseRating() { return 0; }

        movementCost = {
            infantry: 2,
            mech: 1,
            tireA: 0,
            tireB: 0,
            tread: 0,
            air: 1,
            ship: 0,
            transport: 0
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            // River TODO They don't connect to each other
            let variant = TerrainMethods.fourDirectionalVariant(neighbors, Terrain.River, Terrain.Bridge);
            let sprite = new PIXI.Sprite(Terrain.sheet.textures[`river-${variant}.png`]);
            this.layers.push({object: sprite, name: 'bottom'});
        }
    },

    Sea: class SeaTile extends TerrainObject {
        get type() { return SeaTile; }
        get serial() { return 8; }
        get landTile() { return false; }
        get shallowWaterSourceTile() { return false; }
        shallowWater = false;

        get name() { return "Sea"; }
        get shortName() { return "Sea"; }
        get description() { return "Naval and air forces have good mobility on calm seas."; }
        get defenseRating() { return 0; }

        movementCost = {
            infantry: 0,
            mech: 0,
            tireA: 0,
            tireB: 0,
            tread: 0,
            air: 1,
            ship: 1,
            transport: 1
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            let container = TerrainMethods.createSeaLayer(neighbors);
            this.layers.push({object: container, name: 'bottom'});
        }
    },

    Beach: class BeachTile extends TerrainObject {
        get type() { return BeachTile; }
        get serial() { return 9; }
        get landTile() { return false; }

        get name() { return "Beach"; }
        get shortName() { return "Beach"; }
        get description() { return "Landers and gunboats can /load and drop/ units here."; }
        get defenseRating() { return 0; }

        movementCost = {
            infantry: 1,
            mech: 1,
            tireA: 2,
            tireB: 2,
            tread: 1,
            air: 1,
            ship: 0,
            transport: 1
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            let container = TerrainMethods.createSeaLayer(neighbors, {includeCliffs: false});
            this.layers.push({object: container, name: 'bottom'});

            let variant = TerrainMethods.beachVariant(neighbors);
            let sprite = new PIXI.Sprite(Terrain.sheet.textures[`beach-${variant}.png`]);
            this.layers.push({object: sprite, name: 'bottom'});
        }

        legalPlacement(neighbors: NeighborMatrix<TerrainObject>) {
            let result = true;
            let n = neighbors;
            
            // No isolated corners
            if (n.upleft.landTile    && !n.up.landTile   && !n.left.landTile  ||
                n.upright.landTile   && !n.up.landTile   && !n.right.landTile ||
                n.downleft.landTile  && !n.down.landTile && !n.left.landTile  ||
                n.downright.landTile && !n.down.landTile && !n.right.landTile)
                result = false;

            // No narrow channels
            if (n.left.landTile && n.right.landTile && !n.up.landTile   && !n.down.landTile ||
                n.up.landTile   && n.down.landTile  && !n.left.landTile && !n.right.landTile)
                result = false;

            // No all-four-sides
            if (n.up.landTile && n.right.landTile && n.down.landTile && n.left.landTile)
                result = false;

            // At least one adjacent side
            if (!n.up.landTile && !n.right.landTile && !n.down.landTile && !n.left.landTile)
                result = false;

            return result;
        }
    },

    RoughSea: class RoughSeaTile extends TerrainObject {
        get type() { return RoughSeaTile; }
        get serial() { return 10; }
        get landscape(): PIXI.Sprite {
            return new PIXI.Sprite( Terrain.infoPortraitSheet.textures['sea-landscape.png'] );
        }
        get landTile() { return false; }
        get shallowWaterSourceTile() { return false; }
        shallowWater = false;

        get name() { return "Rough Sea"; }
        get shortName() { return "Rough"; }
        get description() { return "Slows the movement of naval units, but air units are not affected."; }
        get defenseRating() { return 2; }

        movementCost = {
            infantry: 0,
            mech: 0,
            tireA: 0,
            tireB: 0,
            tread: 0,
            air: 1,
            ship: 2,
            transport: 2
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            // Sea
            let container = TerrainMethods.createSeaLayer(neighbors, {includeCliffs: false});

            // Rough Sea
            let anim = new PIXI.AnimatedSprite(Terrain.sheet.animations['roughsea']);
            anim.animationSpeed = 0.125;
            anim.play();
            container.addChildAt(anim, 0);  // Insert underneath shallow-sea overlay (and cliff if I allow that)

            this.layers.push({object: container, name: 'bottom'});
        }

        legalPlacement(neighbors: NeighborMatrix<TerrainObject>) {
            // No land tiles
            let result = true;
            neighbors.list.forEach(tile => {
                if (tile.landTile) {
                    result = false;
                    return;
                }
            });
            return result;
        }
    },

    Mist: class MistTile extends TerrainObject {
        get type() { return MistTile; }
        get serial() { return 11; }
        get landscape(): PIXI.Sprite {
            return new PIXI.Sprite( Terrain.infoPortraitSheet.textures['sea-landscape.png'] );
        }
        get landTile() { return false; }

        get name() { return "Mist"; }
        get shortName() { return "Mist"; }
        get description() { return "Mist provides ideal /hiding places/ for naval units in Fog of War."; }
        get defenseRating() { return 1; }
        get conceals() { return true; }

        movementCost = {
            infantry: 0,
            mech: 0,
            tireA: 0,
            tireB: 0,
            tread: 0,
            air: 1,
            ship: 1,
            transport: 1
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            // Sea
            let container = TerrainMethods.createSeaLayer(neighbors);
            this.layers.push({object: container, name: 'bottom'});

            // Mist
            let variant = TerrainMethods.lineDirectionalVariant(neighbors, MistTile);
            let sprite = new PIXI.Sprite(Terrain.sheet.textures[`mist-${variant}.png`]);
            sprite.alpha = 0.75;
            this.layers.push({object: sprite, name: 'top', maskShape: true});
        }
    },

    Reef: class ReefTile extends TerrainObject {
        get type() { return ReefTile; }
        get serial() { return 12; }
        get landTile() { return false; }

        get name() { return "Reef"; }
        get shortName() { return "Reef"; }
        get description() { return "Spiky reefs provide ideal /hiding places/ for naval units in Fog of War."; }
        get defenseRating() { return 2; }
        get conceals() { return true; }

        movementCost = {
            infantry: 0,
            mech: 0,
            tireA: 0,
            tireB: 0,
            tread: 0,
            air: 1,
            ship: 2,
            transport: 2
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            // Sea
            let container = TerrainMethods.createSeaLayer(neighbors, {includeCliffs: false});
            this.layers.push({object: container, name: 'bottom'});
            
            // Reef
            let variant = TerrainMethods.randomTileVariant(4);
            let sprite = new PIXI.Sprite(Terrain.sheet.textures[`reef-${variant}.png`]);
            this.layers.push({object: sprite, name: 'bottom'});
        }

        legalPlacement(neighbors: NeighborMatrix<TerrainObject>) {
            // No land tiles
            let result = true;
            neighbors.list.forEach(tile => {
                if (tile.landTile) {
                    result = false;
                    return;
                }
            });
            return result;
        }
    },

    Fire: class FireTile extends TerrainObject {
        get type() { return FireTile; }
        get serial() { return 13; }
        get landscape(): PIXI.AnimatedSprite {
            let anim = new PIXI.AnimatedSprite( Terrain.infoPortraitSheet.animations['default-landscape'] );
            anim.animationSpeed = 6 / 20;
            anim.gotoAndPlay(Math.floor(Math.random()*anim.totalFrames));
            return anim;
        }

        get name() { return "Fire"; }
        get shortName() { return "Fire"; }
        get description() { return "Prevents unit movement and illuminates a /5-square/ area in Fog of War."; }
        get defenseRating() { return 0; }
        get vision() { return 5; }

        movementCost = {
            infantry: 0,
            mech: 0,
            tireA: 0,
            tireB: 0,
            tread: 0,
            air: 0,
            ship: 0,
            transport: 0
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            // Plain - Cragged
            let sprite = new PIXI.Sprite(Terrain.sheet.textures[`plain-crag.png`]);
            this.layers.push({object: sprite, name: 'bottom'});

            // Fire
            let anim = new PIXI.AnimatedSprite(Terrain.sheet.animations[`fire`]);
            anim.animationSpeed = 0.25;
            anim.play();
            this.layers.push({object: anim, name: 'top'});
        }
    },

    Meteor: class MeteorTile extends TerrainObject {
        get type() { return MeteorTile; }
        get serial() { return 14; }
        get landscape(): PIXI.AnimatedSprite {
            let anim = new PIXI.AnimatedSprite( Terrain.infoPortraitSheet.animations['default-landscape'] );
            anim.animationSpeed = 6 / 20;
            anim.gotoAndPlay(Math.floor(Math.random()*anim.totalFrames));
            return anim;
        }
        readonly landTile: boolean;

        get name() { return "Meteor"; }
        get shortName() { return "Meteor"; }
        get description() { return "/Destroy/ meteor chunks to eliminate any nearby plasma."; }
        get defenseRating() { return 0; }

        private _value = 99;
        get value(): number { return this._value; }
        set value(n) { this._value = Common.confine(n, 0, 99); }

        movementCost = {
            infantry: 0,
            mech: 0,
            tireA: 0,
            tireB: 0,
            tread: 0,
            air: 0,
            ship: 0,
            transport: 0
        };

        constructor(prevTile?: TerrainObject) {
            super();
            this.landTile = true;
            if (prevTile)
                this.landTile = prevTile.landTile;
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            if (this.landTile) {
                // Plain
                let sprite = TerrainMethods.createPlainLayer();
                this.layers.push({object: sprite, name: 'bottom'});

                // Not until the meteor is destroyed; looks weird with it.
                // let sprite = new PIXI.Sprite(Terrain.sheet.textures[`plain-7.png`]);
            } else {
                // Sea
                let container = TerrainMethods.createSeaLayer(neighbors);
                this.layers.push({object: container, name: 'bottom'});
            }
            
            // Meteor
            let variant = TerrainMethods.fourDirectionalVariant(neighbors, Terrain.Plasma);
            variant = '0' + variant.slice(1);   // Up is always 'false' graphically
            let anim = new PIXI.AnimatedSprite(Terrain.sheet.animations[`meteor-${variant}`]);
            anim.animationSpeed = 0.2;
            if (variant != "0000")
                anim.play();
            this.layers.push({object: anim, name: 'top', maskShape: true});
        }
    },

    Plasma: class PlasmaTile extends TerrainObject {
        get type() { return PlasmaTile; }
        get serial() { return 15; }
        get landscape(): PIXI.AnimatedSprite {
            let anim = new PIXI.AnimatedSprite( Terrain.infoPortraitSheet.animations['default-landscape'] );
            anim.animationSpeed = 6 / 20;
            anim.gotoAndPlay(Math.floor(Math.random()*anim.totalFrames));
            return anim;
        }
        readonly landTile: boolean;
        get shallowWaterSourceTile() { return false; }
        shallowWater = false;

        get name() { return "Plasma"; }
        get shortName() { return "Plasma"; }
        get description() { return "Plasma is impassable but disappears if /meteor chunks/ are destroyed."; }
        get defenseRating() { return 0; }

        movementCost = {
            infantry: 0,
            mech: 0,
            tireA: 0,
            tireB: 0,
            tread: 0,
            air: 0,
            ship: 0,
            transport: 0
        };

        constructor(prevTile?: TerrainObject) {
            super();
            this.landTile = true;
            if (prevTile)
                this.landTile = prevTile.landTile;
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            if (this.landTile) {
                // Plain
                let sprite = TerrainMethods.createPlainLayer();
                this.layers.push({object: sprite, name: 'bottom'});

                // Not until plasma is destroyed; otherwise, plasma has a brown halo and it looks weird.
                // let variant = TerrainMethods.fourDirectionalVariant(neighbors, Terrain.Plasma);
                // let sprite = new PIXI.Sprite(Terrain.sheet.textures[`plain-${variant}.png`]);
            } else {
                // Sea
                let container = TerrainMethods.createSeaLayer(neighbors);
                this.layers.push({object: container, name: 'bottom'});
            }

            // Plasma
            let variant = TerrainMethods.fourDirectionalVariant(neighbors, Terrain.Plasma, Terrain.Meteor);
            let anim = new PIXI.AnimatedSprite(Terrain.sheet.animations[`plasma-${variant}`]);
            anim.animationSpeed = 0.25;
            anim.play();
            this.layers.push({object: anim, name: 'top'});
        }
    },

    Pipeline: class PipelineTile extends TerrainObject {
        get type() { return PipelineTile; }
        get serial() { return 16; }

        get name() { return "Pipeline"; }
        get shortName() { return "Pipe"; }
        get description() { return "Its armor renders the pipeline indestructible. No units can pass it."; }
        get defenseRating() { return 0; }

        movementCost = {
            infantry: 0,
            mech: 0,
            tireA: 0,
            tireB: 0,
            tread: 0,
            air: 0,
            ship: 0,
            transport: 0
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            // TODO Implement Pipes

            // There is no such thing as a 3-way pipe.
            // Pipes have no-direction "0000", 1 direction "0100" or 2 directions "0110"
            // Pipes will need to save internally which two directions they've chosen.
            // After choosing two directions, pipes will not update their sprite unless the tiles in those directions update.
            // If one does, however, the pipe re-runs its sprite-picking algorithm on its neighbors.
            // If only one does (how would two?), the direction that didn't update should ~not~ change.

            // I could easily do this by saving one 4-bit number (1010) and stipulating that its maximum digit-to-digit add is 2,
            // and further that the algorithm picks directions by adding ones to the number iteratively, so that when one dir updates
            // (a 1 is removed) we only bother to pick one more dir to add instead of picking both at once.

            // One more note: Pipes as they are in classic advance wars do not have a no-connections texture. They just pick the
            // horizontal connection. This looks ugly. When (if) I implement these, draw a no-connections texture.
        }
    },

    PipeSeam: class PipeSeamTile extends TerrainObject {
        get type() { return PipeSeamTile; }
        get serial() { return 17; }

        get name() { return "Pipe Seam"; }
        get shortName() { return "Pipe"; }
        get description() { return "The armor is weaker here than on other sections of the pipe."; }
        get defenseRating() { return 0; }

        private _value = 99;
        get value(): number { return this._value; }
        set value(n) { this._value = Common.confine(n, 0, 99); }

        movementCost = {
            infantry: 0,
            mech: 0,
            tireA: 0,
            tireB: 0,
            tread: 0,
            air: 0,
            ship: 0,
            transport: 0
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            // TODO Implement Pipe Seams
        }

        legalPlacement(neighbors: NeighborMatrix<TerrainObject>) {
            // neighbors.center.type == Terrain.Pipe &&
            // neighbors.center.direction == 0101 || 1010 // a straight line necessarily connected to other pipes.
            return false;
        }
    },

    HQ: class HQTile extends TerrainBuildingObject {
        get type() { return HQTile; }
        get serial() { return 18; }

        get name() { return "HQ"; }
        get shortName() { return "HQ"; }
        get description() { return "Capture the HQ to /end a battle/. Ground units can /resupply/ here too."; }
        get defenseRating() { return 4; }
        get generatesIncome() { return true; }
        get repairType() { return UnitClass.Ground; }
        get conceals() { return true; }
        get vision() { return 2; }

        // Nullify color-whiting when hidden
        set hidden(b: boolean) { }

        movementCost = {
            infantry: 1,
            mech: 1,
            tireA: 1,
            tireB: 1,
            tread: 1,
            air: 1,
            ship: 0,
            transport: 0
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            let layers = TerrainMethods.createBuildingLayers('hq');
            this.buildingSprite = layers.top;

            this.layers.push({object: layers.bottom, name: 'bottom'});
            this.layers.push({object: layers.top, name: 'top', maskShape: true});

            // Temp - Chooses a random color
            this.faction = Math.floor(Math.random()*4) + 2;
        }
    },

    City: class CityTile extends TerrainBuildingObject {
        get type() { return CityTile; }
        get serial() { return 19; }

        get name() { return "City"; }
        get shortName() { return "City"; }
        get description() { return "A populated city. Once captured, ground units can /resupply/ here."; }
        get defenseRating() { return 2; }
        get generatesIncome() { return true; }
        get repairType() { return UnitClass.Ground; }
        get conceals() { return true; }
        get vision() { return 2; }

        movementCost = {
            infantry: 1,
            mech: 1,
            tireA: 1,
            tireB: 1,
            tread: 1,
            air: 1,
            ship: 0,
            transport: 0
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            let layers = TerrainMethods.createBuildingLayers('city');
            this.buildingSprite = layers.top;

            this.layers.push({object: layers.bottom, name: 'bottom'});
            this.layers.push({object: layers.top, name: 'top', maskShape: true});

            // Temp - Chooses a random color
            this.faction = Math.floor(Math.random()*5) + 1;
        }
    },

    ComTower: class ComTowerTile extends TerrainBuildingObject {
        get type() { return ComTowerTile; }
        get serial() { return 20; }

        get name() { return "Com Tower"; }
        get shortName() { return "Com T"; }
        get description() { return "Once captured, this boosts your /attack and defense/."; }
        get defenseRating() { return 3; }
        get generatesIncome() { return true; }
        get conceals() { return true; }
        get vision() { return 2; }

        movementCost = {
            infantry: 1,
            mech: 1,
            tireA: 1,
            tireB: 1,
            tread: 1,
            air: 1,
            ship: 0,
            transport: 0
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            let layers = TerrainMethods.createBuildingLayers('comtower');
            this.buildingSprite = layers.top;

            this.layers.push({object: layers.bottom, name: 'bottom'});
            this.layers.push({object: layers.top, name: 'top', maskShape: true});

            // Temp - Chooses a random color
            this.faction = Math.floor(Math.random()*5) + 1;
        }
    },

    Radar: class RadarTile extends TerrainBuildingObject {
        get type() { return RadarTile; }
        get serial() { return 21; }

        get name() { return "Radar"; }
        get shortName() { return "Radar"; }
        get description() { return "This reveals a /5-square/ area during Fog of War conditions."; }
        get defenseRating() { return 3; }
        get generatesIncome() { return true; }
        get conceals() { return true; }
        get vision() { return 5; }

        movementCost = {
            infantry: 1,
            mech: 1,
            tireA: 1,
            tireB: 1,
            tread: 1,
            air: 1,
            ship: 0,
            transport: 0
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            let layers = TerrainMethods.createBuildingLayers('radar');
            this.buildingSprite = layers.top;

            this.layers.push({object: layers.bottom, name: 'bottom'});
            this.layers.push({object: layers.top, name: 'top', maskShape: true});

            // Temp - Chooses a random color
            this.faction = Math.floor(Math.random()*5) + 1;
        }
    },

    Silo: class SiloTile extends TerrainObject {
        get type() { return SiloTile; }
        get serial() { return 22; }
        get landscape(): PIXI.Sprite {
            if (this.value == 1)
                return new PIXI.Sprite( Terrain.infoPortraitSheet.textures['silo-unused-landscape.png'] );
            else
                return new PIXI.Sprite( Terrain.infoPortraitSheet.textures['silo-used-landscape.png'] );
        }

        get name() { return "Silo"; }
        get shortName() { return "Silo"; }
        get description() { return "Foot soldiers can launch this. It damages a /13-square/ area."; }
        get defenseRating() { return 2; }
        get conceals() { return true; }

        private _value = 1;
        get value(): number { return this._value; }
        set value(n) { this._value = Common.confine(n, 0, 1); }

        movementCost = {
            infantry: 1,
            mech: 1,
            tireA: 1,
            tireB: 1,
            tread: 1,
            air: 1,
            ship: 0,
            transport: 0
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            // Plain
            let sprite = TerrainMethods.createPlainLayer();
            this.layers.push({object: sprite, name: 'bottom'});

            // Silo
            let which = (this.value == 1) ? 1 : 2;  // Unused : Used
            sprite = new PIXI.Sprite(Terrain.sheet.textures[`silo-${which}.png`]);
            this.layers.push({object: sprite, name: 'top', maskShape: true});
        }
    },

    Factory: class FactoryTile extends TerrainBuildingObject {
        get type() { return FactoryTile; }
        get serial() { return 23; }

        get name() { return "Factory"; }
        get shortName() { return "Fctry"; }
        get description() { return "Once captured, this can be used to /produce and resupply/ ground units."; }
        get defenseRating() { return 3; }
        get generatesIncome() { return true; }
        get repairType() { return UnitClass.Ground; }
        get conceals() { return true; }
        get vision() { return 2; }

        movementCost = {
            infantry: 1,
            mech: 1,
            tireA: 1,
            tireB: 1,
            tread: 1,
            air: 1,
            ship: 0,
            transport: 0
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            let layers = TerrainMethods.createBuildingLayers('factory');
            this.buildingSprite = layers.top;

            this.layers.push({object: layers.bottom, name: 'bottom'});
            this.layers.push({object: layers.top, name: 'top', maskShape: true});

            // Temp - Chooses a random color
            this.faction = Math.floor(Math.random()*5) + 1;
        }
    },

    Airport: class AirportTile extends TerrainBuildingObject {
        get type() { return AirportTile; }
        get serial() { return 24; }

        get name() { return "Airport"; }
        get shortName() { return "Airport"; }
        get description() { return "Once captured, this can be used to /produce and resupply/ air units."; }
        get defenseRating() { return 3; }
        get generatesIncome() { return true; }
        get repairType() { return UnitClass.Air; }
        get conceals() { return true; }
        get vision() { return 2; }

        movementCost = {
            infantry: 1,
            mech: 1,
            tireA: 1,
            tireB: 1,
            tread: 1,
            air: 1,
            ship: 0,
            transport: 0
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            let layers = TerrainMethods.createBuildingLayers('airport');
            this.buildingSprite = layers.top;

            this.layers.push({object: layers.bottom, name: 'bottom'});
            this.layers.push({object: layers.top, name: 'top', maskShape: true});

            // Temp - Chooses a random color
            this.faction = Math.floor(Math.random()*5) + 1;
        }
    },

    Port: class PortTile extends TerrainBuildingObject {
        get type() { return PortTile; }
        get serial() { return 25; }
        get landTile() { return false; }

        get name() { return "Port"; }
        get shortName() { return "Port"; }
        get description() { return "Once captured, this can be used to /produce and resupply/ naval units."; }
        get defenseRating() { return 3; }
        get generatesIncome() { return true; }
        get repairType() { return UnitClass.Naval; }
        get conceals() { return true; }
        get vision() { return 2; }

        movementCost = {
            infantry: 1,
            mech: 1,
            tireA: 1,
            tireB: 1,
            tread: 1,
            air: 1,
            ship: 1,
            transport: 1
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            let layers = TerrainMethods.createBuildingLayers('port');
            layers.bottom = TerrainMethods.createSeaLayer(neighbors);
            this.buildingSprite = layers.top;

            this.layers.push({object: layers.bottom, name: 'bottom'});
            this.layers.push({object: layers.top, name: 'top', maskShape: true});

            // Temp - Chooses a random color
            this.faction = Math.floor(Math.random()*5) + 1;
        }
    },

    TempAirpt: class TempAirptTile extends TerrainBuildingObject {
        get type() { return TempAirptTile; }
        get serial() { return 26; }

        get name() { return "Temp Airpt"; }
        get shortName() { return "T Air"; }
        get description() { return "A temporary airport that can /resupply/ and /repair/ air units."; }
        get defenseRating() { return 1; }
        get repairType() { return UnitClass.Air; }
        get conceals() { return true; }
        get vision() { return 2; }

        movementCost = {
            infantry: 1,
            mech: 1,
            tireA: 1,
            tireB: 1,
            tread: 1,
            air: 1,
            ship: 0,
            transport: 0
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            let layers = TerrainMethods.createBuildingLayers('tempairpt');
            this.buildingSprite = layers.top;

            this.layers.push({object: layers.bottom, name: 'bottom'});
            this.layers.push({object: layers.top, name: 'top', maskShape: true});

            // Temp - Chooses a random color
            this.faction = Math.floor(Math.random()*5) + 1;
        }
    },

    TempPort: class TempPortTile extends TerrainBuildingObject {
        get type() { return TempPortTile; }
        get serial() { return 27; }
        get landTile() { return false; }

        get name() { return "Temp Port"; }
        get shortName() { return "T Port"; }
        get description() { return "A temporary port that can /resupply//repair/ naval units."; }
        get defenseRating() { return 1; }
        get repairType() { return UnitClass.Naval; }
        get conceals() { return true; }
        get vision() { return 2; }

        movementCost = {
            infantry: 1,
            mech: 1,
            tireA: 1,
            tireB: 1,
            tread: 1,
            air: 1,
            ship: 1,
            transport: 1
        };

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            let layers = TerrainMethods.createBuildingLayers('tempport');
            layers.bottom = TerrainMethods.createSeaLayer(neighbors);
            this.buildingSprite = layers.top;

            this.layers.push({object: layers.bottom, name: 'bottom'});
            this.layers.push({object: layers.top, name: 'top', maskShape: true});

            // TODO Remove: Chooses a random color
            this.faction = Math.floor(Math.random()*5) + 1;
        }
    },
    //end
}