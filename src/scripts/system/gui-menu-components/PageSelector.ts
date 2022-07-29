import { Game } from "../../.."
import { PIXI } from "../../../constants";
import { ClickableContainer } from "../../controls/MouseInputWrapper";


export class PageSelector {


  readonly container = new PIXI.Container();

  readonly leftButton = new ClickableContainer(new PIXI.Sprite());
  readonly rightButton = new ClickableContainer(new PIXI.Sprite());
  private pageIcons = new PIXI.Container();


  constructor() {
    this.container.addChild(
      this.leftButton.container,
      this.rightButton.container,
      this.pageIcons,
    )
  }

  destroy() {
    this.container.destroy({children: true});
  }

  build(pages: number, selected: number) {
    const res = Game.scene.resources;
    const btnEnabled = res['page-btn-enabled'].texture as PIXI.Texture;
    const pageIcon = res['page-icon'].texture as PIXI.Texture;
    const curPageIcon = res['page-cur-icon'].texture as PIXI.Texture;

    if (pages <= 1) {
      this.container.visible = false;
      return;
    }

    this.container.visible = true;

    this.leftButton.container.texture = btnEnabled;
    this.rightButton.container.texture = btnEnabled;

    this.pageIcons.removeChildren()
      .forEach( spr => spr.destroy() );

    const iconSpacing = 7;

    for (let i = 0; i < pages; i++) {
      const spr = new PIXI.Sprite( (i === selected) ? curPageIcon : pageIcon );
      spr.x = i*iconSpacing;
      spr.y = 2;
      this.pageIcons.addChild(spr);
    }

    this.pageIcons.x = this.leftButton.container.width + 2;
    this.rightButton.container.x = this.pageIcons.x + pages*iconSpacing;

    this.rightButton.container.anchor.x = 1;
    this.rightButton.container.scale.x = -1;
  }

}