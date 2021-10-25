import { Slider } from "../Common/Slider";
import { BoardPlayer } from "./BoardPlayer";

/** Keeps track of the current turn-player and the turn-taking order.
 * Useful as a current-player proxy for scripts and objects which need to know. * */
export class TurnModerator {

    private readonly players: BoardPlayer[];
    private currentIdx: Slider;

    constructor(players: BoardPlayer[]) {
        this.players = players;
        this.currentIdx = new Slider({
            max: this.players.length,
            granularity: 1,
            looping: true,
        });
    }

    get current() {
        return this.players[this.currentIdx.output];
    }

    increment() {
        this.currentIdx.increment();
    }
}