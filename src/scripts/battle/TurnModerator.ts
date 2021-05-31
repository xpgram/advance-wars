import { Slider } from "../Common/Slider";
import { BoardPlayer } from "./BoardPlayer";

/** Keeps track of the current turn-player and the turn-taking order. */
export class TurnModerator {

    readonly teams: BoardPlayer[] = [];    // List of players
    currentIdx: Slider;                 // Turn-player index

    constructor() {
        this.teams = [
            new BoardPlayer({}),     // TODO This is temporary.
            new BoardPlayer({}),     // Should probably get details or at least player count passed in.
        ];                      // Also, what about pre-deploy?
        this.currentIdx = new Slider({
            max: this.teams.length,
            granularity: 1,
            looping: true,
        });
    }

    get currentTeam() {
        return this.teams[this.currentIdx.output];
    }

    changeToNext() {
        this.currentIdx.increment();
    }
}