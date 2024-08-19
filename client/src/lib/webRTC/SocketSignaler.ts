import { io, Socket } from "socket.io-client";
import { Signaler } from "./Signaler";

export enum EventName {
  /** Lifecycle Events */
  Connect = "connect",
  Disconnect = "disconnect",
  Codecs = "codecs",

  /** Room Events */
  JoinRoom = "join-room",
  CreateRoom = "create-room",

  /** RTC Events */
  ICE = "rtc-ICE",
  Offer = "rtc-description",
  RoomJoinAck = "room-joined",
}

export interface RoomAck {
  message: string;
  roomID: string;
  isPolite: boolean;
}

export class SocketSignaler extends Signaler {
  socket: Socket;
  isPolite: boolean;

  constructor(socketURL: string) {
    super();
    this.socket = io(socketURL);
    this.isPolite = true;
  }

  private sendConfig() {
    const capabilities = RTCRtpReceiver.getCapabilities("video");
    this.socket.emit(EventName.Codecs, capabilities?.codecs ?? []);
  }

  setupListeners(
    onRemoteOffer: (remoteOffer: RTCSessionDescription) => Promise<void>,
    onICECandidate: (ICEcandidate: RTCIceCandidate) => Promise<void>,
    onRoomJoined: (params?: any) => void
  ) {
    // on connect
    this.socket.on(EventName.Connect, () => {
      this.sendConfig();
    });

    // on disconnect
    window.onbeforeunload = (event) => {
      this.socket.emit(EventName.Disconnect);
    };

    // on ICE candidate
    this.socket.on(EventName.ICE, onICECandidate);

    // on remote offer
    this.socket.on(EventName.Offer, onRemoteOffer!);

    // on room joined
    this.socket.on(EventName.RoomJoinAck, (roomAck: RoomAck) => {
      this.isPolite = roomAck.isPolite;
      onRoomJoined(roomAck);
    });
  }

  sendOffer(offer: RTCSessionDescription): void {
    this.socket.emit(EventName.Offer, offer);
  }

  sendICE(ICEcandidate: RTCIceCandidate): void {
    this.socket.emit(EventName.ICE, ICEcandidate);
  }

  createRoom(): void {
    this.socket.emit(EventName.CreateRoom);
  }

  joinRoom(roomID: string): void {
    this.socket.emit(EventName.JoinRoom, roomID);
  }
}
