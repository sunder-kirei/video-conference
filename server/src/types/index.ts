import wrtc from "@roamhq/wrtc";
import { ServerRTC } from "../socket/ServerRTC";
import { google, GoogleApis } from "googleapis";
import userSchema from "../schema/user.schema";
import authSchema from "../schema/auth.schema";
import { z } from "zod";

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

  /** Auth */
  InvalidAuth = "invalid-auth",
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

export type OAuth2Client = typeof GoogleApis.prototype.auth.OAuth2.prototype;

export type Credentials = typeof google.auth.OAuth2.prototype.credentials;

export interface GoogleAuthProfile {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export enum PrivateKey {
  accessToken = "ACCESS_TOKEN_PRIVATE",
  refreshToken = "REFRESH_TOKEN_PRIVATE",
}

export enum PublicKey {
  accessToken = "ACCESS_TOKEN_PUBLIC",
  refreshToken = "REFRESH_TOKEN_PUBLIC",
}

export interface VerifyJWT<Payload> {
  expired: boolean;
  decoded: Payload;
}

export interface Payload {
  id: string;
  email: string;
}

export type CreateUserSchema = z.infer<typeof userSchema.createUserSchema>;

export type LoginUserSchema = z.infer<typeof authSchema.loginUserSchema>;

export type GoogleAuthResponse = z.infer<typeof authSchema.googleAuthResponse>;
