import { TeamArmy } from "./TeamArmy";
import { Slider } from "../Common/Slider";

/** Keeps track of the current turn-player and the turn-taking order. */
export class TurnModerator {

    readonly teams: TeamArmy[] = [];    // List of players
    currentIdx: Slider;                 // Turn-player index

    constructor() {
        this.teams = [
            new TeamArmy(),     // TODO This is temporary.
            new TeamArmy(),     // Should probably get details or at least player count passed in.
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