import { AssetsPackage } from "./AssetsPackage";
import { MapCursor } from "../MapCursor";
import { Map } from "../Map";
import { Camera } from "../../Camera";
import { Game } from "../../..";
import { VirtualGamepad } from "../../controls/VirtualGamepad";
import { InfoWindowSystem } from "../ui-windows/InfoWindowSystem";
import { TrackCar } from "../TrackCar";


export class BattleSceneControllers extends AssetsPackage {

    gamepad: VirtualGamepad;
    camera: Camera;
    map: Map;
    mapCursor: MapCursor;
    uiSystem: InfoWindowSystem;

    trackCar: TrackCar;

    constructor(options: BattleSceneOptions) {
        super();

        // 
        
        this.gamepad = new VirtualGamepad();

        this.camera = new Camera(Game.stage);

        this.map = new Map(25,9);

        this.mapCursor = new MapCursor(this.map, this.gamepad); // TODO A gamepad proxy for whichever is current-player
    }
}

type BattleSceneOptions = {
    mapData: {
        width: number,
        height: number
    }


}