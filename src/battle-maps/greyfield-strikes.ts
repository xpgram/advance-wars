import { Terrain } from "../scripts/battle/map/Terrain";
import { Unit } from "../scripts/battle/Unit";

const { Plain, Sea, Wood, Mountain, Road, City, Factory, Port, Beach, RoughSea, Reef, HQ} = Terrain;
const Ttypes = [ Plain, Sea, Wood, Mountain, Road, City, Factory, Port, Beach, RoughSea, Reef, HQ ];
const Tserials = Ttypes.map( t => t.serial );
const [ pln, sea, wd, mtn, rd, cty, fct, prt, bch, rgh, ref, hq ] = Tserials;

const { Infantry, Mech, Rig, Tank, MdTank, AntiAir, Artillery, Rockets, Missiles, GunBoat, Lander, Carrier, Cruiser, Battleship, Submarine } = Unit;
const Utypes = [ Infantry, Mech, Rig, Tank, MdTank, AntiAir, Artillery, Rockets, Missiles, GunBoat, Lander, Carrier, Cruiser, Battleship, Submarine ];
const Userials = Utypes.map( u => u.serial );
const [ inf, mch, rig, tnk, mdt, aai, art, rck, msl, gnb, lnd, car, cru, btl, sub ] = Userials;


export const data = {
  "name": "DoR C13: Greyfield Strikes",
  "players": 3,
  "size": {"width": 20, "height": 14},
  "map": [
    [sea,sea,ref,sea,cty, rd, rd, rd, rd, rd, rd,fct, rd,pln, rd,cty, wd,pln,pln, hq],
    [sea,sea,sea,sea,bch,bch,bch,bch,sea,prt, rd, rd, rd, rd, rd, rd, rd, rd,pln, rd],
    [sea,ref,sea,sea,sea,sea,sea,sea,sea,prt, rd, wd,cty,mtn,bch,bch,bch, rd,mtn, rd],
    [sea,sea,sea,sea,cty, rd, rd,cty, rd, rd, rd,mtn,sea,sea,sea,sea,sea, rd, rd, rd],
    [sea,sea,sea,sea,bch,bch,sea,sea,mtn,sea,sea,sea,sea,sea,sea,mtn,sea,mtn,cty, rd],
    [bch,pln,bch,sea,sea,sea,sea,mtn,sea,sea,sea,sea,mtn,sea,sea,sea,sea,sea,mtn,cty],
    [cty,cty,cty,bch,sea,sea,sea,sea,sea,sea,sea,prt,pln,cty,sea,sea,sea,sea,sea,mtn],
    [bch,pln,bch,sea,sea,sea,rgh,sea,rgh,sea,sea,bch,fct,bch,sea,sea,sea,sea,sea,sea],
    [sea,bch,sea,sea,rgh,rgh,rgh,sea,sea,sea,sea,bch,pln,bch,sea,sea,sea,sea,sea,sea],
    [sea,sea,sea,sea,sea,ref,rgh,rgh,sea,sea,ref,sea,sea,sea,sea,sea,sea,sea,sea,sea],
    [sea,sea,sea,ref,sea,sea,sea,rgh,rgh,sea,sea,sea,sea,sea,sea,sea,sea,bch,fct,prt],
    [sea,sea,sea,sea,sea,rgh,rgh,bch,rgh,rgh,sea,mtn,sea,sea,sea,sea,bch,cty,pln,fct],
    [sea,mtn,sea,sea,rgh,sea,bch,cty,bch,rgh,sea,sea,sea,sea,sea,bch,pln,cty,cty,cty],
    [sea,sea,sea,rgh,rgh,bch,cty,fct,cty,bch,rgh,sea,sea,sea,bch,cty,cty,pln,cty, hq],
  ],
  "owners": [
    {"location": {"x": 9, "y": 1}, "player": 1},
    {"location": {"x": 9, "y": 2}, "player": 1},
    {"location": {"x": 7, "y": 3}, "player": 1},
    {"location": {"x":11, "y": 0}, "player": 1},
    {"location": {"x":12, "y": 2}, "player": 1},
    {"location": {"x":15, "y": 0}, "player": 1},
    {"location": {"x":19, "y": 0}, "player": 1},
    {"location": {"x":18, "y": 4}, "player": 1},
    {"location": {"x":19, "y": 5}, "player": 1},

    {"location": {"x":19, "y":10}, "player": 0},
    {"location": {"x":18, "y":10}, "player": 0},
    {"location": {"x":17, "y":11}, "player": 0},
    {"location": {"x":19, "y":11}, "player": 0},
    {"location": {"x":17, "y":12}, "player": 0},
    {"location": {"x":18, "y":12}, "player": 0},
    {"location": {"x":19, "y":12}, "player": 0},
    {"location": {"x":15, "y":13}, "player": 0},
    {"location": {"x":16, "y":13}, "player": 0},
    {"location": {"x":18, "y":13}, "player": 0},
    {"location": {"x":19, "y":13}, "player": 0},
  ],
  "predeploy": [
    {"location": {"x": 1, "y": 1}, "serial": car, "player": 1},
    {"location": {"x": 4, "y": 1}, "serial": gnb, "player": 1},
    {"location": {"x": 6, "y": 1}, "serial": lnd, "player": 1},
    {"location": {"x": 8, "y": 0}, "serial": inf, "player": 1},
    {"location": {"x":12, "y": 1}, "serial": tnk, "player": 1},
    {"location": {"x":17, "y": 0}, "serial": mdt, "player": 1},
    {"location": {"x":19, "y": 0}, "serial": msl, "player": 1},
    {"location": {"x": 7, "y": 2}, "serial": btl, "player": 1},
    {"location": {"x":19, "y": 2}, "serial": aai, "player": 1},
    {"location": {"x": 7, "y": 3}, "serial": mch, "player": 1},
    {"location": {"x":10, "y": 3}, "serial": art, "player": 1},
    {"location": {"x":14, "y": 3}, "serial": gnb, "player": 1},
    {"location": {"x":18, "y": 4}, "serial": msl, "player": 1},
    {"location": {"x": 3, "y":11}, "serial": btl, "player": 1},

    {"location": {"x":18, "y":13}, "serial": rig, "player": 0},
    {"location": {"x":16, "y":13}, "serial": inf, "player": 0},
    {"location": {"x":14, "y":13}, "serial": gnb, "player": 0},
    {"location": {"x":15, "y":12}, "serial": lnd, "player": 0},
    {"location": {"x":17, "y":12}, "serial": inf, "player": 0},
    {"location": {"x":15, "y":11}, "serial": car, "player": 0},
    {"location": {"x":17, "y":10}, "serial": gnb, "player": 0},
    {"location": {"x":16, "y": 9}, "serial": cru, "player": 0},
    {"location": {"x":18, "y": 9}, "serial": btl, "player": 0},
    {"location": {"x":17, "y": 8}, "serial": sub, "player": 0},

    {"location": {"x": 4, "y": 8}, "serial": gnb, "player": 2},
    {"location": {"x": 6, "y":10}, "serial": gnb, "player": 2},
    {"location": {"x":12, "y": 6}, "serial": rig, "player": 2},
  ]
}