import { Game } from "../../../..";
import { Timer } from "../../../timer/Timer";
import { fonts } from "../../ui-windows/DisplayInfo";
import { TurnState } from "../TurnState";
import { TurnStart } from "./TurnStart";

export class TurnChange extends TurnState {
  get type() { return TurnChange; }
  get name() { return 'TurnChange'; }
  get revertible() { return false; }
  get skipOnUndo() { return false; }

  readonly timer = new Timer(.8, () => { this.advance(TurnStart); });
  readonly playerCard = new PIXI.Container();

  configureScene() {
    const { players, uiSystem } = this.assets;

    players.increment();
    uiSystem.updatePlayerWindowOrder();

    // TODO Rebind controller? BoardPlayer probably should know which input its listening from.
    // TODO gamepad should be gotten from players.current, yeah? That would be cool. I think.

    // TODO I think this (below) should be its own TurnState so I can more easily move it around.
    // I ~think~ I want it to happen after the cursor moves the player's position.
    // So, → player's cursor → player card → animation events → player's cursor
    // I'll have to look at the source game.
    // Or not. I suspect skipping the first to-cursor move is fine.

    // Temp player card.
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

    this.timer.startReset();
  }

  close() {
    this.playerCard.destroy({children: true});
  }

}