import { Game } from "../../.."
import { PIXI } from "../../../constants";
import { Facing } from "../../battle/EnumTypes";
import { Common } from "../../CommonUtils";
import { ClickableContainer } from "../../controls/MouseInputWrapper";
import { CommonElements } from "../ui-components/CommonElements";
import { UiBinaryLamp } from "../ui-components/UiBinaryLamp";


export class PageSelector {


  readonly container = new PIXI.Container();

  readonly leftButton = CommonElements.TroopConstructionMenu.pageChangeButton(Facing.Left);
  readonly rightButton = CommonElements.TroopConstructionMenu.pageChangeButton(Facing.Right);
  private pageLampBar = new PIXI.Container();

  private pageLamps: UiBinaryLamp[] = [];


  constructor() {
    this.container.addChild(
      this.leftButton.container,
      this.rightButton.container,
      this.pageLampBar,
    )
  }

  destroy() {
    this.container.destroy({children: true});
  }

  build(pages: number, selected: number, minWidth?: number) {
    if (pages <= 1) {
      this.container.visible = false;
      return;
    }
    this.container.visible = true;

    // Adjust number of lamps to match the number of pages
    if (pages < this.pageLamps.length) {
      this.pageLamps.splice(pages)
        .forEach( lamp => lamp.destroy() );
    }
    else while (pages > this.pageLamps.length) {
      const i = this.pageLamps.length;
      const lamp = CommonElements.TroopConstructionMenu.pageIndicatorLamp();
      lamp.container.x = i*(lamp.container.width + 1);
      this.pageLampBar.addChild(lamp.container);
      this.pageLamps.push(lamp);
    }

    // Turn the right lamp on.
    this.pageLamps.forEach( (lamp, idx) => {
      if (idx === selected)
        lamp.lampOn();
      else
        lamp.lampOff();
    });

    // Reposition elements
    minWidth = minWidth ?? 0;

    const rightButtonPos = Math.max(
      this.leftButton.container.width + this.pageLampBar.width + 4,
      minWidth - this.rightButton.container.width,
    )
    const pageBarPos = (
      (rightButtonPos - this.leftButton.container.width) / 2
      + this.leftButton.container.width
      - this.pageLampBar.width / 2
    );
    
    this.pageLampBar.x = pageBarPos;
    this.rightButton.container.x = rightButtonPos;
  }

}