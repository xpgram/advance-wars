import { Game } from "../..";
import { Timer } from "./Timer";

/** A descendant of Timer which uses Game's global ticker instead of the current scene's. */
export class GlobalTimer extends Timer {
  protected get updateTicker() { return Game.globalTicker; }
}