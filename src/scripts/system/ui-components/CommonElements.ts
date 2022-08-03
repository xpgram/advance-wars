import { Game } from "../../..";
import { PIXI } from "../../../constants";
import { Facing } from "../../battle/EnumTypes";
import { Color } from "../../color/Color";
import { Palette } from "../../color/ColorPalette";
import { HexColor } from "../../color/ColorTypes";
import { UiPageButton } from "./UiPageButton";


/** A package service which describes the construction of commonly asked for UI elements. */
export module CommonElements {

  // TODO Define common ui-component descriptions here.
  // This is where the concept of a 'shop page button' is formally defined.
  // This module could get pretty large. I wonder if I should split anything.

  export module CommandMenu {

  }

  export module TroopConstructionMenu {

    export function pageChangeButton(dir: Facing): UiPageButton {
      
      function draw(fill: HexColor, line: HexColor): PIXI.Texture {
        const g = new PIXI.Graphics();

        const w = 28;
        const h = 14;
        const border = 1;
        const lgborder = 3;

        const arrowSize = 5;
        
        g.beginFill(line)
         .drawRect(0,0,w,h)
         .endFill();

        g.beginFill(fill)
          .drawRect(
            lgborder,
            border,
            w - lgborder - border,
            h - 2*border
          )
          .endFill();
        
        g.lineStyle(2, line, 1)
          .moveTo(w/2 + arrowSize/2, h/2 - arrowSize)
          .lineTo(w/2 - arrowSize/2, h/2)
          .lineTo(w/2 + arrowSize/2, h/2 + arrowSize)
          .endFill();

        return Game.renderer.generateTexture(g);
      }

      const baseColor = Color.adjustHSV(Palette.caribbean_green, 0, .7, .7);
      const borderColor = Color.adjustHSV(baseColor, 0, .8, .6);

      const hoverColor = Color.adjustHSV(baseColor, 0, 1, 1.20);
      const hoverBorder = Color.adjustHSV(hoverColor, 0, .8, .6);

      const depressColor = Color.adjustHSV(baseColor, 0, 1, 1.15);
      const depressBorder = Color.adjustHSV(depressColor, 0, .8, .6);

      const disabledColor = Color.adjustHSV(baseColor, 0, 0, 1);
      const disabledBorder = Color.adjustHSV(disabledColor, 0, 1, .6);

      const enabled   = draw(baseColor, borderColor);
      const disabled  = draw(disabledColor, disabledBorder);
      const hovered   = draw(hoverColor, hoverBorder);
      const depressed = draw(depressColor, depressBorder);

      return new UiPageButton(dir, {
        enabled,
        disabled,
        hovered,
        depressed,
      });
    }

  }

}