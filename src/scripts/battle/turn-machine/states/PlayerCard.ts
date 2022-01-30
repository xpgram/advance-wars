import { Game } from "../../../..";
import { EaseMethod } from "../../../Common/EaseMethod";
import { Point } from "../../../Common/Point";
import { Timer } from "../../../timer/Timer";
import { fonts } from "../../ui-windows/DisplayInfo";
import { TurnState } from "../TurnState";


/** Shows the current player's begin-turn animation sweep. */
export class PlayerCard extends TurnState {
  get type() { return PlayerCard; }
  get name() { return 'PlayerCard'; }
  get revertible() { return false; }
  get skipOnUndo() { return true; }

  timer!: Timer;
  readonly playerCard = new PIXI.Container();

  configureScene() {
    const { players } = this.assets;

    // Construct temp player card.

    const width = 128;
    const height = 64;

    const nameText = new PIXI.BitmapText(`${players.current.officer.name}'s Turn`, fonts.title);
    const playerText = new PIXI.BitmapText(`P${players.current.playerNumber + 1}`, fonts.title);
    const background = new PIXI.Graphics();

    background.beginFill(0, .5);
    background.drawRect(0,0, width, height);
    background.endFill();

    nameText.position.set(
      (width - nameText.width) / 2,
      (height - nameText.height - playerText.height) / 2
    )
    playerText.position.set(
      (width - playerText.width) / 2,
      (height - nameText.height - playerText.height) / 2 + nameText.height
    )
    background.position.set(
      (Game.display.renderWidth - width) / 2,
      (Game.display.renderHeight - height) / 2,
    )

    background.addChild(nameText, playerText);
    this.playerCard.addChild(background);
    Game.hud.addChild(this.playerCard);

    // vv Practice shiz vv
    const center = new Point(Game.display.renderWidth, Game.display.renderHeight).multiply(.5);

    this.playerCard.alpha = 0;  // Beginning of animation state

    const slideTime = .4;
    const waitTime = .8;
    const xdist = 40;
    const yrat = 0;
    const float = 2;
    const motion = EaseMethod.circ;
    const fade = EaseMethod.sine;

    this.timer = Timer
      .at(.15)
      .tween(slideTime, n => {
        const m = motion.out(n);
        this.playerCard.x = xdist*(1-m) + float;
        this.playerCard.y = xdist*yrat*(1-m) + float*yrat;
        this.playerCard.alpha = fade.inOut(n);
      })
      .wait()
      .tween(waitTime, n => {
        this.playerCard.x = 2*float*(1-n) - float;
        this.playerCard.y = 2*float*yrat*(1-n) - float*yrat;
      })
      .wait()
      .tween(slideTime, n => {
        const m = motion.in(n);
        this.playerCard.x = -xdist*m - float;
        this.playerCard.y = -xdist*yrat*m - float*yrat;
        this.playerCard.alpha = 1-fade.inOut(n);
      })
      .at('end')
      .do(n => {
        this.advance();
      })
  }

  update() {
    const { gamepad } = this.assets;

    if (gamepad.button.A.pressed) {
      this.timer.destroy();
      this.advance();
    }
  }

  close() {
    this.playerCard.destroy({children: true});
  }

}