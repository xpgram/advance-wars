import { io } from "socket.io-client";
import { Game } from "../../..";
import { CommandInstruction } from "../../battle/turn-machine/CommandInstruction";
import { Debug } from "../../DebugUtils";


const DOMAIN = "WebsocketMaster";
const PROCEDURE = {
  MSG_RECEIVED: "MessageReceived",
} as const;

const URL_DOMAIN = {
  REMOTE: "https://eager-tested-stick.glitch.me",
  LOCAL_DEV: "ws://localhost:3001",
} as const;

// TODO Library for Events; A segmented library for Events specific to a Scene


export class SocketMaster {

  private readonly serverUrl = (!Game.developmentMode) ? URL_DOMAIN.REMOTE : URL_DOMAIN.LOCAL_DEV;
  /** Reference to the socket client. */
  // TODO Add .env 'useRemoteServer' boolean to force REMOTE.PUBLIC even in development mode.
  readonly io = io(this.serverUrl, { path: "/sock" });

  get playerNumber() { return this._playerNumber; }
  private _playerNumber?: number;

  // TODO Move to a BattleScene-specific object
  instructionQueue: CommandInstruction[] = [];
  turnSignal = false;
  messageQueue: string[] = [];    // This is to mess with Jaden, but I might repurpose it into something later.

  // TODO Client ID, User Auth, and ultimately PlayerNumber matching for a GameSession


  constructor() {

    Debug.log(DOMAIN, "Constructor", {
      message: `Using: ${this.serverUrl}`,
      warn: Game.developmentMode,
    });

    // Get info from server
    this.io.emit('request player number', null);
    
    this.io.on('game session data', plNum => {
      Debug.log(DOMAIN, PROCEDURE.MSG_RECEIVED, {
        message: `Assigned player ${this._playerNumber} to this client`,
        warn: Game.developmentMode,
      });
      this._playerNumber = plNum;
    });

    // Define message handlers
    this.io.on('troop order', data => {
      Debug.log(DOMAIN, PROCEDURE.MSG_RECEIVED, {
        message: JSON.stringify(data),
        warn: Game.developmentMode,
      })
      this.instructionQueue.push(data);
    });

    this.io.on('turn change', () => {
      Debug.log(DOMAIN, PROCEDURE.MSG_RECEIVED, {
        message: `Signaled turn change.`,
      })
      this.turnSignal = true;
    });
    
    this.io.on('chat message', msg => {
      const maxc = 20;
      const preview = (msg.length > maxc) ? `${msg.slice(0, maxc)}...` : msg;
      Debug.log(DOMAIN, PROCEDURE.MSG_RECEIVED, {
        message: `received chat: ${preview}`,
      });
      this.messageQueue.push(msg);
    });
    
  }

}