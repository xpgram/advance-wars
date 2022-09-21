import { io, Socket } from "socket.io-client";
import { Game } from "../../..";
import { Debug } from "../../DebugUtils";
import { ServerToClientEvents } from "../../../../../awsrv/src/types/ServerToClientEvents";
import { ClientToServerEvents } from "../../../../../awsrv/src/types/ClientToServerEvents";


const DOMAIN = "WebsocketMaster";

const URL_DOMAIN = {
  REMOTE: "https://eager-tested-stick.glitch.me",
  LOCAL_DEV: "ws://localhost:3001",
} as const;


type IO = Socket<ServerToClientEvents, ClientToServerEvents>;
  // TODO How do I just reference SocketMaster.io.on? Like, here. In this file. It's here.
type SocketEvent = Parameters<typeof Game.online.io.on>[0];
type SocketListener<E extends SocketEvent> = Parameters<typeof Game.online.io.on<E>>[1];

/** Describes an event and listener-callback pairing. */
export type SocketEventListener<E extends SocketEvent = SocketEvent> = {
  event: E;
  listener: SocketListener<E>;
}

/** Wrapper and reference broker for the socket.io instance, and ultimately the first
 * reference point for any remote server interactions. */
export class SocketMaster {

  /** The url string we intend to use for server communication. */
  private readonly serverUrl = (!Game.developmentMode) ? URL_DOMAIN.REMOTE : URL_DOMAIN.LOCAL_DEV;
  // private readonly serverUrl = URL_DOMAIN.REMOTE;

  /** Reference to the socket client. */
  // TODO Add .env 'useRemoteServer' boolean to force REMOTE.PUBLIC even in development mode.
  readonly io: IO = io(this.serverUrl, { path: "/sock" });


  constructor() {
    Debug.log(DOMAIN, "Constructor", {
      message: `Using: ${this.serverUrl}`,
      warn: Game.developmentMode,
    });

    // [ ] Confirm user auth?
    // [ ] Delay until online.activate() or something? To reduce server socket connections.
  }

  /** Adds a list of event-listener pairings to the socket. 
   * Use io.on() for more control. */
  addListeners(events: SocketEventListener[]) {
    for (const {event, listener} of events)
      this.io.on(event, listener);
  }

  /** Removes a list of event-listener pairings from the socket.
   * Use io.off() for more control. */
  removeListeners(events: SocketEventListener[]) {
    for (const {event, listener} of events)
      this.io.off(event, listener);
  }

}

/** Confirms the type information for a callback relative to the socket event given and
 * returns the pair as an object record useable with SocketMaster.addListeners() */
export function CreateEvent<E extends SocketEvent>(event: E, listener: SocketListener<E>): SocketEventListener<SocketEvent> {
  return {event, listener};
}