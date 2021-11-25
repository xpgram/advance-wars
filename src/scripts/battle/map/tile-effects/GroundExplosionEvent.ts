import { Timer } from "../../../timer/Timer";
import { ExplosionEvent } from "./ExplosionEvent";

export class GroundExplosionEvent extends ExplosionEvent {
  protected timer: Timer = new Timer(0.8);
  protected title: string = 'ground';
}