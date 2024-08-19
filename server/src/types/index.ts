import wrtc from "@roamhq/wrtc";
import { ServerRTC } from "../socket/ServerRTC";

export enum SocketEvent {
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

export interface Mapping {
  [roomID: string]: { [socketID: string]: ServerRTC };
}

export interface Config {
  iceServers: { urls: string }[];
}

export interface StreamMapping {
  [roomID: string]: {
    [socketID: string]: Map<string, MediaStream>;
  };
}

export interface Codecs {
  [socketID: string]: RTCRtpCodec[];
}

export interface Senders {
  [socketID: string]: Set<wrtc.RTCRtpSender>;
}
