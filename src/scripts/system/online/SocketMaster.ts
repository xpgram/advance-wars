import { io } from "socket.io-client";
import { Game } from "../../..";
import { CommandInstruction } from "../../battle/turn-machine/CommandInstruction";
import { Debug } from "../../DebugUtils";


const DOMAIN = "WebsocketMaster";
const PROCEDURE = {
  MSG_RECEIVED: "MessageReceived_Test",
} as const;

// TODO Library for Events; A segmented library for Events specific to a Scene


export class SocketMaster {

  /** Reference to the socket client. */
  readonly io = io(
    (Game.developmentMode)
      ? "ws:localhost:3000/"
      : "https://eager-tested-stick.glitch.me/sock"
    // "https://eager-tested-stick.glitch.me/sock"
  );

  get playerNumber() { return this._playerNumber; }
  private _playerNumber?: number;

  // TODO Move to a BattleScene-specific object
  instructionQueue: CommandInstruction[] = [];
  turnSignal = false;

  // TODO Client ID, User Auth, and ultimately PlayerNumber matching for a GameSession


  constructor() {

    this.io.on('troop order', data => {
      Debug.log(DOMAIN, PROCEDURE.MSG_RECEIVED, {
        message: JSON.stringify(data),
        warn: Game.developmentMode,
      })
      this.instructionQueue.push(data);
    })

    this.io.on('turn change', () => {
      Debug.log(DOMAIN, PROCEDURE.MSG_RECEIVED, {
        message: `Signaled turn change.`,
      })
      this.turnSignal = true;
    })

    this.io.on('game session data', plNum => {
      this._playerNumber = plNum;
      console.log(`Assigned player ${this._playerNumber} to this client`);
    });


    // REMOVE Db demo code
    this.io.on('db test', data => {
      console.log(data);
    })
    this.test_db();
  }

  // REMOVE Db demo code
  async test_db() {
    async function sendRequest(url: string) {
      const data = await fetch(url, {
        method: 'GET',
        mode: 'cors',

        headers: {
          'Content-Type': 'application/json'
        },
      });

      console.log(`from ${url}`);
      console.log(data);
    }

    [
      // 'http://localhost:3000/api/g',
      // 'http://localhost:3000/api/g/',
      // 'http://localhost:3002/api/g',
      'http://localhost:3002/api/g/',
    ].forEach( url => sendRequest(url) );
  }

}