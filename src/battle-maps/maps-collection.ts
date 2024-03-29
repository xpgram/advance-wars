import { Game } from "..";
import { MapData } from "./MapData";
import { maps as devroomMaps } from "./devroom-maps";
import { maps as demoMaps } from "./demo-maps";
import { maps as campaignMaps } from "./campaign-maps";
import { maps as trialMaps } from "./trial-maps";
import { maps as warroomMaps } from "./war-room-maps";
import { maps as onlineMaps } from "./awbw-maps";


export module MapsCollection {

  /** // TODO implement filter feature */
  export function fromCriteria(filter?: {}): MapData[] {
    return [
      ...(Game.developmentMode && devroomMaps || []),
      ...campaignMaps,
      ...trialMaps,
      ...warroomMaps,
      ...onlineMaps,
      ...(Game.developmentMode && demoMaps || []),
    ];
  }

}