import { Socket } from "socket.io-client";
import { Signaler } from "./Signaler";

export enum EventName {
  CreateRoom = "create-room",
  JoinRoom = "join-room",
  Offer = "rtc-description",
  RoomJoinAck = "room-joined",
  ICE = "rtc-ICE",
  Connect = "connect",
}

export interface RoomAck {
  message: string;
  roomID: string;
  isPolite: boolean;
}

export class SocketSignaler extends Signaler {
  socket: Socket;
  isPolite: boolean;

  constructor(socket: Socket) {
    super();
    this.socket = socket;
    this.isPolite = true;
  }

  setupListeners(
    onRemoteOffer: (remoteOffer: RTCSessionDescription) => Promise<void>,
    onICECandidate: (ICEcandidate: RTCIceCandidate) => Promise<void>,
    onRoomJoined: (params?: any) => void
  ) {
    // on connect
    this.socket.on(EventName.Connect, () => console.log("Connected!"));
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
