import { io } from "socket.io-client";
import { Game } from "../../..";
import { CommandInstruction } from "../../battle/turn-machine/CommandInstruction";
import { Debug } from "../../DebugUtils";


const DOMAIN = "WebsocketMaster";

// TODO Library for Events; A segmented library for Events specific to a Scene


export class SocketMaster {

  /** Reference to the socket client. */
  // TODO This link must change on deployment. I don't know how or to what, though.
  readonly io = io("ws://localhost:3000/");

  get playerNumber() { return this._playerNumber; }
  private _playerNumber?: number;

  // TODO Move to a BattleScene-specific object
  instructionQueue: CommandInstruction[] = [];

  // TODO Client ID, User Auth, and ultimately PlayerNumber matching for a GameSession


  constructor() {

    this.io.on('troop order', data => {
      Debug.log(DOMAIN, "MessageReceived_Test", {
        message: JSON.stringify(data),
        warn: Game.developmentMode,
      })
      this.instructionQueue.push(data);
    })

    this.io.on('game session data', plNum => {
      this._playerNumber = plNum;
      console.log(`Assigned player ${this._playerNumber} to this client`);
    });

  }

}