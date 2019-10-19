/**//*Class*/: class /*Class*/Tile extends TerrainObject {
    get type() { return /*Class*/Tile; }/***/
/**/    get serial() { return /*serial*/; }/***/
/**/    get landTile() { return /*landTile*/; }/***/
/**/    get shallowWaterSourceTile() { return /*shallowWaterSourceTile*/; }/***/
/**/    shallowWater = false;/***/

/**/    get name() { return "/*name*/"; }/***/
/**/    get shortName() { return "/*shortName*/"; }/***/
/**/    get description() { return "/*description*/"; }/***/
/**/    get defenseRating() { return /*defenseRating*/; }/***/
/**/    get generatesIncome() { return /*generatesIncome*/; }/***/
/**/    get repairType() { return UnitClass./*repairType*/; }/***/
/**/    get conceals() { return /*conceals*/; }/***/
/**/    get vision() { return /*vision*/; }/***/

/**/    movementCost(type) {
        let costs = [0,0,0,0,0,0,0,0];
        return costs[type];
    }
/***/
/**/    _faction = Faction.Neutral;
    get faction() { return this._faction; }
    set faction(faction) { this._faction = faction; }
/***/
/**/    _value = /*valueMax*/;
    get value() { return this._value; }
    set value(n) { this._value = Common.confine(n, 0, /*valueMax*/); }
/***/
/**/    constructor(prevTile?: TerrainObject) {
        super();
    }

    create() {
        let variant: string, sprite: PIXI.Sprite, container: PIXI.Container;
        
        variant = ;
        sprite = new PIXI.Sprite(Terrain.sheet.textures[variant]);
        this.layers.push({object: sprite, name: 'bottom'});
    }
},/***/

/*
I wanna go to bed, so I'll describe where I'm at:

TerrainTypes has //start and //end tags
Python will jump to that spot
It will then copy-paste the above template 28 times, filling in the necessary bits
It needs to know to omit properties that are readonly default
Just like VoidTile in TerrainTypes already does.
Terrain.ts, the abstract, leaves some properties abstract instead of defaulted
as clues to which must always be written in.
Some properties are multiline so all properties use /** / and /*** / to denote
when a token begins and ends.
This way, I can intuitively decide whether to include a property in the class definition at all.
*/