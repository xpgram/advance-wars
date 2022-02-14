import { Terrain } from "../scripts/battle/map/Terrain";
import { Unit } from "../scripts/battle/Unit";

const { Plain, Sea, Wood, Mountain, Road, Bridge, City, Factory, Airport, Port, Beach, RoughSea, Reef, Fire, ComTower, Radar, HQ} = Terrain;
const Ttypes = [ Plain, Sea, Wood, Mountain, Road, Bridge, City, Factory, Airport, Port, Beach, RoughSea, Reef, Fire, ComTower, Radar, HQ ];
const Tserials = Ttypes.map( t => t.serial );
const [ pln, sea, wod, mtn, rod, bdg, cty, fct, apt, prt, bch, rgh, ref, fir, com, rad, hq ] = Tserials;

const { Infantry, Mech, Bike, Rig, Flare, Tank, MdTank, AntiAir, Artillery, Rockets, Missiles, Fighter, BCopter, TCopter, GunBoat, Lander, Carrier, Cruiser, Battleship, Submarine } = Unit;
const Utypes = [ Infantry, Mech, Bike, Rig, Flare, Tank, MdTank, AntiAir, Artillery, Rockets, Missiles, Fighter, BCopter, TCopter, GunBoat, Lander, Carrier, Cruiser, Battleship, Submarine ];
const Userials = Utypes.map( u => u.serial );
const [ inf, mch, bik, rig, flr, tnk, mdt, aai, art, rck, msl, fgt, bcp, tcp, gnb, lnd, car, cru, btl, sub ] = Userials;


export const data = {
  "name": "Land's End",
  "players": 4,
  "size": {"width": 32, "height": 27},
  "map": [
    [pln,wod,wod,wod,rod,wod,mtn,mtn,wod,wod,pln,pln,pln,wod,wod,mtn,mtn,mtn,mtn,mtn,mtn,mtn,pln,pln,wod,pln,pln,pln,pln,pln,pln,pln],
    [pln,pln,pln,wod,rod,pln,wod,mtn,mtn,wod,pln,cty,pln,fct,pln,wod,mtn,mtn,mtn,mtn,pln,pln,cty,cty,pln,wod,pln,pln,wod,wod,wod,pln],
    [pln,pln,hq ,pln,rod,pln,wod,mtn,mtn,mtn,rod,rod,rod,rod,rod,rod,rod,rod,rod,rod,rod,rod,rod,rod,rod,rod,rod,cty,pln,pln,wod,wod],
    [pln,pln,pln,pln,rod,cty,pln,wod,mtn,mtn,rod,pln,pln,pln,pln,pln,mtn,mtn,fct,pln,rad,pln,pln,cty,pln,pln,rod,pln,pln,pln,pln,wod],
    [pln,wod,pln,cty,rod,pln,pln,pln,pln,pln,rod,pln,pln,sea,sea,sea,mtn,mtn,pln,pln,pln,pln,pln,pln,cty,pln,fct,pln,pln,cty,pln,wod],
    [pln,wod,wod,pln,rod,apt,pln,wod,cty,cty,rod,pln,sea,sea,sea,sea,sea,sea,pln,wod,pln,cty,cty,pln,wod,fct, hq,fct,pln,pln,pln,wod],
    [sea,pln,pln,fct,rod,rod,rod,rod,rod,rod,rod,wod,sea,sea,fir,sea,sea,sea,sea,sea,wod,wod,pln,wod,pln,pln,fct,pln,pln,pln,wod,wod],
    [sea,sea,pln,pln,wod,pln,pln,pln,wod,mtn,rod,pln,sea,sea,sea,ref,sea,sea,sea,sea,sea,sea,pln,pln,pln,apt,pln,apt,pln,pln,wod,wod],
    [sea,sea,sea,pln,wod,wod,cty,cty,wod,mtn,rod,pln,fct,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,pln,pln,pln,pln,pln,wod,wod,wod],
    [sea,sea,bdg,pln,pln,wod,wod,wod,wod,mtn,rod,cty,mtn,pln,pln,sea,sea,sea,ref,sea,sea,sea,sea,sea,bch,pln,pln,pln,wod,sea,sea,wod],
    [sea,sea,bdg,sea,pln,pln,pln,wod,wod,wod,rod,rod,rod,rod,pln,mtn,sea,sea,sea,sea,sea,sea,sea,sea,sea,bch,bch,bch,wod,pln,wod,wod],
    [sea,sea,bdg,sea,bdg,sea,pln,pln,wod,wod,mtn,mtn,mtn,rod,pln,mtn,pln,pln,sea,sea,ref,sea,sea,sea,sea,sea,sea,sea,sea,pln,pln,pln],
    [sea,rod,rod,bdg,bdg,sea,pln,pln,pln,wod,cty,mtn,mtn,rod,cty,mtn,mtn,pln,pln,sea,sea,sea,sea,sea,sea,ref,sea,sea,sea,sea,wod,pln],
    [sea,cty,mtn,sea,bdg,sea,sea,pln,pln,pln,wod,wod,mtn,rod,rod,rod,cty,pln,pln,pln,prt,sea,sea,ref,sea,sea,sea,sea,sea,sea,pln,wod],
    [sea,cty,pln,sea,pln,sea,sea,sea,sea,pln,pln,wod,wod,cty,mtn,mtn,pln,cty,pln,fct,pln,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,wod],
    [sea,sea,bdg,pln,fct,wod,sea,sea,sea,sea,pln,pln,pln,wod,wod,wod,pln,pln,fct,pln,fct,sea,sea,bch,sea,sea,sea,sea,sea,sea,sea,pln],
    [sea,sea,sea,fct,hq ,fct,sea,sea,sea,sea,sea,pln,pln,pln,pln,wod,wod,wod,pln,fct,pln,pln,pln,pln,bch,bch,sea,sea,sea,sea,sea,sea],
    [sea,cty,bdg,pln,fct,pln,prt,sea,sea,sea,sea,sea,sea,pln,pln,pln,pln,wod,wod,wod,wod,pln,apt,pln,pln,wod,bch,sea,sea,sea,sea,sea],
    [sea,cty,sea,sea,bch,bch,sea,sea,sea,sea,sea,sea,sea,sea,pln,pln,pln,pln,wod,wod,wod,pln,pln,pln,wod,pln, hq,bch,sea,sea,sea,sea],
    [sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,pln,pln,cty,pln,wod,pln,pln,wod,pln,pln,pln,wod,bch,sea,sea,sea],
    [sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,bch,pln,pln,pln,wod,pln,bch,bch,pln,wod,bch,sea,sea,sea,sea],
    [sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,bch,pln,pln,wod,wod,sea,sea,bch,bch,sea,sea,sea,sea,sea],
    [sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,bch,pln,wod,wod,pln,sea,sea,sea,sea,sea,sea,sea,sea,sea],
    [sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,pln,pln,wod,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea],
    [sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,pln,pln,pln,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea],
    [sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,pln,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea],
    [sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea],
  ],
  "owners": [
    {"location": {"x":27, "y": 2}, "player": 1},
    {"location": {"x":18, "y": 3}, "player": 1},
    {"location": {"x":23, "y": 3}, "player": 1},
    {"location": {"x":24, "y": 4}, "player": 1},
    {"location": {"x":26, "y": 4}, "player": 1},
    {"location": {"x":29, "y": 4}, "player": 1},
    {"location": {"x":21, "y": 5}, "player": 1},
    {"location": {"x":22, "y": 5}, "player": 1},
    {"location": {"x":25, "y": 5}, "player": 1},
    {"location": {"x":26, "y": 5}, "player": 1},
    {"location": {"x":27, "y": 5}, "player": 1},
    {"location": {"x":26, "y": 6}, "player": 1},
    {"location": {"x":25, "y": 7}, "player": 1},
    {"location": {"x":27, "y": 7}, "player": 1},

    // {"location": {"x": 3, "y": 4}, "player": 0},
    // {"location": {"x": 3, "y": 6}, "player": 0},
    {"location": {"x":14, "y":12}, "player": 0},
    {"location": {"x":16, "y":13}, "player": 0},
    {"location": {"x":17, "y":14}, "player": 0},
    {"location": {"x":19, "y":14}, "player": 0},
    {"location": {"x":18, "y":15}, "player": 0},
    {"location": {"x":20, "y":15}, "player": 0},
    {"location": {"x":19, "y":16}, "player": 0},
    {"location": {"x":26, "y":18}, "player": 0},
    {"location": {"x":20, "y":13}, "player": 0},

    {"location": {"x": 2, "y": 2}, "player": 2},
    {"location": {"x": 3, "y": 4}, "player": 2},
    {"location": {"x": 3, "y": 6}, "player": 2},
    {"location": {"x": 5, "y": 3}, "player": 2},
    {"location": {"x": 5, "y": 5}, "player": 2},
    {"location": {"x": 6, "y": 8}, "player": 2},
    {"location": {"x": 7, "y": 8}, "player": 2},

    {"location": {"x": 4, "y":16}, "player": 3},
    {"location": {"x": 4, "y":17}, "player": 3},
    {"location": {"x": 4, "y":15}, "player": 3},
    {"location": {"x": 3, "y":16}, "player": 3},
    {"location": {"x": 5, "y":16}, "player": 3},
    {"location": {"x": 6, "y":17}, "player": 3},
    {"location": {"x": 1, "y":17}, "player": 3},
    {"location": {"x": 1, "y":18}, "player": 3},
  ],
  "predeploy": [
    {"location": {"x":26, "y": 5}, "serial": rck, "player": 1},
    {"location": {"x":25, "y": 4}, "serial": mdt, "player": 1},

    {"location": {"x":23, "y": 7}, "serial": inf, "player": 0},
    {"location": {"x":23, "y": 6}, "serial": rig, "player": 0},
    {"location": {"x":22, "y": 7}, "serial": bik, "player": 0},
    {"location": {"x":24, "y": 8}, "serial": tnk, "player": 0},

    {"location": {"x":22, "y":14}, "serial": btl, "player": 0},
    {"location": {"x":21, "y":15}, "serial": car, "player": 0},
    {"location": {"x":25, "y":15}, "serial": sub, "player": 0},
    {"location": {"x":24, "y":16}, "serial": gnb, "player": 0},
    {"location": {"x":23, "y":15}, "serial": lnd, "player": 0},
    {"location": {"x":22, "y":16}, "serial": mdt, "player": 0},
    {"location": {"x":21, "y":16}, "serial": tnk, "player": 0},
    {"location": {"x":23, "y":17}, "serial": flr, "player": 0},
    {"location": {"x":20, "y":17}, "serial": fgt, "player": 0},
    {"location": {"x":20, "y":14}, "serial": tcp, "player": 0},
    {"location": {"x":19, "y":14}, "serial": mch, "player": 0},
  ]
}