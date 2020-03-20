/*ClassName*/: class /*ClassName*/Unit extends UnitObject {
    get type() { return /*ClassName*/Unit; }
    get serial() { return /*Serial*/; }
    get name() { return "/*Name*/"; }
    get shortName() { return "/*ShortName*/"; }
    get description() { return "/*Description*/"; }

    get maxGas() { return /*MaxGas*/; }
    get maxAmmo() { return /*MaxAmmo*/; }
    get maxMovementPoints() { return /*MovePoints*/; }
    get vision() { return /*Vision*/; }
    /*NewBlockBreak*/
    get soldierUnit() { return true; }  /*SoldierUnit*/
    get materialInsteadOfAmmo() { return true; }  /*MaterialInstead*/

    get unitClass() { return UnitClass./*UnitClass*/; }
    get moveType() { return MoveType./*MoveType*/; }
    get armorType() { return ArmorType./*ArmorType*/; }

    protected readonly armorTargetMatrix = [
        /*TargetMatrix*/
    ];

    protected readonly baseDamageMatrix = [
        /*DamageMatrix*/
    ];
},