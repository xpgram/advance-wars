import { Game } from "../../..";
import { PIXI } from "../../../constants";
import { Facing } from "../../battle/EnumTypes";
import { fonts } from "../../battle/ui-windows/DisplayInfo";
import { Color } from "../../color/Color";
import { Palette } from "../../color/ColorPalette";
import { HexColor } from "../../color/ColorTypes";
import { UiBinaryLamp } from "./UiBinaryLamp";
import { UiComponent } from "./UiComponent";
import { UiPageButton } from "./UiPageButton";


/** A package service which describes the construction of commonly asked for UI elements. */
export module CommonElements {

  // TODO Define common ui-component descriptions here.
  // This is where the concept of a 'shop page button' is formally defined.
  // This module could get pretty large. I wonder if I should split anything.

  export module CommandMenu {

  }

  export module TroopConstructionMenu {

    export function fundsCalculator() {
      // TODO This is a temporary construction that my gut tells me won't fit
      // neatly into the new UI-system design.
      class FundsCalculator extends UiComponent {

        private leftNum = new PIXI.BitmapText('', fonts.list);
        private rightNum = new PIXI.BitmapText('', fonts.list);

        constructor() {
          super();

          const w = 16 * 7.75; // TODO Matches UnitShopMenuGUI
          const h = 14;
          const fw = 7*6+3; // The box the numbers fit in

          const ax = w/2 + 5;
          const ay = h/2;

          const g = new PIXI.Graphics();

           // Background
          g.beginFill(Palette.gale_force1)
           .drawRect(0,0,w,h)
           .endFill()

           .beginFill(Color.adjustHSV(Palette.gale_force1, 0, 0.5, 1.5))
           .drawRect(16,3,fw,h-6)
           .drawRect(w-5-fw,3,fw,h-6)
           .endFill()
           
           // Side borders
           .beginFill(Palette.black, 1/3)
           .drawRect(0,0,3,h)
           .drawRect(w-3,0,3,h)
           .drawRect(3,0,w-6,1)
           .drawRect(3,h-1,w-6,1)
           .endFill()

           // Arrow
           .lineStyle(1, Color.adjustHSV(Palette.gale_force1, 0, 0.5, 2.0), 1)
           .moveTo(ax - 4, ay)
           .lineTo(ax + 4, ay)
           .lineTo(ax + 2, ay - 2)
           .moveTo(ax + 4, ay)
           .lineTo(ax + 2, ay + 2)
           .endFill();

          // 'F' Funds icons
          const iconSheet = Game.scene.getSpritesheet('UISpritesheet').textures;
          const tex = iconSheet['icon-funds.png'];

          const leftF = new PIXI.Sprite(tex);
          leftF.anchor.set(0,.5);
          leftF.position.set(7, h/2);

          // Funds values
          this.leftNum.anchor.set(1,.5);
          this.leftNum.position.set(ax - 7, h/2+1);
        
          this.rightNum.anchor.set(1,.5);
          this.rightNum.position.set(w - 6, h/2+1);

          this.container.addChild(g, leftF, this.leftNum, this.rightNum);
        }

        setValues(left: number, right: number) {
          this.leftNum.text = `${left}`;
          this.rightNum.text = `${right}`;
        }
      }

      return new FundsCalculator();
    }


    export function pageIndicatorLamp(): UiBinaryLamp {
      const g = new PIXI.Graphics();

      const c_bg = Palette.gale_force1;
      const c_lamp = Color.adjustHSV(Palette.caribbean_green, 0, .7, .9);

      const w = 10;
      const h = 3;
      const b = 1;

      g.beginFill(c_bg)
        .drawRect(0,0,w,h)
        .endFill();
      const background = Game.renderer.generateTexture(g);

      g.clear()
        .beginFill(c_lamp)
        .drawRect(b, b, w-2*b, h-2*b)
        .endFill();
      const lamp = Game.renderer.generateTexture(g);

      return new UiBinaryLamp({background, lamp});
    }


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

      const std_fillToBorderArgs = [0, .75, .55] as const;

      const baseColor = Color.adjustHSV(Palette.caribbean_green, 0, .55, .65);
      const borderColor = Color.adjustHSV(baseColor, ...std_fillToBorderArgs);

      const hoverColor = Color.adjustHSV(baseColor, 0, 1, 1.20);
      const hoverBorder = Color.adjustHSV(hoverColor, ...std_fillToBorderArgs);

      const depressColor = Color.adjustHSV(baseColor, 0, 1, 1.10);
      const depressBorder = Color.adjustHSV(depressColor, ...std_fillToBorderArgs);

      const disabledColor = Color.adjustHSV(baseColor, 0, 0, 1);
      const disabledBorder = Color.adjustHSV(disabledColor, ...std_fillToBorderArgs);

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