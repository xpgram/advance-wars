import { Game } from "../..";
import { Slider } from "../Common/Slider";
import { BoardPlayer } from "./BoardPlayer";
import { MultiplayerService } from "./MultiplayerService";

/** Keeps track of the current turn-player and the turn-taking order.
 * Useful as a current-player proxy for scripts and objects which need to know. * */
export class TurnModerator {

  private readonly multiplayer: MultiplayerService;
  private readonly players: BoardPlayer[];
  private currentIdx: Slider;
  private _day: number = 1;

  constructor(players: BoardPlayer[], multiplayer: MultiplayerService) {
    this.multiplayer = multiplayer;
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
    return this.players.map(p => p.units).flat();
  }

  get allUnitsOnMap() {
    return this.players.map(p => p.unitsOnMap).flat();
  }

  get current() {
    return this.players[this.currentIdx.output];
  }

  /** Returns the player object who is determined to be the eyes of our game view.
   * This is relevant for online or against-AI play, where the other player's secrets
   * should be protected. */
  get perspective() {
    // This check differentiates between 'me' and 'internet'
    // TODO Allow multiple local players by introducing a 'null' perspective between them.
    const playerNum = this.multiplayer.playerNumber ?? this.currentIdx.output;
    return this.players[playerNum];
  }

  /** A reference to the perspective player when it is their turn, otherwise undefined.
   * Ideally written like: players.perspectivesTurn?.someAction() */
  get perspectivesTurn() {
    return (this.current === this.perspective)
      ? this.perspective
      : undefined;
  }

  /** A number representing the current round. Increases by 1 after the last player in
   * the match order ends their turn. */
  get day() {
    return this._day;
  }

  /** True if the current turn is the first turn of the first player in the match order. */
  get firstTurn() {
    return (this._day === 1 && this.currentIdx.equalsMin());
  }

  increment() {
    if (this.currentIdx.output === this.players.length - 1)
      this._day++;
    this.currentIdx.increment();
  }

  playerWon(player: BoardPlayer) {
    const playerStillIn = (!player.defeated);
    const otherPlayersOut = this.players
      .filter( p => p !== player )
      .every( p => p.defeated );
    return playerStillIn && otherPlayersOut;
  }

  playerLost(player: BoardPlayer) {
    return player.defeated;
  }
  
  get playersStillActive(): number {
    return this.all.filter( p => !p.defeated ).length;
  }
  
  winnerFound(): boolean {
    return (this.playersStillActive === 1);
  }
  
}
