import { Terrain } from "../scripts/battle/map/Terrain";
import { Unit } from "../scripts/battle/Unit";

const { Plain, Road, Wood, Mountain, Wasteland, Ruins, Bridge, River, Sea, Beach, RoughSea, Mist, Reef, Fire, Meteor, Plasma, HQ, City, ComTower, Radar, Silo, Factory, Airport, Port, TempAirpt, TempPort } = Terrain;
const Tserials = [ Plain, Road, Wood, Mountain, Wasteland, Ruins, Bridge, River, Sea, Beach, RoughSea, Mist, Reef, Fire, Meteor, Plasma, HQ, City, ComTower, Radar, Silo, Factory, Airport, Port, TempAirpt, TempPort ].map(t => t.serial);
const [ pln, rod, wod, mtn, wst, rui, brg, riv, sea, bch, rgh, mst, ref, fir, met, pls, hq, cty, com, rad, sil, fct, apt, prt, tap, tpr ] = Tserials;

const { Infantry, Mech, Bike, Recon, Flare, AntiAir, Tank, MdTank, WarTank, Artillery, AntiTank, Rockets, Missiles, Rig, Fighter, Bomber, Stealth, Duster, SeaPlane, BCopter, TCopter, Seeker, Battleship, Carrier, Submarine, Cruiser, Lander, GunBoat } = Unit;


export const data = {
  "name": "Metro Island",
  "players": 2,
  "size": {"width": 16, "height": 15},
  "map": [
    [sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea],
    [sea,sea,sea,sea,sea,pln,wod,wst,wst,wod,pln,sea,sea,sea,sea,sea],
    [sea,sea,sea,pln,mtn,pln,pln,pln,pln,pln,pln,mtn,pln,sea,sea,sea],
    [sea,sea,wod,cty,mtn,wod,cty,cty,cty,cty,wod,mtn,cty,wod,sea,sea],
    [sea,sea,wod,rod,wod,mtn,rod,mtn,mtn,rod,mtn,wod,rod,wod,sea,sea],
    [sea,sea,fct,rod,mtn,rod,rod,rod,rod,rod,rod,mtn,rod,fct,sea,sea],
    [sea,fct,rod,rod,mtn,rod,cty,wod,wod,cty,rod,mtn,rod,rod,fct,sea],
    [sea,hq ,fct,rod,mtn,rod,cty,wst,wst,cty,rod,mtn,rod,fct,hq ,sea],
    [sea,fct,wod,rod,rod,rod,wod,mtn,mtn,wod,rod,rod,rod,wod,fct,sea],
    [sea,pln,pln,sil,wst,cty,mtn,mtn,mtn,mtn,cty,wst,sil,pln,pln,sea],
    [sea,cty,cty,pln,wod,wod,mtn,wod,wod,mtn,wod,wod,pln,cty,cty,sea],
    [sea,sea,sea,mtn,sea,sea,mtn,pln,pln,mtn,sea,sea,mtn,sea,sea,sea],
    [sea,sea,pln,sea,sea,sea,sea,com,com,sea,sea,sea,sea,pln,sea,sea],
    [sea,sea,sea,sea,sea,ref,sea,sea,sea,sea,ref,sea,sea,sea,sea,sea],
    [sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea,sea],
  ],
  "owners": [
    {"location": {"x": 1, "y": 7}, "player": 0},
    {"location": {"x": 1, "y": 6}, "player": 0},
    {"location": {"x": 1, "y": 8}, "player": 0},
    {"location": {"x": 2, "y": 7}, "player": 0},
    {"location": {"x": 2, "y": 5}, "player": 0},
    {"location": {"x": 1, "y":10}, "player": 0},
    {"location": {"x": 2, "y":10}, "player": 0},
    {"location": {"x": 3, "y": 3}, "player": 0},
    {"location": {"x": 5, "y": 9}, "player": 0},

    {"location": {"x":14, "y": 7}, "player": 1},
    {"location": {"x":14, "y": 6}, "player": 1},
    {"location": {"x":14, "y": 8}, "player": 1},
    {"location": {"x":13, "y": 7}, "player": 1},
    {"location": {"x":13, "y": 5}, "player": 1},
    {"location": {"x":14, "y":10}, "player": 1},
    {"location": {"x":13, "y":10}, "player": 1},
    {"location": {"x":12, "y": 3}, "player": 1},
    {"location": {"x":10, "y": 9}, "player": 1},
  ],
  "predeploy": [
  ]
}