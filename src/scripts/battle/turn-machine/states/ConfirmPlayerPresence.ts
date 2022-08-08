import { PIXI, PixiFilters } from "../../../../constants";
import { Game } from "../../../..";
import { Color } from "../../../color/Color";
import { getFactionPalette } from "../../../color/PlayerFactionPalette";
import { Timer } from "../../../timer/Timer";
import { fonts } from "../../ui-windows/DisplayInfo";
import { TurnState } from "../TurnState";
import { Palette } from "../../../color/ColorPalette";
import { Common } from "../../../CommonUtils";



export class ConfirmPlayerPresence extends TurnState {
  get type() { return ConfirmPlayerPresence; }
  get name() { return 'ConfirmPlayerPresence'; }
  get revertible() { return false; }
  get skipOnUndo() { return false; }

  private prompt = new PIXI.Container();
  private introTimer = new Timer();
  private outroTimer = new Timer();

  private neutralPerspective() {
    const { scenario, map, players } = this.assets;

    // TODO Does this follow the same format ResetPerspective uses?

    // Enforce neutral stealth-unit perspective
    players.allUnitsOnMap
      .map( u => map.squareAt(u.boardLocation) )
      .forEach( s => s.hideUnit = s.unit?.hiding ?? false );

    // Enforce neutral FoW perspective
    if (scenario.fogOfWar)
      map.hideSightMap();
  }

  protected configureScene(): void {
    const { scenario, players } = this.assets;

    if (players.firstTurn || !scenario.fogOfWar) {
      this.advance();
      return;
    }

    // TODO Pre-move camera to mapcursor pos while map is obscured.
    // I'll need an instant transition, I guess. Does camera have that?

    // TODO proceed automatically only if next player is AI or Internet
    // if (players.current.?? || players.currentOnLocalClient())
    //   this.advance();
    //   return;
    // }

    // Build visual prompt to press the 'confirm' button
    const { renderWidth, renderHeight } = Game.display;

    const playerNum = players.current.playerNumber + 1;
    const text = new PIXI.BitmapText(`Player ${playerNum} Confirm\n\nPress Z to start`, fonts.title);
    text.anchor.set(.5);
    text.position.set(
      renderWidth/2,
      renderHeight/2,
    );

    const baseColor = getFactionPalette(players.current.faction).turnStartSplash.presenceBackground;
    const bgColor = Color.adjustHSV(baseColor, 0, .5, .5);

    const bg = new PIXI.Graphics();
    bg.beginFill( (scenario.fogOfWar) ? bgColor : Palette.black );
    bg.drawRect(0,0,renderWidth,renderHeight);
    bg.endFill();
    bg.alpha = (scenario.fogOfWar) ? 1.00 : 0.25;

    this.prompt.addChild(bg, text);
    this.prompt.alpha = 0;

    Game.hud.addChild(this.prompt);

    // Setup tween timers
    const transitionTime = .125;

    this.introTimer
      .tween(transitionTime, this.prompt, {alpha: 1})
      .at('end')
      .do(this.neutralPerspective, this)
      .start();
    
    this.outroTimer
      .tween(transitionTime, this.prompt, {alpha: 0})
      .at('end')
      .do(n => this.prompt.destroy({children: true}));

    // TODO Refactor this to fit in better?
    // When not in fog of war, the bg is transparent, so it looks better
    // to do it immediately instead of waiting for the transition to
    // complete.
    if (!scenario.fogOfWar)
      this.neutralPerspective();
  }

  update() {
    const { gamepad, stagePointer } = this.assets;

    if (gamepad.button.A.pressed || stagePointer.clicked()) {
      this.introTimer.skip();
      this.outroTimer.start();
      this.advance();
    }
  }

}