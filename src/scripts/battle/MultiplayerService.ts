import { Game } from "../..";
import { Point } from "../Common/Point";
import { Debug } from "../DebugUtils";
import { CreateEvent, SocketEventListener } from "../system/online/SocketMaster";
import { CommandInstruction } from "./turn-machine/CommandInstruction";


const DOMAIN = "WarModeSocketListener";
enum Procedure {
  RequestSessionData = 'Out_SessionData',
  SessionData  = 'In_SessionData',
  PlayerAction = 'In_PlayerAction',
  ChatMessage  = 'In_ChatMessage',
}


export class MultiplayerService {

  /** True if the multiplayer service is active.
   * @readonly */
  get live() { return this._playerNumber !== undefined; }

  get playerNumber() { return this._playerNumber; }
  private _playerNumber?: number;

  getNextInstruction() { return this.instructionQueue.shift(); }
  private instructionQueue = [] as Array<CommandInstruction|'EndTurn'>;

  // TODO This should probably be maintained by a separate service. Maybe.
  getMessages() {
    const messages = this.messageQueue;
    this.messageQueue = [];
    return messages;
  }
  private messageQueue = [] as string[];


  // Describes all relevant io event handlers
  private events: SocketEventListener[] = [

    CreateEvent('GameSessionData', plnum => {
      Debug.log(DOMAIN, Procedure.SessionData, {
        message: `Assigned player ${plnum} to this client`,
        warn: Game.developmentMode,
      });
      this._playerNumber = plnum;
    }),

    CreateEvent('TroopOrder', data => {
      Debug.log(DOMAIN, Procedure.PlayerAction, {
        message: JSON.stringify(data),
        warn: Game.developmentMode,
      })

      const troopInstruction: CommandInstruction = {
        ...data,
        place: (data.place) ? new Point(data.place) : undefined,
        focal: (data.focal) ? new Point(data.focal) : undefined,
        drop: data.drop.map( ({which, where}) => ({which, where: new Point(where)}) ),
      }

      this.instructionQueue.push(troopInstruction);
    }),

    CreateEvent('EndTurn', () => {
      Debug.log(DOMAIN, Procedure.PlayerAction);
      this.instructionQueue.push('EndTurn');
    }),

    CreateEvent('ChatMessage', msg => {
      const maxc = 20;
      const preview = (msg.length > maxc) ? `${msg.slice(0, maxc)}...` : msg;
      Debug.log(DOMAIN, Procedure.ChatMessage, {
        message: `Received chat: ${preview}`,
      });
      this.messageQueue.push(msg);
    }),

  ]


  constructor() {
    Game.online.addListeners(this.events);
  }
  
  joinGame(mapname: string) {
    Game.online.io.emit('RequestPlayerNumber', mapname);
  }

  destroy() {
    Game.online.io.emit('LeaveGame');
    Game.online.removeListeners(this.events);
  }

  /** Alias for Game.online.io */
  get io() {
    return Game.online.io;
  }

}
