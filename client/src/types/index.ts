import { RTC } from "../lib/webRTC/RTC";
import store from "../store/store";

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
  NewStreams = "new-streams",
  ToggleTrack = "toggle-track",

  /** Auth */
  InvalidAuth = "invalid-auth",
}

export interface Config {
  iceServers: { urls: string }[];
}

export interface Constraints {
  audio: boolean;
  video: boolean;
}

export interface RoomAck {
  message: string;
  roomID: string;
  isPolite: boolean;
}

export interface RTCUser {
  username: string;
  profilePicture: string | null | undefined;
}

export interface Config {
  iceServers: { urls: string }[];
}

export interface Payload {
  id: string;
  email: string;
}

export interface CreateAccount {
  username: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

export interface LoginUser {
  email: string;
  password: string;
}

export interface AuthResponse extends User {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  profilePicture?: string | null;
}

export interface UserState {
  user: User | null;
}

export interface MediaInfo {
  enabled: boolean;
  hasPermission: boolean;
  streamEnabled: boolean;
  selectedDevice: MediaDeviceInfo | null;
  availableDevices: MediaDeviceInfo[];
}

export interface MediaState {
  video: MediaInfo;
  audio: MediaInfo;
  stream: MediaStream;
  rtc: RTC | null;
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
