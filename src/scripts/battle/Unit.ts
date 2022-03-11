import { Game } from "../.."
import { UnitObject, UnitType } from "./UnitObject";
import { MoveType, ArmorType, UnitClass } from "./EnumTypes";
import { TerrainObject, TerrainType } from "./map/TerrainObject";
import { Terrain } from "./map/Terrain";
import { SerialGenerator } from "../Common/SerialGenerator";

const Serial = SerialGenerator();

export const UnitProperties = {
    spritesheet: 'UnitSpritesheet',
    illustrationSpritesheet: 'UnitIllustrationSpritesheet',
    get sheet() { return Game.scene.resources[ UnitProperties.spritesheet ].spritesheet as PIXI.Spritesheet; },
    get illustrationSheet() { return Game.scene.resources[ UnitProperties.illustrationSpritesheet ].spritesheet as PIXI.Spritesheet; },
}

export module Unit {

    //start
    export class Infantry extends UnitObject {
        get type() { return Infantry; }
        static readonly serial = Serial.next().value;

        get name() { return "Infantry"; }
        get shortName() { return "Inftry"; }
        get description() { return "The cheapest unit. They can /capture/ bases. /+3 to vision when/ on mountains."; }
        get cost() { return 1500; }
    
        get maxGas() { return 99; }
        get maxAmmo() { return 0; }
        get maxMovementPoints() { return 3; }
        get vision() { return 2; }
        
        get soldierUnit() { return true; }  
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.Infantry; }
        get armorType() { return ArmorType.Infantry; }
        
        get weapon() { return {
            primary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            },
            secondary: {
                name: 'Machine Gun',
                targetMap: [2,1,0,1,0,0],
                damageMap: [55,45,45,12,10,3,5,5,1,10,30,20,20,14,0,0,0,0,0,8,30,0,0,0,0,0,0,0,1]
            }
        }}
    }

    export class Mech extends UnitObject {
        get type() { return Mech; }
        static readonly serial = Serial.next().value;

        get name() { return "Mech"; }
        get shortName() { return "Mech"; }
        get description() { return "High attack power. They can /capture/ bases. /+3 to vision when/ on mountains."; }
        get cost() { return 2500; }
    
        get maxGas() { return 70; }
        get maxAmmo() { return 3; }
        get maxMovementPoints() { return 2; }
        get vision() { return 2; }
        
        get soldierUnit() { return true; }  
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.Mech; }
        get armorType() { return ArmorType.Infantry; }
        
        get weapon() { return {
            primary: {
                name: 'Bazooka',
                targetMap: [0,2,0,0,0,0],
                damageMap: [0,0,0,85,80,55,55,25,15,70,55,85,85,75,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15]
            },
            secondary: {
                name: 'Machine Gun',
                targetMap: [2,1,0,1,0,0],
                damageMap: [65,55,55,18,15,5,8,5,1,15,35,35,35,20,0,0,0,0,0,12,35,0,0,0,0,0,0,0,2]
            }
        }}
    }

    export class Bike extends UnitObject {
        get type() { return Bike; }
        static readonly serial = Serial.next().value;

        get name() { return "Bike"; }
        get shortName() { return "Bike"; }
        get description() { return "An infantry unit with high mobility. They can /capture/ bases."; }
        get cost() { return 2500; }
    
        get maxGas() { return 70; }
        get maxAmmo() { return 0; }
        get maxMovementPoints() { return 5; }
        get vision() { return 2; }
        
        get soldierUnit() { return true; }  
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.TireA; }   // Def: TireB
        get armorType() { return ArmorType.Infantry; }
        
        get weapon() { return {
            primary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            },
            secondary: {
                name: 'Machine Gun',
                targetMap: [2,1,0,1,0,0],
                damageMap: [65,55,55,18,15,5,8,5,1,15,35,35,35,20,0,0,0,0,0,12,35,0,0,0,0,0,0,0,2]
            }
        }}
    }

    export class Recon extends UnitObject {
        get type() { return Recon; }
        static readonly serial = Serial.next().value;

        get name() { return "Recon"; }
        get shortName() { return "Recon"; }
        get description() { return "Good movement and vision. They are strong against infantry."; }
        get cost() { return 4000; }
    
        get maxGas() { return 80; }
        get maxAmmo() { return 0; }
        get maxMovementPoints() { return 8; }
        get vision() { return 5; }
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.TireA; }
        get armorType() { return ArmorType.Vehicle; }
        
        get weapon() { return {
            primary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            },
            secondary: {
                name: 'Machine Gun',
                targetMap: [2,1,0,1,0,0],
                damageMap: [75,65,65,35,30,8,8,5,1,45,25,55,55,45,0,0,0,0,0,18,35,0,0,0,0,0,0,0,3]
            }
        }}
    }

    export class Flare extends UnitObject {
        get type() { return Flare; }
        static readonly serial = Serial.next().value;

        get name() { return "Flare"; }
        get shortName() { return "Flare"; }
        get description() { return "Flares fire bright /rockets/ that reveal a /13-square area/ in Fog of War."; }
        get cost() { return 5000; }
    
        get maxGas() { return 60; }
        get maxAmmo() { return 3; }
        get maxMovementPoints() { return 5; }
        get vision() { return 2; }

        get materialsInsteadOfAmmo() { return true; }
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.Tread; }
        get armorType() { return ArmorType.Vehicle; }
        
        get weapon() { return {
            primary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            },
            secondary: {
                name: 'Machine Gun',
                targetMap: [2,1,0,1,0,0],
                damageMap: [80,70,70,60,50,45,10,5,1,45,25,55,55,45,0,0,0,0,0,18,35,0,0,0,0,0,0,0,5]
            }
        }}
    }

    export class AntiAir extends UnitObject {
        get type() { return AntiAir; }
        static readonly serial = Serial.next().value;

        get name() { return "Anti-Air"; }
        get shortName() { return "Anti-Air"; }
        get description() { return "A specialized anti-air unit that can also attack ground forces."; }
        get cost() { return 7000; }
    
        get maxGas() { return 60; }
        get maxAmmo() { return 9; }
        get maxMovementPoints() { return 6; }
        get vision() { return 3; }
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.Tread; }
        get armorType() { return ArmorType.Vehicle; }
        
        get weapon() { return {
            primary: {
                name: 'Vulcan Gun',
                targetMap: [2,1,2,2,0,0],
                damageMap: [105,105,105,60,50,45,15,10,5,50,25,55,55,50,70,70,70,75,75,105,120,120,0,0,0,0,0,0,10]
            },
            secondary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            }
        }}
    }

    export class Tank extends UnitObject {
        get type() { return Tank; }
        static readonly serial = Serial.next().value;

        get name() { return "Tank"; }
        get shortName() { return "Tank"; }
        get description() { return "High movement and a low production cost make these units quite useful."; }
        get cost() { return 7000; }
    
        get maxGas() { return 70; }
        get maxAmmo() { return 6; }
        get maxMovementPoints() { return 6; }
        get vision() { return 3; }
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.Tread; }
        get armorType() { return ArmorType.Vehicle; }
        
        get weapon() { return {
            primary: {
                name: 'Tank Gun',
                targetMap: [0,2,0,0,1,0],
                damageMap: [0,0,0,85,80,75,55,35,20,70,30,85,85,75,0,0,0,0,0,0,0,0,8,8,9,9,18,55,20]
            },
            secondary: {
                name: 'Machine Gun',
                targetMap: [2,1,0,1,0,0],
                damageMap: [75,70,70,40,35,8,8,5,1,45,5,55,55,45,0,0,0,0,0,18,40,0,0,0,0,0,0,0,5]
            }
        }}
    }

    export class MdTank extends UnitObject {
        get type() { return MdTank; }
        static readonly serial = Serial.next().value;

        get name() { return "Md Tank"; }
        get shortName() { return "M Tank"; }
        get description() { return "A strong tank with better attack and defense than standard tanks."; }
        get cost() { return 12000; }
    
        get maxGas() { return 50; }
        get maxAmmo() { return 5; }
        get maxMovementPoints() { return 5; }
        get vision() { return 2; }
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.Tread; }
        get armorType() { return ArmorType.Vehicle; }
        
        get weapon() { return {
            primary: {
                name: 'Hvy Tk Gun',
                targetMap: [0,2,0,0,1,0],
                damageMap: [0,0,0,95,90,90,70,55,35,85,35,90,90,90,0,0,0,0,0,0,0,0,10,10,12,12,22,55,35]
            },
            secondary: {
                name: 'Machine Gun',
                targetMap: [2,1,0,1,0,0],
                damageMap: [90,80,80,40,35,8,8,5,1,45,5,60,60,45,0,0,0,0,0,24,40,0,0,0,0,0,0,0,5]
            }
        }}
    }

    export class WarTank extends UnitObject {
        get type() { return WarTank; }
        static readonly serial = Serial.next().value;

        get name() { return "War Tank"; }
        get shortName() { return "W Tank"; }
        get description() { return "The strongest tank in terms of both attack and defense."; }
        get cost() { return 16000; }
    
        get maxGas() { return 50; }
        get maxAmmo() { return 5; }
        get maxMovementPoints() { return 4; }
        get vision() { return 2; }
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.Tread; }
        get armorType() { return ArmorType.Vehicle; }
        
        get weapon() { return {
            primary: {
                name: 'Mega Gun',
                targetMap: [0,2,0,0,1,0],
                damageMap: [0,0,0,105,105,105,85,75,55,105,40,105,105,105,0,0,0,0,0,0,0,0,12,12,14,14,28,65,55]
            },
            secondary: {
                name: 'Machine Gun',
                targetMap: [2,1,0,1,0,0],
                damageMap: [105,95,95,45,40,10,10,10,1,45,5,65,65,45,0,0,0,0,0,35,45,0,0,0,0,0,0,0,8]
            }
        }}
    }

    export class Artillery extends UnitObject {
        get type() { return Artillery; }
        static readonly serial = Serial.next().value;

        get name() { return "Artillery"; }
        get shortName() { return "Artlry"; }
        get description() { return "An indirect attacker. This unit can move or attack during a turn, but not both."; }
        get cost() { return 6000; }
    
        get maxGas() { return 50; }
        get maxAmmo() { return 6; }
        get maxMovementPoints() { return 5; }
        get vision() { return 3; }
        get range() { return {min: 2, max: 3}; }  
        
        get canMoveAndAttack() { return false; }  
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.Tread; }
        get armorType() { return ArmorType.Vehicle; }
        
        get weapon() { return {
            primary: {
                name: 'Cannon',
                targetMap: [2,2,0,0,1,0],
                damageMap: [90,85,85,80,75,65,60,45,35,75,55,80,80,70,0,0,0,0,0,0,0,0,45,45,55,55,65,100,45]
            },
            secondary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            }
        }}
    }

    export class AntiTank extends UnitObject {
        get type() { return AntiTank; }
        static readonly serial = Serial.next().value;

        get name() { return "Anti-Tank"; }
        get shortName() { return "Anti-Tk"; }
        get description() { return "An indirect attacker that can /counter-attack/ when under direct fire."; }
        get cost() { return 11000; }
    
        get maxGas() { return 50; }
        get maxAmmo() { return 6; }
        get maxMovementPoints() { return 4; }
        get vision() { return 2; }
        get range() { return {min: 1, max: 3}; }  
        
        get canMoveAndAttack() { return false; }  
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.TireB; }
        get armorType() { return ArmorType.Vehicle; }
        
        get weapon() { return {
            primary: {
                name: 'Cannon',
                targetMap: [2,2,0,1,0,0],
                damageMap: [75,65,65,75,75,75,75,65,55,65,55,70,70,65,0,0,0,0,0,45,55,0,0,0,0,0,0,0,55]
            },
            secondary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            }
        }}
    }

    export class Rockets extends UnitObject {
        get type() { return Rockets; }
        static readonly serial = Serial.next().value;

        get name() { return "Rockets"; }
        get shortName() { return "Rocket"; }
        get description() { return "A powerful indirect attacker with a wide range."; }
        get cost() { return 15000; }
    
        get maxGas() { return 50; }
        get maxAmmo() { return 5; }
        get maxMovementPoints() { return 5; }
        get vision() { return 3; }
        get range() { return {min: 3, max: 5}; }  
        
        get canMoveAndAttack() { return false; }  
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.TireA; }
        get armorType() { return ArmorType.Vehicle; }
        
        get weapon() { return {
            primary: {
                name: 'Rocket',
                targetMap: [2,2,0,0,2,0],
                damageMap: [95,90,90,90,85,75,70,55,45,80,65,85,85,80,0,0,0,0,0,0,0,0,55,55,65,65,75,105,55]
            },
            secondary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            }
        }}
    }

    export class Missiles extends UnitObject {
        get type() { return Missiles; }
        static readonly serial = Serial.next().value;

        get name() { return "Missiles"; }
        get shortName() { return "Missile"; }
        get description() { return "An indirect attacker that can only strike airborne targets."; }
        get cost() { return 12000; }
    
        get maxGas() { return 50; }
        get maxAmmo() { return 5; }
        get maxMovementPoints() { return 5; }
        get vision() { return 6; }
        get range() { return {min: 3, max: 7}; }  
        
        get canMoveAndAttack() { return false; }  
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.TireA; }
        get armorType() { return ArmorType.Vehicle; }
        
        get weapon() { return {
            primary: {
                name: 'Anti-Air Msl',
                targetMap: [0,0,2,2,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,100,100,100,100,100,120,120,120,0,0,0,0,0,0,0]
            },
            secondary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            }
        }}
    }

    export class Rig extends UnitObject {
        get type() { return Rig; }
        static readonly serial = Serial.next().value;

        get name() { return "Rig"; }
        get shortName() { return "Rig"; }
        get description() { return "/Carries 1/ infantry or mech unit. Can also /supply/ units and /build/ temp airports//ports."; }
        get cost() { return 5000; }
    
        get maxGas() { return 99; }
        get maxAmmo() { return 1; }
        get maxMovementPoints() { return 6; }
        get vision() { return 1; }
        get range() { return {min: -1, max: -1}; }  
        
        get materialsInsteadOfAmmo() { return true; }  
        get ammoCanBeResupplied() { return false; }
        get canMoveAndAttack() { return false; }
        get canResupply() { return true; }

        boardable(unit?: UnitObject): boolean {
            const max = 1;
            const boardTypes: (UnitType | undefined)[] = [
                Unit.Infantry, Unit.Mech,
            ];

            const full = (this._loadedUnits.length >= max);
            const generally = (!unit);
            const soldierUnit = (boardTypes.includes(unit?.type));
            return !full && (soldierUnit || generally);
        }

        unloadPosition(terrain: TerrainObject) {
            return true;
        }
    
        get unitClass() { return UnitClass.Ground; }
        get moveType() { return MoveType.Tread; }
        get armorType() { return ArmorType.Vehicle; }
        
        get weapon() { return {
            primary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            },
            secondary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            }
        }}
    }

    export class Fighter extends UnitObject {
        get type() { return Fighter; }
        static readonly serial = Serial.next().value;

        get name() { return "Fighter"; }
        get shortName() { return "Fighter"; }
        get description() { return "A mobile aircraft that can attack other airborne units."; }
        get cost() { return 20000; }
    
        get maxGas() { return 99; }
        get maxAmmo() { return 6; }
        get maxMovementPoints() { return 9; }
        get vision() { return 5; }
    
        get unitClass() { return UnitClass.Air; }
        get moveType() { return MoveType.Air; }
        get armorType() { return ArmorType.Air; }
        
        get weapon() { return {
            primary: {
                name: 'Anti-Air Msl',
                targetMap: [0,0,2,2,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,55,65,65,80,65,120,120,120,0,0,0,0,0,0,0]
            },
            secondary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            }
        }}
    }

    export class Bomber extends UnitObject {
        get type() { return Bomber; }
        static readonly serial = Serial.next().value;

        get name() { return "Bomber"; }
        get shortName() { return "Bomber"; }
        get description() { return "A massively powerful plane that can attack both ground and naval units."; }
        get cost() { return 20000; }
    
        get maxGas() { return 99; }
        get maxAmmo() { return 6; }
        get maxMovementPoints() { return 7; }
        get vision() { return 3; }
    
        get unitClass() { return UnitClass.Air; }
        get moveType() { return MoveType.Air; }
        get armorType() { return ArmorType.Air; }
        
        get weapon() { return {
            primary: {
                name: 'Bomb',
                targetMap: [2,2,0,0,2,0],
                damageMap: [115,110,110,105,105,85,105,95,75,105,80,105,95,105,0,0,0,0,0,0,0,0,85,85,95,50,95,120,90]
            },
            secondary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            }
        }}
    }

    export class Stealth extends UnitObject {
        get type() { return Stealth; }
        static readonly serial = Serial.next().value;

        get name() { return "Stealth"; }
        get shortName() { return "Stealth"; }
        get description() { return "A powerful air unit that can /cloak/ and remain hidden until found by adjacent enemy units."; }
        get cost() { return 22000; }
    
        get maxGas() { return 60; }
        get maxAmmo() { return 6; }
        get maxMovementPoints() { return 6; }
        get vision() { return 3; }
    
        get unitClass() { return UnitClass.Air; }
        get moveType() { return MoveType.Air; }
        get armorType() { return ArmorType.Air; }

        get canHide() { return true; }
        
        get weapon() { return {
            primary: {
                name: 'Omni-Msl',
                targetMap: [2,2,2,2,2,0],
                damageMap: [95,90,90,85,80,50,75,70,55,75,55,85,75,85,45,55,55,65,55,85,95,105,45,65,55,40,85,105,70]
            },
            secondary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            }
        }}
    }

    export class Duster extends UnitObject {
        get type() { return Duster; }
        static readonly serial = Serial.next().value;

        get name() { return "Duster"; }
        get shortName() { return "Duster"; }
        get description() { return "A somewhat powerful plane that can attack both ground and air units."; }
        get cost() { return 13000; }
    
        get maxGas() { return 99; }
        get maxAmmo() { return 9; }
        get maxMovementPoints() { return 8; }
        get vision() { return 4; }
    
        get unitClass() { return UnitClass.Air; }
        get moveType() { return MoveType.Air; }
        get armorType() { return ArmorType.Air; }
        
        get weapon() { return {
            primary: {
                name: 'Machine Gun',
                targetMap: [1,1,1,2,0,0],
                damageMap: [55,45,45,18,15,5,8,5,1,15,5,20,20,15,40,45,45,55,45,75,90,95,0,0,0,0,0,0,5]
            },
            secondary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            }
        }}
    }

    export class SeaPlane extends UnitObject {
        get type() { return SeaPlane; }
        static readonly serial = Serial.next().value;

        get name() { return "Sea Plane"; }
        get shortName() { return "Seapl"; }
        get description() { return "A plane produced at sea by carriers. It can attack any unit."; }
        get cost() { return 15000; }
    
        get maxGas() { return 40; }
        get maxAmmo() { return 3; }
        get maxMovementPoints() { return 7; }
        get vision() { return 4; }
    
        get unitClass() { return UnitClass.Air; }
        get moveType() { return MoveType.Air; }
        get armorType() { return ArmorType.Air; }
        
        get weapon() { return {
            primary: {
                name: 'Missiles',
                targetMap: [2,2,2,2,2,0],
                damageMap: [90,85,85,80,80,45,75,65,55,70,50,80,70,75,45,55,55,65,55,85,95,95,45,65,55,40,85,105,55]
            },
            secondary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            }
        }}
    }

    export class BCopter extends UnitObject {
        get type() { return BCopter; }
        static readonly serial = Serial.next().value;

        get name() { return "B Copter"; }
        get shortName() { return "B Cptr"; }
        get description() { return "An air unit that can attack ground and naval units, as well as other helicopters."; }
        get cost() { return 9000; }
    
        get maxGas() { return 99; }
        get maxAmmo() { return 6; }
        get maxMovementPoints() { return 6; }
        get vision() { return 3; }
    
        get unitClass() { return UnitClass.Air; }
        get moveType() { return MoveType.Air; }
        get armorType() { return ArmorType.Heli; }
        
        get weapon() { return {
            primary: {
                name: 'Air-Gnd Msl',
                targetMap: [0,2,0,0,1,0],
                damageMap: [0,0,0,75,75,10,70,45,35,65,20,75,55,70,0,0,0,0,0,0,0,0,25,25,25,5,25,85,20]
            },
            secondary: {
                name: 'Machine Gun',
                targetMap: [2,1,0,2,0,0],
                damageMap: [75,65,65,30,30,1,8,8,1,25,1,35,25,20,0,0,0,0,0,65,85,0,0,0,0,0,0,0,0]
            }
        }}
    }

    export class TCopter extends UnitObject {
        get type() { return TCopter; }
        static readonly serial = Serial.next().value;

        get name() { return "T Copter"; }
        get shortName() { return "T Cptr"; }
        get description() { return "An air unit that can /carry 1/ infantry or mech unit, but has no attack capabilities."; }
        get cost() { return 5000; }
    
        get maxGas() { return 99; }
        get maxAmmo() { return 0; }
        get maxMovementPoints() { return 6; }
        get vision() { return 2; }
        get range() { return {min: -1, max: -1}; }  
        
        get canMoveAndAttack() { return false; }

        boardable(unit?: UnitObject): boolean {
            const max = 1;
            const boardTypes: (UnitType | undefined)[] = [
                Unit.Infantry, Unit.Mech,
            ];

            const full = (this._loadedUnits.length >= max);
            const generally = (!unit);
            const soldierUnit = (boardTypes.includes(unit?.type));
            return !full && (soldierUnit || generally);
        }

        unloadPosition(terrain: TerrainObject) {
            const types = [Terrain.Beach, Terrain.Port, Terrain.TempPort] as TerrainType[];
            return terrain.landTile || types.includes(terrain.type);
        }

        resupplyHeldUnits() { return false; } // T's aren't resuppliers
    
        get unitClass() { return UnitClass.Air; }
        get moveType() { return MoveType.Air; }
        get armorType() { return ArmorType.Heli; }
        
        get weapon() { return {
            primary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            },
            secondary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            }
        }}
    }

    export class Seeker extends UnitObject {
        get type() { return Seeker; }
        static readonly serial = Serial.next().value;

        get name() { return "Seeker"; }
        get shortName() { return "Seeker"; }
        get description() { return "An unmanned aerial unit. This unit can /explode/ at will, damaging all units within 3 spaces."; }
        get cost() { return 25000; }
    
        get maxGas() { return 45; }
        get maxAmmo() { return 0; }
        get maxMovementPoints() { return 7; }
        get vision() { return 1; }
        get range() { return {min: 0, max: 0}; }  
    
        get unitClass() { return UnitClass.Air; }
        get moveType() { return MoveType.Air; }
        get armorType() { return ArmorType.Air; }
        
        get weapon() { return {
            primary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            },
            secondary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            }
        }}
    }

    export class Battleship extends UnitObject {
        get type() { return Battleship; }
        static readonly serial = Serial.next().value;

        get name() { return "Battleship"; }
        get shortName() { return "B Ship"; }
        get description() { return "An extremely strong naval unit that can /launch indirect attacks after moving/."; }
        get cost() { return 25000; }
    
        get maxGas() { return 99; }
        get maxAmmo() { return 6; }
        get maxMovementPoints() { return 5; }
        get vision() { return 3; }
        get range() { return {min: 3, max: 5}; }  
    
        get unitClass() { return UnitClass.Naval; }
        get moveType() { return MoveType.Ship; }
        get armorType() { return ArmorType.Ship; }
        
        get weapon() { return {
            primary: {
                name: 'Cannon',
                targetMap: [2,2,0,0,2,0],
                damageMap: [75,70,70,70,70,65,65,50,40,70,55,75,75,65,0,0,0,0,0,0,0,0,45,50,65,65,75,95,55]
            },
            secondary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            }
        }}
    }

    export class Carrier extends UnitObject {
        get type() { return Carrier; }
        static readonly serial = Serial.next().value;

        get name() { return "Carrier"; }
        get shortName() { return "Carrier"; }
        get description() { return "A naval unit that can /carry 2/ air units and /produce/ seaplanes."; }
        get cost() { return 28000; }
    
        get maxGas() { return 99; }
        get maxAmmo() { return 4; }
        get maxMovementPoints() { return 5; }
        get vision() { return 4; }
        
        get materialsInsteadOfAmmo() { return true; }
        get ammoCanBeResupplied() { return false; }
        get canResupplyHeldUnits() { return true; }

        boardable(unit?: UnitObject): boolean {
            const max = 2;
            const full = (this._loadedUnits.length >= max);
            const generally = (!unit);
            const airUnit = (unit?.unitClass === UnitClass.Air);
            return !full && (airUnit || generally);
        }

        unloadPosition(terrain: TerrainObject) {
            return true;
        }
    
        get unitClass() { return UnitClass.Naval; }
        get moveType() { return MoveType.Ship; }
        get armorType() { return ArmorType.Ship; }
        
        get weapon() { return {
            primary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            },
            secondary: {
                name: 'AA Gun',
                targetMap: [0,0,1,1,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,35,35,35,40,40,45,55,55,0,0,0,0,0,0,0]
            }
        }}
    }

    export class Submarine extends UnitObject {
        get type() { return Submarine; }
        static readonly serial = Serial.next().value;

        get name() { return "Submarine"; }
        get shortName() { return "Sub"; }
        get description() { return "After /diving/, they remain hidden unless found by adjacent enemy units."; }
        get cost() { return 20000; }
    
        get maxGas() { return 70; }
        get maxAmmo() { return 6; }
        get maxMovementPoints() { return 6; }
        get vision() { return 5; }
    
        get unitClass() { return UnitClass.Naval; }
        get moveType() { return MoveType.Ship; }
        get armorType() { return ArmorType.Sub; }

        get canHide() { return true; }
        
        get weapon() { return {
            primary: {
                name: 'Torpedo',
                targetMap: [0,0,0,0,2,2],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,80,110,55,20,85,120,55]
            },
            secondary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            }
        }}
    }

    export class Cruiser extends UnitObject {
        get type() { return Cruiser; }
        static readonly serial = Serial.next().value;

        get name() { return "Cruiser"; }
        get shortName() { return "Cruiser"; }
        get description() { return "Cruisers are strong against subs and air units, and can /carry 2 copter units/."; }
        get cost() { return 16000; }
    
        get maxGas() { return 99; }
        get maxAmmo() { return 9; }
        get maxMovementPoints() { return 6; }
        get vision() { return 5; }

        get canResupplyHeldUnits() { return true; }

        boardable(unit?: UnitObject): boolean {
            const max = 2;
            const full = (this._loadedUnits.length >= max);
            const generally = (!unit);
            const copterTypes = [Unit.BCopter, Unit.TCopter] as (UnitType | undefined)[];
            const copterUnit = (copterTypes.includes(unit?.type));
            return !full && (copterUnit || generally);
        }

        unloadPosition(terrain: TerrainObject) {
            return true;
        }
    
        get unitClass() { return UnitClass.Naval; }
        get moveType() { return MoveType.Ship; }
        get armorType() { return ArmorType.Ship; }
        
        get weapon() { return {
            primary: {
                name: 'Anti-Ship Msl',
                targetMap: [0,0,0,0,1,2],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,38,38,95,28,40,85,35]
            },
            secondary: {
                name: 'AA Gun',
                targetMap: [0,0,2,2,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,105,105,105,105,105,120,120,120,0,0,0,0,0,0,0]
            }
        }}
    }

    export class Lander extends UnitObject {
        get type() { return Lander; }
        static readonly serial = Serial.next().value;

        get name() { return "Lander"; }
        get shortName() { return "Lander"; }
        get description() { return "Landers can /carry 2 ground units/. If the lander sinks, the units vanish."; }
        get cost() { return 10000; }
    
        get maxGas() { return 99; }
        get maxAmmo() { return 0; }
        get maxMovementPoints() { return 6; }
        get vision() { return 1; }
        get range() { return {min: -1, max: -1}; }  
        
        get canMoveAndAttack() { return false; }

        boardable(unit?: UnitObject): boolean {
            const max = 2;
            const full = (this._loadedUnits.length >= max);
            const generally = (!unit);
            const groundUnit = (unit?.unitClass === UnitClass.Ground);
            return !full && (groundUnit || generally);
        }

        unloadPosition(terrain: TerrainObject) {
            const types = [Terrain.Beach, Terrain.Port, Terrain.TempPort] as TerrainType[];
            return types.includes(terrain.type);
        }
    
        get unitClass() { return UnitClass.Naval; }
        get moveType() { return MoveType.Transport; }
        get armorType() { return ArmorType.Ship; }
        
        get weapon() { return {
            primary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            },
            secondary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            }
        }}
    }

    export class GunBoat extends UnitObject {
        get type() { return GunBoat; }
        static readonly serial = Serial.next().value;

        get name() { return "Gun Boat"; }
        get shortName() { return "G Boat"; }
        get description() { return "A unit that can /carry 1/ foot soldier and attack other naval units."; }
        get cost() { return 6000; }
    
        get maxGas() { return 99; }
        get maxAmmo() { return 1; }
        get maxMovementPoints() { return 7; }
        get vision() { return 2; }

        boardable(unit?: UnitObject): boolean {
            const max = 1;
            const full = (this._loadedUnits.length >= max);
            const generally = (!unit);
            const soldierUnit = (unit?.soldierUnit);
            return !full && (soldierUnit || generally);
        }

        unloadPosition(terrain: TerrainObject) {
            const types = [Terrain.Beach, Terrain.Port, Terrain.TempPort] as TerrainType[];
            return types.includes(terrain.type);
        }
    
        get unitClass() { return UnitClass.Naval; }
        get moveType() { return MoveType.Transport; }
        get armorType() { return ArmorType.Ship; }
        
        get weapon() { return {
            primary: {
                name: 'Anti-Ship Msl',
                targetMap: [0,0,0,0,1,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,40,40,40,55,75,20]
            },
            secondary: {
                name: '',
                targetMap: [0,0,0,0,0,0],
                damageMap: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            }
        }}
    }
    //end
}