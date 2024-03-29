import { PIXI } from "../../../constants";
import { Game } from "../../..";
import { TerrainObject, TerrainType } from "./TerrainObject";
import { FactionColors, UnitClass } from "../EnumTypes";
import { Common } from "../../CommonUtils";
import { TerrainMethods } from "./Terrain.helpers";
import { NeighborMatrix } from "../../NeighborMatrix";
import { TerrainBuildingObject } from "./TerrainBuildingObject";
import { SerialGenerator } from "../../Common/SerialGenerator";
import { UnitObject } from "../UnitObject";
import { Point } from "../../Common/Point";
import { Debug } from "../../DebugUtils";

const Serial = SerialGenerator(-1);

/**
 * Global terrain properties container.
 */
export const TerrainProperties = {
    tileset: 'NormalMapTilesheet',
    landImageset: 'NormalMapLandscapeSheet',
    get sheet(): PIXI.Spritesheet { return Game.scene.getSpritesheet(TerrainProperties.tileset); },
    get infoPortraitSheet(): PIXI.Spritesheet { return Game.scene.getSpritesheet(TerrainProperties.landImageset); },
}

/**
 * A list of all terrain or map-tile classes.
 */
export module Terrain {

    export class Void extends TerrainObject {
        get type() { return Void; }
        static readonly serial = Serial.next().value;
        get landTile() { return false; }
        get shallowWaterSourceTile() { return false; }
        get shallowWater() { return this._shallowWater; }
        set shallowWater(b: boolean) { this._shallowWater = b; }
        private _shallowWater = false;

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

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
        }
    }

    //start
    export class Plain extends TerrainObject {
        get type() { return Plain; }
        static readonly serial = Serial.next().value;
        get illustration(): PIXI.Sprite {

            const serialMap = <Record<number, string | undefined>>{
                [Meteor.serial]: 'plain-meteor-landscape.png',
                [Plasma.serial]: 'plain-plasma-landscape.png',
            };

            const texName = serialMap[this.prevTileType?.serial ?? 0];
            const { textures } = TerrainProperties.infoPortraitSheet;
            return new PIXI.Sprite( textures[texName ?? 'plain-landscape.png'] );
        }

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

        get prevTileType() { return this._prevTileType; }
        private _prevTileType?: TerrainType;

        constructor(prevTile?: TerrainObject, noPrevTileCosmetics?: boolean) {
            super();

            if (noPrevTileCosmetics)
                return;

            this._prevTileType = prevTile?.type;

            if (this.prevTileType === Plain)
                this._prevTileType = (prevTile as Plain).prevTileType;
        }

        exportDataBlob() {
            const matchTypes = [Plasma, Meteor] as TerrainType[];
            const t = this.prevTileType;

            if (!t || !matchTypes.includes(t))
                return;

            return {prevTileSerial: t.serial};
        }

        importDataBlob(data: {prevTileSerial: number}) {
            const t = Object.values(Terrain).find( t => t.serial === data.prevTileSerial );

            if (!t) {
                Debug.log('PlainTile', 'ImportData', {
                    message: `Skipping data import.`,
                    reason: `Serial '${data.prevTileSerial}' could not be reduced to a terrain type.`,
                    warn: true,
                })
                return;
            }
            this._prevTileType = t;
        }

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            // Plain
            let sprite = TerrainMethods.createPlainLayer(loc, neighbors, this.prevTileType);
            this.layers.push({object: sprite, key: ['bottom', 'static']});
        }
    }

    export class Road extends TerrainObject {
        get type() { return Road; }
        static readonly serial = Serial.next().value;

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

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            // Plain
            let sprite = TerrainMethods.createPlainLayer(loc, neighbors);
            this.layers.push({object: sprite, key: ['bottom', 'static']});
        
            // Road
            let variant = TerrainMethods.fourDirectionalVariant(neighbors,  // The rest are tiles we want to connect to.
                Road, Bridge, HQ, City, Factory, Airport, Port, Radar, ComTower, Silo, TempAirpt, TempPort);
            sprite = new PIXI.Sprite(TerrainProperties.sheet.textures[`road-${variant}.png`]);
            this.layers.push({object: sprite, key: ['bottom', 'static']});
        }
    }

    export class Wood extends TerrainObject {
        get type() { return Wood; }
        static readonly serial = Serial.next().value;

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

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            // Plain
            let sprite = TerrainMethods.createPlainLayer(loc, neighbors);
            this.layers.push({object: sprite, key: ['bottom', 'static']});
        
            // Wood
            let variant = TerrainMethods.lineDirectionalVariant(neighbors, Wood);
            sprite = new PIXI.Sprite(TerrainProperties.sheet.textures[`wood-${variant}.png`]);
            this.layers.push({object: sprite, key: ['bottom', 'static']});
        }
    }

    export class Mountain extends TerrainObject {
        get type() { return Mountain; }
        static readonly serial = Serial.next().value;

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

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            // Plain
            let sprite = TerrainMethods.createPlainLayer(loc, neighbors);
            this.layers.push({object: sprite, key: ['bottom', 'static']});
        
            // Mountain
            this._shapeSerial = TerrainMethods.lineDirectionalVariant(neighbors, Mountain);
            sprite = new PIXI.Sprite(TerrainProperties.sheet.textures[`mountain-${this._shapeSerial}.png`]);
            this.layers.push({object: sprite, key: ['top', 'row', 'static'], maskShape: true});

            // Mountain Shadow
            sprite = new PIXI.Sprite(TerrainProperties.sheet.textures[`shadow.png`]);
            sprite.alpha = 0.25;
            this.layers.push({object: sprite, key: ['top', 'row', 'static']});
        }
    }

    export class Wasteland extends TerrainObject {
        get type() { return Wasteland; }
        static readonly serial = Serial.next().value;

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

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            // Wasteland
            let variant = TerrainMethods.randomTileVariant(loc, 6);
            let sprite = new PIXI.Sprite(TerrainProperties.sheet.textures[`wasteland-${variant}.png`]);
            this.layers.push({object: sprite, key: ['bottom', 'static']});
        }
    }

    export class Ruins extends TerrainObject {
        get type() { return Ruins; }
        static readonly serial = Serial.next().value;

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

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            // Plain
            let sprite = TerrainMethods.createPlainLayer(loc, neighbors);
            this.layers.push({object: sprite, key: ['bottom', 'static']});

            // Ruins
            let variant = TerrainMethods.randomTileVariant(loc, 3);
            sprite = new PIXI.Sprite(TerrainProperties.sheet.textures[`ruins-${variant}.png`]);
            this.layers.push({object: sprite, key: ['bottom', 'static']});
        }
    }

    export class Bridge extends TerrainObject {
        get type() { return Bridge; }
        static readonly serial = Serial.next().value;
        get landTile() { return this._landTile; };
        private _landTile = false;
        get shallowWaterSourceTile() { return false; }
        get shallowWater() { return this._shallowWater; }
        set shallowWater(b: boolean) { this._shallowWater = b; }
        private _shallowWater = false;

        get name() { return "Bridge"; }
        get shortName() { return "Bridge"; }
        get minimapIconName() { return "road"; }
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
            if (prevTile)
                this._landTile = prevTile.landTile;
            this.setLandTile(this._landTile);
        }

        exportDataBlob() {
            return {landTile: this.landTile};
        }

        importDataBlob(data: {landTile: boolean}) {
            this.setLandTile(data.landTile);
        }

        private setLandTile(b: boolean) {
            this._landTile = b;
            this.movementCost.ship = b ? 0 : 1;
            this.movementCost.transport = b ? 0 : 1;
        }

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            if (this.landTile) {
                // River
                let variant = TerrainMethods.fourDirectionalVariant(neighbors, River, Bridge);
                let sprite = new PIXI.Sprite(TerrainProperties.sheet.textures[`river-${variant}.png`]);
                this.layers.push({object: sprite, key: ['bottom', 'static']});
            } else {
                // Sea
                let container = TerrainMethods.createSeaLayer(neighbors);
                this.layers.push({object: container, key: ['bottom', 'static']});
            }

            // Bridge
            let variant = TerrainMethods.fourDirectionalVariant(neighbors, Bridge, Port, TempPort);
            let sprite = new PIXI.Sprite(TerrainProperties.sheet.textures[`bridge-${variant}.png`]);
            this.layers.push({object: sprite, key: ['bottom', 'static']});
        }

        legalPlacement(neighbors: NeighborMatrix<TerrainObject>): boolean {
            return (neighbors.center.type == Sea ||
                    neighbors.center.type == River ||
                    neighbors.center.type == Bridge);
        }
    }

    /** @deprecated This is no longer necessary, but I can't remove it without affecting the serials below. */
    export class RiverBridge extends Bridge {
        static readonly serial = Serial.next().value;

        constructor(prevTile?: TerrainObject) {
            super(new Plain());
        }
    }

    export class River extends TerrainObject {
        get type() { return River; }
        static readonly serial = Serial.next().value;

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

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            // River TODO They don't connect to each other
            let variant = TerrainMethods.fourDirectionalVariant(neighbors, River, Bridge);
            let sprite = new PIXI.Sprite(TerrainProperties.sheet.textures[`river-${variant}.png`]);
            this.layers.push({object: sprite, key: ['bottom', 'static']});
        }
    }

    export class Sea extends TerrainObject {
        get type() { return Sea; }
        static readonly serial = Serial.next().value;
        get landTile() { return false; }
        get shallowWaterSourceTile() { return false; }
        get shallowWater() { return this._shallowWater; }
        set shallowWater(b: boolean) { this._shallowWater = b; }
        private _shallowWater = false;

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

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            let container = TerrainMethods.createSeaLayer(neighbors);
            this.layers.push({object: container, key: ['bottom', 'static']});
        }
    }

    export class Beach extends TerrainObject {
        get type() { return Beach; }
        static readonly serial = Serial.next().value;
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

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            let container = TerrainMethods.createSeaLayer(neighbors, {includeCliffs: false});
            this.layers.push({object: container, key: ['bottom', 'static']});

            let variant = TerrainMethods.beachVariant(neighbors);
            let sprite = new PIXI.Sprite(TerrainProperties.sheet.textures[`beach-${variant}.png`]);
            this.layers.push({object: sprite, key: ['bottom', 'static']});
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
    }

    export class RoughSea extends TerrainObject {
        get type() { return RoughSea; }
        static readonly serial = Serial.next().value;
        get illustration(): PIXI.Sprite {
            return new PIXI.Sprite( TerrainProperties.infoPortraitSheet.textures['sea-landscape.png'] );
        }
        get landTile() { return false; }
        get shallowWaterSourceTile() { return false; }
        get shallowWater() { return this._shallowWater; }
        set shallowWater(b: boolean) { this._shallowWater = b; }
        private _shallowWater = false;

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

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            // Sea
            let container = TerrainMethods.createSeaLayer(neighbors, {includeCliffs: false});

            // Rough Sea
            let anim = new PIXI.AnimatedSprite(TerrainProperties.sheet.animations['roughsea']);
            anim.animationSpeed = 0.125;
            anim.play();

            container.addChildAt(anim, 0);
            this.layers.push({object: container, key: ['bottom', 'animated']}); // NOTE
            // This container must be in 'bottom' somewhere; 'top' breaks the blendmode somehow.
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
    }

    export class Mist extends TerrainObject {
        get type() { return Mist; }
        static readonly serial = Serial.next().value;
        get illustration(): PIXI.Sprite {
            return new PIXI.Sprite( TerrainProperties.infoPortraitSheet.textures['sea-landscape.png'] );
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

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            // Sea
            let container = TerrainMethods.createSeaLayer(neighbors);
            this.layers.push({object: container, key: ['bottom', 'static']});

            // Mist
            this._shapeSerial = TerrainMethods.lineDirectionalVariant(neighbors, Mist);
            let sprite = new PIXI.Sprite(TerrainProperties.sheet.textures[`mist-${this._shapeSerial}.png`]);
            sprite.alpha = 0.75;
            this.layers.push({object: sprite, key: ['top', 'row', 'static'], maskShape: true});
        }
    }

    export class Reef extends TerrainObject {
        get type() { return Reef; }
        static readonly serial = Serial.next().value;
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

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            // Sea
            let container = TerrainMethods.createSeaLayer(neighbors, {includeCliffs: false});
            this.layers.push({object: container, key: ['bottom', 'static']});
            
            // Reef
            let variant = TerrainMethods.randomTileVariant(loc, 4);
            let sprite = new PIXI.Sprite(TerrainProperties.sheet.textures[`reef-${variant}.png`]);
            this.layers.push({object: sprite, key: ['bottom', 'static']});
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
    }

    export class Fire extends TerrainObject {
        get type() { return Fire; }
        static readonly serial = Serial.next().value;
        get illustration(): PIXI.AnimatedSprite {
            let anim = new PIXI.AnimatedSprite( TerrainProperties.infoPortraitSheet.animations['default-landscape'] );
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

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            // Plain - Cragged
            let sprite = new PIXI.Sprite(TerrainProperties.sheet.textures[`plain-crag.png`]);
            this.layers.push({object: sprite, key: ['bottom', 'static']});

            // Fire
            let anim = new PIXI.AnimatedSprite(TerrainProperties.sheet.animations[`fire`]);
            anim.animationSpeed = 0.25;
            anim.play();
            this.layers.push({object: anim, key: ['top', 'row', 'animated']});
        }
    }

    export class Meteor extends TerrainObject {
        get type() { return Meteor; }
        static readonly serial = Serial.next().value;
        get illustration(): PIXI.AnimatedSprite {
            let anim = new PIXI.AnimatedSprite( TerrainProperties.infoPortraitSheet.animations['default-landscape'] );
            anim.animationSpeed = 6 / 20;
            anim.gotoAndPlay(Math.floor(Math.random()*anim.totalFrames));
            return anim;
        }
        get damageable(): boolean { return true; }
        get dominoTypes() { return [Plasma]; }

        get landTile() { return this._landTile; }
        private _landTile = true;

        get name() { return "Meteor"; }
        get shortName() { return "Meteor"; }
        get description() { return "/Destroy/ meteor chunks to eliminate any nearby plasma."; }
        get defenseRating() { return 0; }

        // TODO I wrote this decades ago. I have new standards now.
        // There's no reason for this to be generic.
        private _value = 99;
        get value(): number { return this._value; }
        set value(n) { this._value = Common.clamp(n, 0, 99); }

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
            if (prevTile)
                this._landTile = prevTile.landTile;
        }

        exportDataBlob() {
            return {
                landTile: this.landTile,
                hp: this.value,
            };
        }

        importDataBlob(data: {landTile: boolean, hp: number}) {
            this._landTile = data.landTile;
            this._value = data.hp;
        }

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            if (this.landTile) {
                // Plain
                let sprite = TerrainMethods.createPlainLayer(loc, neighbors);
                this.layers.push({object: sprite, key: ['bottom', 'static']});

                // Not until the meteor is destroyed; looks weird with it.
                // let sprite = new PIXI.Sprite(TerrainProperties.sheet.textures[`plain-7.png`]);
            } else {
                // Sea
                let container = TerrainMethods.createSeaLayer(neighbors);
                this.layers.push({object: container, key: ['bottom', 'static']});
            }
            
            // Meteor
            this._shapeSerial = TerrainMethods.fourDirectionalVariant(neighbors, Plasma);
            this._shapeSerial = '0' + this._shapeSerial.slice(1);   // Up is always 'false' graphically
            let anim = new PIXI.AnimatedSprite(TerrainProperties.sheet.animations[`meteor-${this._shapeSerial}`]);
            anim.animationSpeed = 0.2;
            if (this._shapeSerial != "0000")
                anim.play();
            this.layers.push({object: anim, key: ['top', 'row', 'animated'], maskShape: true});
        }
    }

    export class Plasma extends TerrainObject {
        get type() { return Plasma; }
        static readonly serial = Serial.next().value;
        get illustration(): PIXI.AnimatedSprite {
            let anim = new PIXI.AnimatedSprite( TerrainProperties.infoPortraitSheet.animations['default-landscape'] );
            anim.animationSpeed = 6 / 20;
            anim.gotoAndPlay(Math.floor(Math.random()*anim.totalFrames));
            return anim;
        }
        get dominoTypes() { return [Plasma]; }

        get landTile() { return this._landTile; }
        private _landTile = true;

        get shallowWaterSourceTile() { return false; }
        get shallowWater() { return this._shallowWater; }
        set shallowWater(b: boolean) { this._shallowWater = b; }
        private _shallowWater = false;

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
            if (prevTile)
                this._landTile = prevTile.landTile;
        }

        exportDataBlob() {
            return {
                landTile: this.landTile,
            }
        }

        importDataBlob(data: {landTile: boolean}) {
            this._landTile = data.landTile;
        }

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            if (this.landTile) {
                // Plain
                let sprite = TerrainMethods.createPlainLayer(loc, neighbors);
                this.layers.push({object: sprite, key: ['bottom', 'static']});

                // Not until plasma is destroyed; otherwise, plasma has a brown halo and it looks weird.
                // let variant = TerrainMethods.fourDirectionalVariant(neighbors, Plasma);
                // let sprite = new PIXI.Sprite(TerrainProperties.sheet.textures[`plain-${variant}.png`]);
            } else {
                // Sea
                let container = TerrainMethods.createSeaLayer(neighbors);
                this.layers.push({object: container, key: ['bottom', 'static']});
            }

            // Plasma
            this._shapeSerial = TerrainMethods.fourDirectionalVariant(neighbors, Plasma, Meteor);
            let anim = new PIXI.AnimatedSprite(TerrainProperties.sheet.animations[`plasma-${this._shapeSerial}`]);
            anim.animationSpeed = 0.25;
            anim.play();
            this.layers.push({object: anim, key: ['top', 'row', 'animated']});
        }
    }

    export class Pipeline extends TerrainObject {
        get type() { return Pipeline; }
        static readonly serial = Serial.next().value;

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

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
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

        legalPlacement(neighbors: NeighborMatrix<TerrainObject>) {
            return false;
        }
    }

    export class PipeSeam extends TerrainObject {
        get type() { return PipeSeam; }
        static readonly serial = Serial.next().value;

        get name() { return "Pipe Seam"; }
        get shortName() { return "Pipe"; }
        get description() { return "The armor is weaker here than on other sections of the pipe."; }
        get defenseRating() { return 0; }

        private _value = 99;
        get value(): number { return this._value; }
        set value(n) { this._value = Common.clamp(n, 0, 99); }

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

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            // TODO Implement Pipe Seams
        }

        legalPlacement(neighbors: NeighborMatrix<TerrainObject>) {
            // neighbors.center.type == Pipe &&
            // neighbors.center.direction == 0101 || 1010 // a straight line necessarily connected to other pipes.
            return false;
        }
    }

    export class HQ extends TerrainBuildingObject {
        get type() { return HQ; }
        static readonly serial = Serial.next().value;

        get name() { return "HQ"; }
        get shortName() { return "HQ"; }
        get minimapIconName() { return `hq-${FactionColors[this.faction]}`; }
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

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            let layers = TerrainMethods.createBuildingLayers(loc, neighbors, 'hq');
            this.buildingSprite = layers.top;

            this.layers.push({object: layers.bottom, key: ['bottom', 'static']});
            this.layers.push({object: layers.top, key: ['top', 'row', 'animated'], maskShape: true});
        }
    }

    export class City extends TerrainBuildingObject {
        get type() { return City; }
        static readonly serial = Serial.next().value;

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

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            let layers = TerrainMethods.createBuildingLayers(loc, neighbors, 'city');
            this.buildingSprite = layers.top;

            this.layers.push({object: layers.bottom, key: ['bottom', 'static']});
            this.layers.push({object: layers.top, key: ['top', 'row', 'animated'], maskShape: true});
        }
    }

    export class ComTower extends TerrainBuildingObject {
        get type() { return ComTower; }
        static readonly serial = Serial.next().value;

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

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            let layers = TerrainMethods.createBuildingLayers(loc, neighbors, 'comtower');
            this.buildingSprite = layers.top;

            this.layers.push({object: layers.bottom, key: ['bottom', 'static']});
            this.layers.push({object: layers.top, key: ['top', 'row', 'animated'], maskShape: true});
        }
    }

    export class Radar extends TerrainBuildingObject {
        get type() { return Radar; }
        static readonly serial = Serial.next().value;

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

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            let layers = TerrainMethods.createBuildingLayers(loc, neighbors, 'radar');
            this.buildingSprite = layers.top;

            this.layers.push({object: layers.bottom, key: ['bottom', 'static']});
            this.layers.push({object: layers.top, key: ['top', 'row', 'animated'], maskShape: true});
        }
    }

    export class Silo extends TerrainObject {
        get type() { return Silo; }
        static readonly serial = Serial.next().value;
        get illustration(): PIXI.Sprite {
            const variant = (this.used) ? 'used' : 'unused';
            return new PIXI.Sprite( TerrainProperties.infoPortraitSheet.textures[`silo-${variant}-landscape.png`] );
        }

        get name() { return "Silo"; }
        get shortName() { return "Silo"; }
        get description() { return "Foot soldiers can launch this. It damages a /13-square/ area."; }
        get defenseRating() { return 2; }
        get conceals() { return true; }

        private siloSprite!: PIXI.Sprite;

        private updateTexture() {
            const which = this._used ? 2 : 1;
            const tex = TerrainProperties.sheet.textures[`silo-${which}.png`];
            this.siloSprite.texture = tex;
            this.siloSprite.anchor.y = .5;
            this._shapeSerial = `${this._used ? 0 : 1}`;
        }

        /** Whether this silo has been launched already. */
        get used(): boolean { return this._used; }
        set used(b) {
            this._used = b;
            this.updateTexture();
        }
        private _used = false;

        actionable(unit: UnitObject) {
            return (unit.soldierUnit && !this.used);
        }

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

        exportDataBlob() {
            return {used: this._used};
        }

        importDataBlob(data: {used: boolean}) {
            this._used = data.used;
        }

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            // Plain
            let sprite = TerrainMethods.createPlainLayer(loc, neighbors);
            this.layers.push({object: sprite, key: ['bottom', 'static']});

            // Silo
            this.siloSprite = new PIXI.Sprite();
            this.updateTexture();
            this.layers.push({object: this.siloSprite, key: ['top', 'row', 'animated'], maskShape: true});
        }
    }

    export class Factory extends TerrainBuildingObject {
        get type() { return Factory; }
        static readonly serial = Serial.next().value;

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

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            let layers = TerrainMethods.createBuildingLayers(loc, neighbors, 'factory');
            this.buildingSprite = layers.top;

            this.layers.push({object: layers.bottom, key: ['bottom', 'static']});
            this.layers.push({object: layers.top, key: ['top', 'row', 'animated'], maskShape: true});
        }
    }

    export class Airport extends TerrainBuildingObject {
        get type() { return Airport; }
        static readonly serial = Serial.next().value;

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

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            let layers = TerrainMethods.createBuildingLayers(loc, neighbors, 'airport');
            this.buildingSprite = layers.top;

            this.layers.push({object: layers.bottom, key: ['bottom', 'static']});
            this.layers.push({object: layers.top, key: ['top', 'row', 'animated'], maskShape: true});
        }
    }

    export class Port extends TerrainBuildingObject {
        get type() { return Port; }
        static readonly serial = Serial.next().value;
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

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            let layers = TerrainMethods.createBuildingLayers(loc, neighbors, 'port');
            layers.bottom = TerrainMethods.createSeaLayer(neighbors);
            this.buildingSprite = layers.top;

            this.layers.push({object: layers.bottom, key: ['bottom', 'static']});
            this.layers.push({object: layers.top, key: ['top', 'row', 'animated'], maskShape: true});
        }
    }

    export class TempAirpt extends TerrainBuildingObject {
        get type() { return TempAirpt; }
        static readonly serial = Serial.next().value;

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

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            let layers = TerrainMethods.createBuildingLayers(loc, neighbors, 'tempairpt');
            this.buildingSprite = layers.top;

            this.layers.push({object: layers.bottom, key: ['bottom', 'static']});
            this.layers.push({object: layers.top, key: ['top', 'row', 'animated'], maskShape: true});
        }
    }

    export class TempPort extends TerrainBuildingObject {
        get type() { return TempPort; }
        static readonly serial = Serial.next().value;
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

        orient(neighbors: NeighborMatrix<TerrainObject>, loc: Point) {
            let layers = TerrainMethods.createBuildingLayers(loc, neighbors, 'tempport');
            layers.bottom = TerrainMethods.createSeaLayer(neighbors);
            this.buildingSprite = layers.top;

            this.layers.push({object: layers.bottom, key: ['bottom', 'static']});
            this.layers.push({object: layers.top, key: ['top', 'row', 'animated'], maskShape: true});
        }
    }
    //end
}