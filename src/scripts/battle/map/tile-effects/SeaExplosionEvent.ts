import { Timer } from "../../../timer/Timer";
import { ExplosionEvent } from "./ExplosionEvent";

export class SeaExplosionEvent extends ExplosionEvent {
  protected timer: Timer = new Timer(.8);
  protected title: string = 'wet';
}