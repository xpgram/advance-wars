import { Terrain } from "../scripts/battle/map/Terrain";
import { Unit } from "../scripts/battle/Unit";

const { Plain, Road, Wood, Mountain, Wasteland, Ruins, Bridge, RiverBridge, River, Sea, Beach, RoughSea, Mist, Reef, Fire, Meteor, Plasma, HQ, City, ComTower, Radar, Silo, Factory, Airport, Port, TempAirpt, TempPort } = Terrain;
const Tserials = [ Plain, Road, Wood, Mountain, Wasteland, Ruins, Bridge, RiverBridge, River, Sea, Beach, RoughSea, Mist, Reef, Fire, Meteor, Plasma, HQ, City, ComTower, Radar, Silo, Factory, Airport, Port, TempAirpt, TempPort ].map(t => t.serial);
const [ pln, rod, wod, mtn, wst, rui, brg, rbg, riv, sea, bch, rgh, mst, ref, fir, met, pls, hq, cty, com, rad, sil, fct, apt, prt, tap, tpr ] = Tserials;

const { Infantry, Mech, Bike, Recon, Flare, AntiAir, Tank, MdTank, WarTank, Artillery, AntiTank, Rockets, Missiles, Rig, Fighter, Bomber, Stealth, Duster, SeaPlane, BCopter, TCopter, Seeker, Battleship, Carrier, Submarine, Cruiser, Lander, GunBoat } = Unit;


export const data = {
  "name": "DevRoom Small 2P",
  "players": 2,
  "size": {"width": 7, "height": 7},
  "map": [
    [pln,apt,wod,wod,com,riv,fir],
    [cty,hq ,fct,wod,rad,rbg,wod],
    [pln,fct,met,prt,sea,tpr,wst],
    [pls,pls,pls,ref,rgh,mst,wst],
    [met,cty,mtn,mtn,sea,mst,tap],
    [cty,hq ,rod,rod,brg,rui,sil],
    [fct,fct,pln,fct,sea,bch,sea],
  ],
  "owners": [
    {"location": {"x": 1, "y": 1}, "player": 0},
    {"location": {"x": 0, "y": 1}, "player": 0},
    {"location": {"x": 2, "y": 1}, "player": 0},
    {"location": {"x": 1, "y": 0}, "player": 0},
    {"location": {"x": 1, "y": 2}, "player": 0},

    {"location": {"x": 1, "y": 5}, "player": 1},
    {"location": {"x": 0, "y": 5}, "player": 1},
    {"location": {"x": 1, "y": 6}, "player": 1},
    {"location": {"x": 0, "y": 6}, "player": 1},
    {"location": {"x": 1, "y": 4}, "player": 1},
  ],
  "predeploy": [
  ]
}