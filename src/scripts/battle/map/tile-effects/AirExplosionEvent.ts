import { Timer } from "../../../timer/Timer";
import { ExplosionEvent } from "./ExplosionEvent";

export class AirExplosionEvent extends ExplosionEvent {
  protected timer: Timer = new Timer(0.5);
  protected title: string = 'air';
}