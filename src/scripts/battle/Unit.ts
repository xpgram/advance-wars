import { Game } from "../.."
import { UnitObject } from "./UnitObject";
import { AttackMethod, MoveType, ArmorType, UnitClass } from "./EnumTypes";

export const Unit = {
    spritesheet: 'UnitSpritesheet',
    get sheet() { return Game.scene.resources[ Unit.spritesheet ].spritesheet as PIXI.Spritesheet; },

    //start
    Infantry: class InfantryUnit extends UnitObject {
        get type() { return InfantryUnit; }
        get serial() { return 0; }
        get name() { return "Infantry"; }
        get shortName() { return "Inftry"; }
        get description() { return "The cheapest unit. They can /capture/ bases. /+3 to vision when/ on mountains."; }
    
        get maxGas() { return 99; }
        get maxAmmo() { return 0; }
        get maxMovementPoints() { return 3; }
        get vision() { return 2; }
        
        get soldierUnit() { return true; }  
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.Infantry; }
        get armorType() { return ArmorType.Infantry; }
    
        protected readonly armorTargetMatrix = [
            [0,2],[0,1],[0,0],[0,1],[0,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [0,55],[0,45],[0,45],[0,12],[0,10],[0,3],[0,5],[0,5],[0,1],[0,10],[0,30],[0,20],[0,20],[0,14],[0,0],[0,0],[0,0],[0,0],[0,0],[0,8],[0,30],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,1]
        ];
    },

    Mech: class MechUnit extends UnitObject {
        get type() { return MechUnit; }
        get serial() { return 1; }
        get name() { return "Mech"; }
        get shortName() { return "Mech"; }
        get description() { return "High attack power. They can /capture/ bases. /+3 to vision when/ on mountains."; }
    
        get maxGas() { return 70; }
        get maxAmmo() { return 3; }
        get maxMovementPoints() { return 2; }
        get vision() { return 2; }
        
        get soldierUnit() { return true; }  
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.Mech; }
        get armorType() { return ArmorType.Infantry; }
    
        protected readonly armorTargetMatrix = [
            [0,2],[2,1],[0,0],[0,1],[0,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [0,65],[0,55],[0,55],[85,18],[80,15],[55,5],[55,8],[25,5],[15,1],[70,15],[55,35],[85,35],[85,35],[75,20],[0,0],[0,0],[0,0],[0,0],[0,0],[0,12],[0,35],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[15,2]
        ];
    },

    Bike: class BikeUnit extends UnitObject {
        get type() { return BikeUnit; }
        get serial() { return 2; }
        get name() { return "Bike"; }
        get shortName() { return "Bike"; }
        get description() { return "An infantry unit with high mobility. They can /capture/ bases."; }
    
        get maxGas() { return 70; }
        get maxAmmo() { return 0; }
        get maxMovementPoints() { return 5; }
        get vision() { return 2; }
        
        get soldierUnit() { return true; }  
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.TireB; }
        get armorType() { return ArmorType.Infantry; }
    
        protected readonly armorTargetMatrix = [
            [0,2],[0,1],[0,0],[0,1],[0,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [0,65],[0,55],[0,55],[0,18],[0,15],[0,5],[0,8],[0,5],[0,1],[0,15],[0,35],[0,35],[0,35],[0,20],[0,0],[0,0],[0,0],[0,0],[0,0],[0,12],[0,35],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,2]
        ];
    },

    Recon: class ReconUnit extends UnitObject {
        get type() { return ReconUnit; }
        get serial() { return 3; }
        get name() { return "Recon"; }
        get shortName() { return "Recon"; }
        get description() { return "Good movement and vision. They are strong against infantry."; }
    
        get maxGas() { return 80; }
        get maxAmmo() { return 0; }
        get maxMovementPoints() { return 8; }
        get vision() { return 5; }
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.TireA; }
        get armorType() { return ArmorType.Vehicle; }
    
        protected readonly armorTargetMatrix = [
            [0,2],[0,1],[0,0],[0,1],[0,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [0,75],[0,65],[0,65],[0,35],[0,30],[0,8],[0,8],[0,5],[0,1],[0,45],[0,25],[0,55],[0,55],[0,45],[0,0],[0,0],[0,0],[0,0],[0,0],[0,18],[0,35],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,3]
        ];
    },

    Flare: class FlareUnit extends UnitObject {
        get type() { return FlareUnit; }
        get serial() { return 4; }
        get name() { return "Flare"; }
        get shortName() { return "Flare"; }
        get description() { return "Flares fire bright /rockets/ that reveal a /13-square area/ in Fog of War."; }
    
        get maxGas() { return 60; }
        get maxAmmo() { return 0; }
        get maxMovementPoints() { return 5; }
        get vision() { return 2; }
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.Tread; }
        get armorType() { return ArmorType.Vehicle; }
    
        protected readonly armorTargetMatrix = [
            [0,2],[0,1],[0,0],[0,1],[0,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [0,80],[0,70],[0,70],[0,60],[0,50],[0,45],[0,10],[0,5],[0,1],[0,45],[0,25],[0,55],[0,55],[0,45],[0,0],[0,0],[0,0],[0,0],[0,0],[0,18],[0,35],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,5]
        ];
    },

    AntiAir: class AntiAirUnit extends UnitObject {
        get type() { return AntiAirUnit; }
        get serial() { return 5; }
        get name() { return "Anti-Air"; }
        get shortName() { return "Anti-Air"; }
        get description() { return "A specialized anti-air unit that can also attack ground forces."; }
    
        get maxGas() { return 60; }
        get maxAmmo() { return 9; }
        get maxMovementPoints() { return 6; }
        get vision() { return 3; }
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.Tread; }
        get armorType() { return ArmorType.Vehicle; }
    
        protected readonly armorTargetMatrix = [
            [2,0],[1,0],[2,0],[2,0],[0,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [105,0],[105,0],[105,0],[60,0],[50,0],[45,0],[15,0],[10,0],[5,0],[50,0],[25,0],[55,0],[55,0],[50,0],[70,0],[70,0],[70,0],[75,0],[75,0],[105,0],[120,0],[120,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[10,0]
        ];
    },

    Tank: class TankUnit extends UnitObject {
        get type() { return TankUnit; }
        get serial() { return 6; }
        get name() { return "Tank"; }
        get shortName() { return "Tank"; }
        get description() { return "High movement and a low production cost make these units quite useful."; }
    
        get maxGas() { return 70; }
        get maxAmmo() { return 6; }
        get maxMovementPoints() { return 6; }
        get vision() { return 3; }
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.Tread; }
        get armorType() { return ArmorType.Vehicle; }
    
        protected readonly armorTargetMatrix = [
            [0,2],[2,1],[0,0],[0,1],[1,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [0,75],[0,70],[0,70],[85,40],[80,35],[75,8],[55,8],[35,5],[20,1],[70,45],[30,5],[85,55],[85,55],[75,45],[0,0],[0,0],[0,0],[0,0],[0,0],[0,18],[0,40],[0,0],[8,0],[8,0],[9,0],[9,0],[18,0],[55,0],[20,5]
        ];
    },

    MdTank: class MdTankUnit extends UnitObject {
        get type() { return MdTankUnit; }
        get serial() { return 7; }
        get name() { return "Md Tank"; }
        get shortName() { return "M Tank"; }
        get description() { return "A strong tank with better attack and defense than standard tanks."; }
    
        get maxGas() { return 50; }
        get maxAmmo() { return 5; }
        get maxMovementPoints() { return 5; }
        get vision() { return 2; }
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.Tread; }
        get armorType() { return ArmorType.Vehicle; }
    
        protected readonly armorTargetMatrix = [
            [0,2],[2,1],[0,0],[0,1],[1,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [0,90],[0,80],[0,80],[95,40],[90,35],[90,8],[70,8],[55,5],[35,1],[85,45],[35,5],[90,60],[90,60],[90,45],[0,0],[0,0],[0,0],[0,0],[0,0],[0,24],[0,40],[0,0],[10,0],[10,0],[12,0],[12,0],[22,0],[55,0],[35,5]
        ];
    },

    WarTank: class WarTankUnit extends UnitObject {
        get type() { return WarTankUnit; }
        get serial() { return 8; }
        get name() { return "War Tank"; }
        get shortName() { return "W Tank"; }
        get description() { return "The strongest tank in terms of both attack and defense."; }
    
        get maxGas() { return 50; }
        get maxAmmo() { return 5; }
        get maxMovementPoints() { return 4; }
        get vision() { return 2; }
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.Tread; }
        get armorType() { return ArmorType.Vehicle; }
    
        protected readonly armorTargetMatrix = [
            [0,2],[2,1],[0,0],[0,1],[1,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [0,105],[0,95],[0,95],[105,45],[105,40],[105,10],[85,10],[75,10],[55,1],[105,45],[40,5],[105,65],[105,65],[105,45],[0,0],[0,0],[0,0],[0,0],[0,0],[0,35],[0,45],[0,0],[12,0],[12,0],[14,0],[14,0],[28,0],[65,0],[55,8]
        ];
    },

    Artillery: class ArtilleryUnit extends UnitObject {
        get type() { return ArtilleryUnit; }
        get serial() { return 9; }
        get name() { return "Artillery"; }
        get shortName() { return "Artlry"; }
        get description() { return "An indirect attacker. This unit can move or attack during a turn, but not both."; }
    
        get maxGas() { return 50; }
        get maxAmmo() { return 6; }
        get maxMovementPoints() { return 5; }
        get vision() { return 3; }
        get range() { return {min: 2, max: 3}; }  
        
        get canMoveAndAttack() { return false; }  
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.Tread; }
        get armorType() { return ArmorType.Vehicle; }
    
        protected readonly armorTargetMatrix = [
            [2,0],[2,0],[0,0],[0,0],[1,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [90,0],[85,0],[85,0],[80,0],[75,0],[65,0],[60,0],[45,0],[35,0],[75,0],[55,0],[80,0],[80,0],[70,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[45,0],[45,0],[55,0],[55,0],[65,0],[100,0],[45,0]
        ];
    },

    AntiTank: class AntiTankUnit extends UnitObject {
        get type() { return AntiTankUnit; }
        get serial() { return 10; }
        get name() { return "Anti-Tank"; }
        get shortName() { return "Anti-Tk"; }
        get description() { return "An indirect attacker that can /counter-attack/ when under direct fire."; }
    
        get maxGas() { return 50; }
        get maxAmmo() { return 6; }
        get maxMovementPoints() { return 4; }
        get vision() { return 2; }
        get range() { return {min: 1, max: 3}; }  
        
        get canMoveAndAttack() { return false; }  
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.TireB; }
        get armorType() { return ArmorType.Vehicle; }
    
        protected readonly armorTargetMatrix = [
            [2,0],[2,0],[0,0],[1,0],[0,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [75,0],[65,0],[65,0],[75,0],[75,0],[75,0],[75,0],[65,0],[55,0],[65,0],[55,0],[70,0],[70,0],[65,0],[0,0],[0,0],[0,0],[0,0],[0,0],[45,0],[55,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[55,0]
        ];
    },

    Rockets: class RocketsUnit extends UnitObject {
        get type() { return RocketsUnit; }
        get serial() { return 11; }
        get name() { return "Rockets"; }
        get shortName() { return "Rocket"; }
        get description() { return "A powerful indirect attacker with a wide range."; }
    
        get maxGas() { return 50; }
        get maxAmmo() { return 5; }
        get maxMovementPoints() { return 5; }
        get vision() { return 3; }
        get range() { return {min: 3, max: 5}; }  
        
        get canMoveAndAttack() { return false; }  
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.TireA; }
        get armorType() { return ArmorType.Vehicle; }
    
        protected readonly armorTargetMatrix = [
            [2,0],[2,0],[0,0],[0,0],[2,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [95,0],[90,0],[90,0],[90,0],[85,0],[75,0],[70,0],[55,0],[45,0],[80,0],[65,0],[85,0],[85,0],[80,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[55,0],[55,0],[65,0],[65,0],[75,0],[105,0],[55,0]
        ];
    },

    Missiles: class MissilesUnit extends UnitObject {
        get type() { return MissilesUnit; }
        get serial() { return 12; }
        get name() { return "Missiles"; }
        get shortName() { return "Missile"; }
        get description() { return "An indirect attacker that can only strike airborne targets."; }
    
        get maxGas() { return 50; }
        get maxAmmo() { return 5; }
        get maxMovementPoints() { return 5; }
        get vision() { return 6; }
        get range() { return {min: 3, max: 7}; }  
        
        get canMoveAndAttack() { return false; }  
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.TireA; }
        get armorType() { return ArmorType.Vehicle; }
    
        protected readonly armorTargetMatrix = [
            [0,0],[0,0],[2,0],[2,0],[0,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[100,0],[100,0],[100,0],[100,0],[100,0],[120,0],[120,0],[120,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]
        ];
    },

    Rig: class RigUnit extends UnitObject {
        get type() { return RigUnit; }
        get serial() { return 13; }
        get name() { return "Rig"; }
        get shortName() { return "Rig"; }
        get description() { return "/Carries 1/ infantry or mech unit. Can also /supply/ units and /build/ temp airports//ports."; }
    
        get maxGas() { return 99; }
        get maxAmmo() { return 1; }
        get maxMovementPoints() { return 6; }
        get vision() { return 1; }
        get range() { return {min: 0, max: 0}; }  
        
        get materialInsteadOfAmmo() { return true; }  
        get canMoveAndAttack() { return false; }  
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.Tread; }
        get armorType() { return ArmorType.Vehicle; }
    
        protected readonly armorTargetMatrix = [
            [0,0],[0,0],[0,0],[0,0],[0,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]
        ];
    },

    Fighter: class FighterUnit extends UnitObject {
        get type() { return FighterUnit; }
        get serial() { return 14; }
        get name() { return "Fighter"; }
        get shortName() { return "Fighter"; }
        get description() { return "A mobile aircraft that can attack other airborne units."; }
    
        get maxGas() { return 99; }
        get maxAmmo() { return 6; }
        get maxMovementPoints() { return 9; }
        get vision() { return 5; }
    
        get unitClass() { return UnitClass.Air; }
        get moveType() { return MoveType.Air; }
        get armorType() { return ArmorType.Air; }
    
        protected readonly armorTargetMatrix = [
            [0,0],[0,0],[2,0],[2,0],[0,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[55,0],[65,0],[65,0],[80,0],[65,0],[120,0],[120,0],[120,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]
        ];
    },

    Bomber: class BomberUnit extends UnitObject {
        get type() { return BomberUnit; }
        get serial() { return 15; }
        get name() { return "Bomber"; }
        get shortName() { return "Bomber"; }
        get description() { return "A massively powerful plane that can attack both ground and naval units."; }
    
        get maxGas() { return 99; }
        get maxAmmo() { return 6; }
        get maxMovementPoints() { return 7; }
        get vision() { return 3; }
    
        get unitClass() { return UnitClass.Air; }
        get moveType() { return MoveType.Air; }
        get armorType() { return ArmorType.Air; }
    
        protected readonly armorTargetMatrix = [
            [2,0],[2,0],[0,0],[0,0],[2,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [115,0],[110,0],[110,0],[105,0],[105,0],[85,0],[105,0],[95,0],[75,0],[105,0],[80,0],[105,0],[95,0],[105,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[85,0],[85,0],[95,0],[50,0],[95,0],[120,0],[90,0]
        ];
    },

    Stealth: class StealthUnit extends UnitObject {
        get type() { return StealthUnit; }
        get serial() { return 16; }
        get name() { return "Stealth"; }
        get shortName() { return "Stealth"; }
        get description() { return "A powerful air unit that can /cloak/ and remain hidden until found by adjacent enemy units."; }
    
        get maxGas() { return 60; }
        get maxAmmo() { return 6; }
        get maxMovementPoints() { return 6; }
        get vision() { return 3; }
    
        get unitClass() { return UnitClass.Air; }
        get moveType() { return MoveType.Air; }
        get armorType() { return ArmorType.Air; }
    
        protected readonly armorTargetMatrix = [
            [2,0],[2,0],[2,0],[2,0],[2,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [95,0],[90,0],[90,0],[85,0],[80,0],[50,0],[75,0],[70,0],[55,0],[75,0],[55,0],[85,0],[75,0],[85,0],[45,0],[55,0],[55,0],[65,0],[55,0],[85,0],[95,0],[105,0],[45,0],[65,0],[55,0],[40,0],[85,0],[105,0],[70,0]
        ];
    },

    Duster: class DusterUnit extends UnitObject {
        get type() { return DusterUnit; }
        get serial() { return 17; }
        get name() { return "Duster"; }
        get shortName() { return "Duster"; }
        get description() { return "A somewhat powerful plane that can attack both ground and air units."; }
    
        get maxGas() { return 99; }
        get maxAmmo() { return 9; }
        get maxMovementPoints() { return 8; }
        get vision() { return 4; }
    
        get unitClass() { return UnitClass.Air; }
        get moveType() { return MoveType.Air; }
        get armorType() { return ArmorType.Air; }
    
        protected readonly armorTargetMatrix = [
            [1,0],[1,0],[1,0],[2,0],[0,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [55,0],[45,0],[45,0],[18,0],[15,0],[5,0],[8,0],[5,0],[1,0],[15,0],[5,0],[20,0],[20,0],[15,0],[40,0],[45,0],[45,0],[55,0],[45,0],[75,0],[90,0],[95,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[5,0]
        ];
    },

    SeaPlane: class SeaPlaneUnit extends UnitObject {
        get type() { return SeaPlaneUnit; }
        get serial() { return 18; }
        get name() { return "Sea Plane"; }
        get shortName() { return "Seapl"; }
        get description() { return "A plane produced at sea by carriers. It can attack any unit."; }
    
        get maxGas() { return 40; }
        get maxAmmo() { return 3; }
        get maxMovementPoints() { return 7; }
        get vision() { return 4; }
    
        get unitClass() { return UnitClass.Air; }
        get moveType() { return MoveType.Air; }
        get armorType() { return ArmorType.Air; }
    
        protected readonly armorTargetMatrix = [
            [2,0],[2,0],[2,0],[2,0],[2,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [90,0],[85,0],[85,0],[80,0],[80,0],[45,0],[75,0],[65,0],[55,0],[70,0],[50,0],[80,0],[70,0],[75,0],[45,0],[55,0],[55,0],[65,0],[55,0],[85,0],[95,0],[95,0],[45,0],[65,0],[55,0],[40,0],[85,0],[105,0],[55,0]
        ];
    },

    BCopter: class BCopterUnit extends UnitObject {
        get type() { return BCopterUnit; }
        get serial() { return 19; }
        get name() { return "B Copter"; }
        get shortName() { return "B Cptr"; }
        get description() { return "An air unit that can attack ground and naval units, as well as other helicopters."; }
    
        get maxGas() { return 99; }
        get maxAmmo() { return 6; }
        get maxMovementPoints() { return 6; }
        get vision() { return 3; }
    
        get unitClass() { return UnitClass.Air; }
        get moveType() { return MoveType.Air; }
        get armorType() { return ArmorType.Heli; }
    
        protected readonly armorTargetMatrix = [
            [0,2],[2,1],[0,0],[0,2],[1,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [0,75],[0,65],[0,65],[75,30],[75,30],[10,1],[70,8],[45,8],[35,1],[65,25],[20,1],[75,35],[55,25],[70,20],[0,0],[0,0],[0,0],[0,0],[0,0],[0,65],[0,85],[0,0],[25,0],[25,0],[25,0],[5,0],[25,0],[85,0],[20,0]
        ];
    },

    TCopter: class TCopterUnit extends UnitObject {
        get type() { return TCopterUnit; }
        get serial() { return 20; }
        get name() { return "T Copter"; }
        get shortName() { return "T Cptr"; }
        get description() { return "An air unit that can /carry 1/ infantry or mech unit, but has no attack capabilities."; }
    
        get maxGas() { return 99; }
        get maxAmmo() { return 0; }
        get maxMovementPoints() { return 6; }
        get vision() { return 2; }
        get range() { return {min: 0, max: 0}; }  
        
        get canMoveAndAttack() { return false; }  
    
        get unitClass() { return UnitClass.Air; }
        get moveType() { return MoveType.Air; }
        get armorType() { return ArmorType.Heli; }
    
        protected readonly armorTargetMatrix = [
            [0,0],[0,0],[0,0],[0,0],[0,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]
        ];
    },

    BlackBomb: class BlackBombUnit extends UnitObject {
        get type() { return BlackBombUnit; }
        get serial() { return 21; }
        get name() { return "Black Bomb"; }
        get shortName() { return "B Bomb"; }
        get description() { return "An unmanned aerial unit. This unit can /explode/ at will, damaging all units within 3 spaces."; }
    
        get maxGas() { return 45; }
        get maxAmmo() { return 0; }
        get maxMovementPoints() { return 7; }
        get vision() { return 1; }
        get range() { return {min: 0, max: 0}; }  
    
        get unitClass() { return UnitClass.Air; }
        get moveType() { return MoveType.Air; }
        get armorType() { return ArmorType.Air; }
    
        protected readonly armorTargetMatrix = [
            [0,0],[0,0],[0,0],[0,0],[0,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]
        ];
    },

    Battleship: class BattleshipUnit extends UnitObject {
        get type() { return BattleshipUnit; }
        get serial() { return 22; }
        get name() { return "Battleship"; }
        get shortName() { return "B Ship"; }
        get description() { return "An extremely strong naval unit that can /launch indirect attacks after moving/."; }
    
        get maxGas() { return 99; }
        get maxAmmo() { return 6; }
        get maxMovementPoints() { return 5; }
        get vision() { return 3; }
        get range() { return {min: 3, max: 5}; }  
    
        get unitClass() { return UnitClass.Naval; }
        get moveType() { return MoveType.Ship; }
        get armorType() { return ArmorType.Ship; }
    
        protected readonly armorTargetMatrix = [
            [2,0],[2,0],[0,0],[0,0],[2,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [75,0],[70,0],[70,0],[70,0],[70,0],[65,0],[65,0],[50,0],[40,0],[70,0],[55,0],[75,0],[75,0],[65,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[45,0],[50,0],[65,0],[65,0],[75,0],[95,0],[55,0]
        ];
    },

    Carrier: class CarrierUnit extends UnitObject {
        get type() { return CarrierUnit; }
        get serial() { return 23; }
        get name() { return "Carrier"; }
        get shortName() { return "Carrier"; }
        get description() { return "A naval unit that can /carry 2/ air units and /produce/ seaplanes."; }
    
        get maxGas() { return 99; }
        get maxAmmo() { return 4; }
        get maxMovementPoints() { return 5; }
        get vision() { return 4; }
        
        get materialInsteadOfAmmo() { return true; }  
    
        get unitClass() { return UnitClass.Naval; }
        get moveType() { return MoveType.Ship; }
        get armorType() { return ArmorType.Ship; }
    
        protected readonly armorTargetMatrix = [
            [0,0],[0,0],[0,1],[0,1],[0,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,35],[0,35],[0,35],[0,40],[0,40],[0,45],[0,55],[0,55],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]
        ];
    },

    Submarine: class SubmarineUnit extends UnitObject {
        get type() { return SubmarineUnit; }
        get serial() { return 24; }
        get name() { return "Submarine"; }
        get shortName() { return "Sub"; }
        get description() { return "After /diving/, they remain hidden unless found by adjacent enemy units."; }
    
        get maxGas() { return 70; }
        get maxAmmo() { return 6; }
        get maxMovementPoints() { return 6; }
        get vision() { return 5; }
    
        get unitClass() { return UnitClass.Naval; }
        get moveType() { return MoveType.Ship; }
        get armorType() { return ArmorType.Sub; }
    
        protected readonly armorTargetMatrix = [
            [0,0],[0,0],[0,0],[0,0],[2,0],[2,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[80,0],[110,0],[55,0],[20,0],[85,0],[120,0],[55,0]
        ];
    },

    Cruiser: class CruiserUnit extends UnitObject {
        get type() { return CruiserUnit; }
        get serial() { return 25; }
        get name() { return "Cruiser"; }
        get shortName() { return "Cruiser"; }
        get description() { return "Cruisers are strong against subs and air units, and can /carry 2 copter units/."; }
    
        get maxGas() { return 99; }
        get maxAmmo() { return 9; }
        get maxMovementPoints() { return 6; }
        get vision() { return 5; }
    
        get unitClass() { return UnitClass.Naval; }
        get moveType() { return MoveType.Ship; }
        get armorType() { return ArmorType.Ship; }
    
        protected readonly armorTargetMatrix = [
            [0,0],[0,0],[0,2],[0,2],[1,0],[2,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,105],[0,105],[0,105],[0,105],[0,105],[0,120],[0,120],[0,120],[38,0],[38,0],[95,0],[28,0],[40,0],[85,0],[35,0]
        ];
    },

    Lander: class LanderUnit extends UnitObject {
        get type() { return LanderUnit; }
        get serial() { return 26; }
        get name() { return "Lander"; }
        get shortName() { return "Lander"; }
        get description() { return "Landers can /carry 2 ground units/. If the lander sinks, the units vanish."; }
    
        get maxGas() { return 99; }
        get maxAmmo() { return 0; }
        get maxMovementPoints() { return 6; }
        get vision() { return 1; }
        get range() { return {min: 0, max: 0}; }  
        
        get canMoveAndAttack() { return false; }  
    
        get unitClass() { return UnitClass.Naval; }
        get moveType() { return MoveType.Transport; }
        get armorType() { return ArmorType.Ship; }
    
        protected readonly armorTargetMatrix = [
            [0,0],[0,0],[0,0],[0,0],[0,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]
        ];
    },

    GunBoat: class GunBoatUnit extends UnitObject {
        get type() { return GunBoatUnit; }
        get serial() { return 27; }
        get name() { return "Gun Boat"; }
        get shortName() { return "G Boat"; }
        get description() { return "A unit that can /carry 1/ foot soldier and attack other naval units."; }
    
        get maxGas() { return 99; }
        get maxAmmo() { return 1; }
        get maxMovementPoints() { return 7; }
        get vision() { return 2; }
    
        get unitClass() { return UnitClass.Naval; }
        get moveType() { return MoveType.Transport; }
        get armorType() { return ArmorType.Ship; }
    
        protected readonly armorTargetMatrix = [
            [0,0],[0,0],[0,0],[0,0],[1,0],[0,0]
        ];
    
        protected readonly baseDamageMatrix = [
            [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[40,0],[40,0],[40,0],[40,0],[55,0],[75,0],[20,0]
        ];
    },
    //end
}