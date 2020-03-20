import { Game } from "../.."
import { UnitObject } from "./UnitObject";
import { AttackMethod, MoveType, ArmorType } from "./EnumTypes";

export const Unit = {
    spritesheet: 'UnitSpritesheet',
    get sheet() { return Game.scene.resources[ Unit.spritesheet ].spritesheet as PIXI.Spritesheet; },

    Infantry: class InfantryUnit extends UnitObject {
        get type() { return InfantryUnit; }
        get serial() { return 0; }
        get name() { return "Infantry"; }
        get description() { return "Yo. Dis guy got it."; }

        get soldierUnit() { return true; }

        get maxGas() { return 99; }
        get maxAmmo() { return 0; }
        get moveType() { return MoveType.Infantry; }

        attackMethod(target: UnitObject): AttackMethod {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;

            // TODO Move this into UnitObject, keep the matrix protected abstract

            let matrix = [
                [false,true],[false,true],[false,true],[true,true]
            ]
            let method = (matrix[target.armorType][0]) ? AttackMethod.Primary : AttackMethod.None;
            if (!method) method = (matrix[target.armorType][1]) ? AttackMethod.Secondary : AttackMethod.None;
            return method;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");

            // TODO Move this into UnitObject, keep the matrix protected abstract

            let matrix = [
                [55,25],[45,25]
            ]

            let method = this.attackMethod(target);
            if (method == AttackMethod.Primary)
                return matrix[target.serial][0];
            if (method == AttackMethod.Secondary)
                return matrix[target.serial][1];
            return 0;
        }
    },

    Mech: class MechUnit extends UnitObject {
        get type() { return MechUnit; }
        get serial() { return 1; }
        get name() { return "Mech"; }
        get description() { return "Yo. Dis guy got it."; }

        get soldierUnit() { return true; }

        get maxGas() { return 70; }
        get maxAmmo() { return 3; }
        get moveType() { return MoveType.Mech; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    Bike: class BikeUnit extends UnitObject {
        get type() { return BikeUnit; }
        get serial() { return 2; }
        get name() { return "Bike"; }
        get description() { return "Yo. Dis guy got it."; }

        get maxGas() { return 70; }
        get maxAmmo() { return 0; }
        get moveType() { return MoveType.TireB; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    Tank: class TankUnit extends UnitObject {
        get type() { return TankUnit; }
        get serial() { return 3; }
        get name() { return "Tank"; }
        get description() { return "Yo. Dis guy got it."; }

        get maxGas() { return 70; }
        get maxAmmo() { return 6; }
        get moveType() { return MoveType.Tread; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    Recon: class ReconUnit extends UnitObject {
        get type() { return ReconUnit; }
        get serial() { return 3; }
        get name() { return "Recon"; }
        get description() { return "Yo. Dis guy got it."; }

        get maxGas() { return 80; }
        get maxAmmo() { return 0; }
        get moveType() { return MoveType.TireA; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    AntiAir: class AntiAirUnit extends UnitObject {
        get type() { return AntiAirUnit; }
        get serial() { return 3; }
        get name() { return "Anti-Air"; }
        get description() { return "Yo. Dis guy got it."; }

        get maxGas() { return 60; }
        get maxAmmo() { return 6; }
        get moveType() { return MoveType.Tread; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    Rig: class RigUnit extends UnitObject {
        get type() { return RigUnit; }
        get serial() { return 3; }
        get name() { return "Rig"; }
        get description() { return "Yo. Dis guy got it."; }

        get materialsInsteadOfAmmo() { return true; }
        get maxGas() { return 99; }
        get maxAmmo() { return 1; }
        get moveType() { return MoveType.Tread; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    Flare: class FlareUnit extends UnitObject {
        get type() { return FlareUnit; }
        get serial() { return 3; }
        get name() { return "Flare"; }
        get description() { return "Yo. Dis guy got it."; }

        get maxGas() { return 60; }
        get maxAmmo() { return 3; }
        get moveType() { return MoveType.Tread; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    MdTank: class MdTankUnit extends UnitObject {
        get type() { return MdTankUnit; }
        get serial() { return 3; }
        get name() { return "Md Tank"; }
        get description() { return "Yo. Dis guy got it."; }

        get maxGas() { return 50; }
        get maxAmmo() { return 5; }
        get moveType() { return MoveType.Tread; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    WarTank: class WarTankUnit extends UnitObject {
        get type() { return WarTankUnit; }
        get serial() { return 3; }
        get name() { return "War Tank"; }
        get description() { return "Yo. Dis guy got it."; }

        get maxGas() { return 50; }
        get maxAmmo() { return 5; }
        get moveType() { return MoveType.Tread; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    Artillery: class ArtilleryUnit extends UnitObject {
        get type() { return ArtilleryUnit; }
        get serial() { return 3; }
        get name() { return "Artillery"; }
        get description() { return "Yo. Dis guy got it."; }

        get maxGas() { return 50; }
        get maxAmmo() { return 6; }
        get moveType() { return MoveType.Tread; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    Rockets: class RocketsUnit extends UnitObject {
        get type() { return RocketsUnit; }
        get serial() { return 3; }
        get name() { return "Rockets"; }
        get description() { return "Yo. Dis guy got it."; }

        get maxGas() { return 50; }
        get maxAmmo() { return 5; }
        get moveType() { return MoveType.TireA; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    AntiTank: class AntiTankUnit extends UnitObject {
        get type() { return AntiTankUnit; }
        get serial() { return 3; }
        get name() { return "Anti-Tank"; }
        get description() { return "Yo. Dis guy got it."; }

        get maxGas() { return 50; }
        get maxAmmo() { return 6; }
        get moveType() { return MoveType.TireB; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    Missiles: class MissilesUnit extends UnitObject {
        get type() { return MissilesUnit; }
        get serial() { return 3; }
        get name() { return "Missiles"; }
        get description() { return "Yo. Dis guy got it."; }

        get maxGas() { return 50; }
        get maxAmmo() { return 5; }
        get moveType() { return MoveType.TireA; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    TCopter: class TCopterUnit extends UnitObject {
        get type() { return TCopterUnit; }
        get serial() { return 3; }
        get name() { return "T Copter"; }
        get description() { return "Yo. Dis guy got it."; }

        get maxGas() { return 99; }
        get maxAmmo() { return 0; }
        get moveType() { return MoveType.Air; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    BCopter: class BCopterUnit extends UnitObject {
        get type() { return BCopterUnit; }
        get serial() { return 3; }
        get name() { return "B Copter"; }
        get description() { return "Yo. Dis guy got it."; }

        get maxGas() { return 99; }
        get maxAmmo() { return 6; }
        get moveType() { return MoveType.Air; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    Duster: class DusterUnit extends UnitObject {
        get type() { return DusterUnit; }
        get serial() { return 3; }
        get name() { return "Duster"; }
        get description() { return "Yo. Dis guy got it."; }

        get maxGas() { return 99; }
        get maxAmmo() { return 9; }
        get moveType() { return MoveType.Air; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    Fighter: class FighterUnit extends UnitObject {
        get type() { return FighterUnit; }
        get serial() { return 3; }
        get name() { return "Fighter"; }
        get description() { return "Yo. Dis guy got it."; }

        get maxGas() { return 99; }
        get maxAmmo() { return 6; }
        get moveType() { return MoveType.Air; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    Bomber: class BomberUnit extends UnitObject {
        get type() { return BomberUnit; }
        get serial() { return 3; }
        get name() { return "Bomber"; }
        get description() { return "Yo. Dis guy got it."; }

        get maxGas() { return 99; }
        get maxAmmo() { return 6; }
        get moveType() { return MoveType.Air; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    Seaplane: class SeaplaneUnit extends UnitObject {
        get type() { return SeaplaneUnit; }
        get serial() { return 3; }
        get name() { return "Seaplane"; }
        get description() { return "Yo. Dis guy got it."; }

        get maxGas() { return 40; }
        get maxAmmo() { return 3; }
        get moveType() { return MoveType.Air; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    Stealth: class StealthUnit extends UnitObject {
        get type() { return StealthUnit; }
        get serial() { return 3; }
        get name() { return "Stealth"; }
        get description() { return "Yo. Dis guy got it."; }

        get maxGas() { return 70; }
        get maxAmmo() { return 6; }
        get moveType() { return MoveType.Air; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    Seeker: class SeekerUnit extends UnitObject {
        get type() { return SeekerUnit; }
        get serial() { return 3; }
        get name() { return "Seeker"; }
        get description() { return "Yo. Dis guy got it."; }

        get maxGas() { return 70; }
        get maxAmmo() { return 0; }
        get moveType() { return MoveType.Air; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    Lander: class LanderUnit extends UnitObject {
        get type() { return LanderUnit; }
        get serial() { return 3; }
        get name() { return "Lander"; }
        get description() { return "Yo. Dis guy got it."; }

        get maxGas() { return 99; }
        get maxAmmo() { return 0; }
        get moveType() { return MoveType.Transport; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    Gunboat: class GunboatUnit extends UnitObject {
        get type() { return GunboatUnit; }
        get serial() { return 3; }
        get name() { return "Gunboat"; }
        get description() { return "Yo. Dis guy got it."; }

        get maxGas() { return 99; }
        get maxAmmo() { return 1; }
        get moveType() { return MoveType.Transport; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    Submarine: class SubmarineUnit extends UnitObject {
        get type() { return SubmarineUnit; }
        get serial() { return 3; }
        get name() { return "Submarine"; }
        get description() { return "Yo. Dis guy got it."; }

        get maxGas() { return 70; }
        get maxAmmo() { return 6; }
        get moveType() { return MoveType.Ship; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    Cruiser: class CruiserUnit extends UnitObject {
        get type() { return CruiserUnit; }
        get serial() { return 3; }
        get name() { return "Cruiser"; }
        get description() { return "Yo. Dis guy got it."; }

        get maxGas() { return 99; }
        get maxAmmo() { return 9; }
        get moveType() { return MoveType.Ship; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    Carrier: class CarrierUnit extends UnitObject {
        get type() { return CarrierUnit; }
        get serial() { return 3; }
        get name() { return "Carrier"; }
        get description() { return "Yo. Dis guy got it."; }

        get materialsInsteadOfAmmo() { return true; }
        get maxGas() { return 99; }
        get maxAmmo() { return 4; }
        get moveType() { return MoveType.Ship; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },

    Battleship: class BattleshipUnit extends UnitObject {
        get type() { return BattleshipUnit; }
        get serial() { return 3; }
        get name() { return "Battleship"; }
        get description() { return "Yo. Dis guy got it."; }

        get maxGas() { return 99; }
        get maxAmmo() { return 6; }
        get moveType() { return MoveType.Ship; }

        attackMethod(target: UnitObject) {
            throw new Error("Not implemented!");
            return AttackMethod.Primary;
        }

        baseDamage(target: UnitObject) {
            throw new Error("Not implemented!");
            return 70;
        }
    },
}