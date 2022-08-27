import { PIXI, PixiFilters } from "../constants";
import { Game } from "..";
import { Scene } from "./Scene";
import { StateMaster } from "../scripts/system/state-management/StateMaster";
import { MainMenuAssets } from "../scripts/main-menu/MainMenuAssets";
import { PickMap } from "../scripts/main-menu/PickMap";
import { Timer } from "../scripts/timer/Timer";
import { Point } from "pixi.js";
import { Ease } from "../scripts/Common/EaseMethod";


/**
 * @author Dei Valko
 */
export class MainMenuScene extends Scene {

  private stateMachine!: StateMaster<MainMenuAssets>;

  private bg = new PIXI.Sprite();
  private bgTimer!: Timer;
  private bgCrtFilter = new PixiFilters.CRTFilter({
    vignetting: 1/4,
    vignettingAlpha: 1/3,

    curvature: 1/3,
    lineWidth: 1.0,
    lineContrast: 1/12,

    noise: 1/96,
  });

  loadStep(): void {
    this.linker.push({name: 'font-map-ui', url: 'assets/font-map-ui.xml'});
    this.linker.push({name: 'font-small-ui', url: 'assets/font-small-ui.xml'});
    this.linker.push({name: 'font-script', url: 'assets/font-script.xml'});
    this.linker.push({name: 'font-menu', url: 'assets/font-menu.xml'});
    this.linker.push({name: 'font-table-header', url: 'assets/font-table-header.xml'});
    this.linker.push({name: 'font-title', url: 'assets/font-title.xml'});
    this.linker.push({name: 'font-label', url: 'assets/font-label.xml'});

    // FIXME Not part of spritesheet
    this.linker.push({name: 'mainmenu-bg1', url: 'assets/tmp-nonbundled/mainmenu-bg1.png'})
    this.linker.push({name: 'mainmenu-bg2', url: 'assets/tmp-nonbundled/mainmenu-bg2.png'})
    this.linker.push({name: 'mainmenu-bg3', url: 'assets/tmp-nonbundled/mainmenu-bg3.png'})
  }

  setupStep(): void {

    this.stateMachine = new StateMaster({
      name: `MainMenuSystem`,
      assets: new MainMenuAssets(),
      entryPoint: PickMap,
    });

    // Set up temporary MainMenu background
    const center = new Point(
      Game.display.renderWidth/2,
      Game.display.renderHeight/2,
    );
    const y_displace = 4;
    const animTime = 6;
      
    // const bg_name = Common.choose(['mainmenu-bg1', 'mainmenu-bg2', 'mainmenu-bg3']);
    const bg_name = 'mainmenu-bg2';
    this.bg.texture = this.resources[bg_name].texture as PIXI.Texture;
    this.bg.tint = 0xAAAAAA;  // Darken a little for menu see-ability.

    const newWidth = Game.display.renderWidth;
    this.bg.height *= newWidth / this.bg.width;
    this.bg.width = newWidth;
    this.bg.anchor.set(.5);
    this.bg.position.set(center.x, center.y - y_displace);

    this.visualLayers.backdrop.filters = [
      new PIXI.filters.BlurFilter(6),
      this.bgCrtFilter,
      new PixiFilters.PixelateFilter(6),  // This doesn't track with viewport resize
    ];

    this.visualLayers.backdrop.addChild(this.bg);
    this.bgTimer = Timer
      .tween(animTime, this.bg, {y: center.y + y_displace}, Ease.sine.inOut)
      .wait()
      .tween(animTime, this.bg, {y: center.y - y_displace}, Ease.sine.inOut)
      .loop();
  }

  updateStep(): void {
    if (Game.frameCount % 2 === 0)
      this.bgCrtFilter.seed = Math.random();
  }

  destroyStep(): void {
    this.stateMachine.destroy();
    this.bgTimer.destroy();
  }

}