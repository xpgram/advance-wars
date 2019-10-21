import { Scene } from "./Scene";
import { Map } from "../scripts/battle/Map";
import { Game } from "..";

/**
 * @author Dei Valko
 * @version 0.1.0
 */
export class BattleScene extends Scene {

    initStep(): void {
        Game.app.loader.reset();
        Game.app.loader.add('NormalMapTilesheet', './assets/sheets/normal-map-tiles-sm.json'); // TODO Get the correct path to assets.
        Game.app.loader.load();

        Game.app.loader.onComplete.add((loader, resources) => {
            let map = new Map(15, 10);
        });
    }

    updateStep(delta: number): void {
    }

    destroyStep(): void {
    }
}