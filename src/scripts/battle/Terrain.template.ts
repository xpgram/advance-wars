    /*Class*/: class /*Class*/Tile extends TerrainObject {
        get type() { return /*Class*/Tile; }
/**/        get serial() { return /*serial*/; }
/**/        get landTile() { return /*landTile*/; }
/**/        get shallowWaterSourceTile() { return /*shallowWaterSourceTile*/; }
/**/        shallowWater = false;
/**/
/**/        get name() { return "/*name*/"; }
/**/        get shortName() { return "/*shortName*/"; }
/**/        get description() { return "/*description*/"; }
/**/        get defenseRating() { return /*defenseRating*/; }
/**/        get generatesIncome() { return /*generatesIncome*/; }
/**/        get repairType() { return UnitClass./*repairType*/; }
/**/        get conceals() { return /*conceals*/; }
/**/        get vision() { return /*vision*/; }
/**/        faction: Faction = Faction.Neutral;
/**/
        private _value = /*valueMax*/;
        get value(): number { return this._value; }
        set value(n) { this._value = Common.confine(n, 0, /*valueMax*/); }
/**/
        movementCost(type: MoveType) {
            let costs = [/*inf*/,/*mch*/,/*trA*/,/*trB*/,/*trd*/,/*air*/,/*shp*/,/*trp*/];
            return costs[type];
        }

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
            let variant = ;
            let sprite = new PIXI.Sprite(Terrain.sheet.textures[variant]);
            this.layers.push({object: sprite, name: 'bottom'});
        }
    },