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
    get range() { return {min: /*RangeMin*/, max: /*RangeMax*/}; }  /*Range*/
    /*UnitPropertiesBlockBreak*/
    get soldierUnit() { return true; }  /*SoldierUnit*/
    get materialsInsteadOfAmmo() { return true; }  /*MaterialInstead*/
    get canMoveAndAttack() { return false; }  /*MoveAndAttack*/

    get unitClass() { return UnitClass./*UnitClass*/; }
    get moveType() { return MoveType./*MoveType*/; }
    get armorType() { return ArmorType./*ArmorType*/; }
    
    get weapon() { return {
        primary: {
            name: '/*PrimName*/',
            targetMap: /*PrimTargetMap*/,
            damageMap: /*PrimDamageMap*/
        },
        secondary: {
            name: '/*SubName*/',
            targetMap: /*SubTargetMap*/,
            damageMap: /*SubDamageMap*/
        }
    }}
},