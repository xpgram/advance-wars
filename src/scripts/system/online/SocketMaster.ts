import { io } from "socket.io-client";
import { Game } from "../../..";
import { Debug } from "../../DebugUtils";


const DOMAIN = "WebsocketMaster";

// TODO Library for Events; A segmented library for Events specific to a Scene


export class SocketMaster {

  /** Reference to the socket client. */
  // TODO This link must change on deployment. I don't know how or to what, though.
  readonly io = io("ws://localhost:3000/");

  get playerNumber() { return this._playerNumber; }
  private _playerNumber = 0;

  // TODO Client ID, User Auth, and ultimately PlayerNumber matching for a GameSession


  constructor() {

    this.io.on('troop order', data => {
      Debug.log(DOMAIN, "MessageRecieved_Test", {
        message: JSON.stringify(data),
        warn: Game.developmentMode,
      })
    })

    this.io.on('game session data', plNum => {
      this._playerNumber = plNum;
      console.log(`Assigned player ${this._playerNumber} to this client`);
    });

    // TODO on 'connect' or 'finish handshake' or something, return # connected users.
    // This will inform the... this or some GameClientData class which player number they will be.

  }

}