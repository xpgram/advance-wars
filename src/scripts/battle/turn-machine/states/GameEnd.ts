import { Game } from "../../../..";
import { PIXI } from "../../../../constants";
import { MainMenuScene } from "../../../../scenes/MainMenu";
import { SceneTransition } from "../../../../scenes/scene-transitions/SceneTransition";
import { TurnState } from "../TurnState";

export class GameEnd extends TurnState {
  get type() { return GameEnd; }
  get name() { return 'GameEnd'; }
  get revertible() { return false; }
  get skipOnUndo() { return false; }

  configureScene() {
    Game.transitionToScene(MainMenuScene, new SceneTransition.None());
  }

}