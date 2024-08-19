import { io } from "socket.io-client";
import { Signaler } from "./Signaler";
import { RoomAck, SocketSignaler } from "./SocketSignaler";

export interface Config {
  iceServers: { urls: string }[];
}

export interface Constraints {
  audio: boolean;
  video: boolean;
}

export class RTC {
  rtc?: RTCPeerConnection;
  self?: HTMLVideoElement;
  setTrack: React.Dispatch<React.SetStateAction<MediaStream[]>>;
  constraints: Constraints;
  signaler: Signaler;
  isPolite: boolean;
  private onRoomJoinedCallback: (roomAck: RoomAck) => void;
  config: Config = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun.l.google.com:5349" },
      { urls: "stun:stun1.l.google.com:3478" },
      { urls: "stun:stun1.l.google.com:5349" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:5349" },
      { urls: "stun:stun3.l.google.com:3478" },
      { urls: "stun:stun3.l.google.com:5349" },
      { urls: "stun:stun4.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:5349" },
    ],
  };

  constructor(
    socketURL: string,
    onRoomJoinedCallback: (roomAck: RoomAck) => void,
    setTrack: React.Dispatch<React.SetStateAction<MediaStream[]>>,
    config?: Config,
    constraints: Constraints = { audio: true, video: true }
  ) {
    this.setTrack = setTrack;
    this.constraints = constraints;
    if (config) this.config = config;
    this.signaler = new SocketSignaler(socketURL);
    this.isPolite = this.signaler.isPolite;
    this.onRoomJoinedCallback = onRoomJoinedCallback;
    this.setupSignalerListeners();
  }

  get connState() {
    if (!this.rtc) return "uninit";
    return this.rtc.connectionState;
  }

  close() {
    if (!this.rtc) return;
    this.rtc?.close();
  }

  // add track for remote transmission and srcVideo element
  async bindVideo(self: HTMLVideoElement) {
    try {
      this.self = self;
      const stream = await navigator.mediaDevices.getUserMedia(
        this.constraints
      );
      this.self.srcObject = stream;
    } catch (err) {
      throw err;
    }
  }

  async initRTC() {
    try {
      this.rtc = new RTCPeerConnection(this.config);
      const stream = await navigator.mediaDevices.getUserMedia(
        this.constraints
      );
      stream.getTracks().forEach((track) => {
        this.rtc!.addTrack(track, stream);
      });
      this.setupListeners();
    } catch (err) {
      throw err;
    }
  }

  createRoom() {
    this.signaler.createRoom();
  }

  joinRoom(roomID: string) {
    this.signaler.joinRoom(roomID);
  }

  private setupSignalerListeners() {
    let makingOffer = false;
    let ignoreOffer = false;

    this.signaler.setupListeners(
      async (remoteOffer) => {
        const offerCollision =
          remoteOffer.type === "offer" &&
          (makingOffer || this.rtc!.signalingState !== "stable");
        ignoreOffer = !this.isPolite && offerCollision;

        if (ignoreOffer) return;

        await this.rtc!.setRemoteDescription(remoteOffer);
        if (remoteOffer.type === "offer") {
          await this.rtc!.setLocalDescription();
          this.signaler.sendOffer(this.rtc!.localDescription!);
        }
      },
      async (candidate) => await this.rtc!.addIceCandidate(candidate),
      async (roomAck) => {
        await this.initRTC();
        this.onRoomJoinedCallback(roomAck);
      }
    );
  }

  private setupListeners() {
    if (!this.rtc) throw "RTC not init";

    let makingOffer = false;

    // handle incoming remote tracks
    this.rtc.ontrack = ({ streams, track }) => {
      // TODO
      streams.forEach((stream) => {
        console.log(stream.id);

        this.setTrack((prev) => {
          let foundStream = prev.find((s) => s.id === stream.id);
          if (!foundStream) {
            foundStream = stream;
          }
          foundStream.addTrack(track);
          return [...prev.filter((s) => s.id != stream.id), foundStream];
        });
      });
    };

    //handle offer
    this.rtc.onnegotiationneeded = async () => {
      try {
        makingOffer = true;
        await this.rtc!.setLocalDescription();
        this.signaler.sendOffer(this.rtc!.localDescription!);
      } catch (err) {
        throw err;
      } finally {
        makingOffer = false;
      }
    };

    // handle connection restart
    this.rtc.oniceconnectionstatechange = () => {
      if (this.rtc!.iceConnectionState === "failed") {
        this.rtc!.restartIce();
      }
    };

    // handle ICE candidates
    this.rtc.onicecandidate = ({ candidate }) =>
      this.signaler.sendICE(candidate!);
  }
}
