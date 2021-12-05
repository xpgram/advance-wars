import { Slider } from "../Common/Slider";
import { BoardPlayer } from "./BoardPlayer";

/** Keeps track of the current turn-player and the turn-taking order.
 * Useful as a current-player proxy for scripts and objects which need to know. * */
export class TurnModerator {

    private readonly players: BoardPlayer[];
    private currentIdx: Slider;
    private _day: number = 1;

    constructor(players: BoardPlayer[]) {
        this.players = players;
        this.currentIdx = new Slider({
            max: this.players.length,
            granularity: 1,
            looping: true,
        });
    }

    get all() {
        return this.players;
    }

    get allUnits() {
        return this.players.map( p => p.units ).flat();
    }

    get current() {
        return this.players[this.currentIdx.output];
    }

    // TODO Unimplemented anywhere
    get perspective() {
        return this.players[this.currentIdx.output];
    }

    get day() {
        return this._day;
    }

    increment() {
        if (this.currentIdx.output === this.players.length - 1)
            this._day++;
        this.currentIdx.increment();
    }
}