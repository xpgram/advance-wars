import { PIXI } from "../../../constants";
import { Game } from "../.."
import { UnitObject } from "./UnitObject";
import { AttackMethod, MoveType, ArmorType, UnitClass } from "./EnumTypes";

export const Unit = {
    spritesheet: 'UnitSpritesheet',
    get sheet() { return Game.scene.resources[ Unit.spritesheet ].spritesheet as PIXI.Spritesheet; },

    //start
    //end
}