import { Game } from "../../../..";
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

    this.timer = new Timer()
      .at(0, () => {
        Timer.tween(.3, n => {
          const m = Math.sqrt(n);
          this.playerCard.x = 16*(1-m);
          this.playerCard.y = 8*(1-m);
          this.playerCard.alpha = m;
        }).start()
      })
      .at(.8, () => {
        Timer.tween(.3, n => {
          const m = Math.sqrt(n);
          this.playerCard.x = -16*m;
          this.playerCard.y = -8*m;
          this.playerCard.alpha = 1-m;
        }).start()
      })
      .at(1.3, () => {
        this.advance();
      })
      .start();
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

  onDestroy() {
    this.timer.destroy();
  }

}