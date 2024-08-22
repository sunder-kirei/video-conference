import { io, Socket } from "socket.io-client";
import { Config, Constraints, RoomAck, SocketEvent } from "../../types";
import logger from "../logger";

export class RTC {
  rtc?: RTCPeerConnection;
  self?: HTMLVideoElement;
  setTrack: React.Dispatch<React.SetStateAction<MediaStream[]>>;
  constraints: Constraints;
  socket: Socket;
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
    onRoomJoinedCallback: (roomAck: RoomAck) => void,
    setTrack: React.Dispatch<React.SetStateAction<MediaStream[]>>,
    config?: Config,
    constraints: Constraints = { audio: true, video: true }
  ) {
    if (config) this.config = config;
    this.socket = io(process.env.REACT_APP_BACKEND!, {
      withCredentials: true,
    });
    this.setTrack = setTrack;
    this.constraints = constraints;
    this.isPolite = true;
    this.onRoomJoinedCallback = onRoomJoinedCallback;
    this.setupSignalerListeners();
  }

  private setupSignalerListeners() {
    let makingOffer = false;
    let ignoreOffer = false;

    // on connect
    this.socket.on(SocketEvent.Connect, () => {
      this.sendConfig();
    });

    // on disconnect
    window.onbeforeunload = (event) => {
      this.socket.emit(SocketEvent.Disconnect);
    };

    // on ICE candidate
    this.socket.on(
      SocketEvent.ICE,
      async (candidate: RTCIceCandidate) =>
        await this.rtc!.addIceCandidate(candidate)
    );

    // on remote offer
    this.socket.on(SocketEvent.Offer, async (remoteOffer) => {
      const offerCollision =
        remoteOffer.type === "offer" &&
        (makingOffer || this.rtc!.signalingState !== "stable");
      ignoreOffer = !this.isPolite && offerCollision;

      if (ignoreOffer) return;

      await this.rtc!.setRemoteDescription(remoteOffer);
      if (remoteOffer.type === "offer") {
        await this.rtc!.setLocalDescription();
        this.socket.emit(SocketEvent.Offer, this.rtc!.localDescription!);
      }
    });

    // on room joined
    this.socket.on(SocketEvent.RoomJoinAck, async (roomAck: RoomAck) => {
      this.isPolite = roomAck.isPolite;
      await this.initRTC();
      this.onRoomJoinedCallback(roomAck);
    });
  }

  private sendConfig() {
    const capabilities = RTCRtpReceiver.getCapabilities("video");
    this.socket.emit(SocketEvent.Codecs, capabilities?.codecs ?? []);
  }

  get connState() {
    if (!this.rtc) return "uninit";
    return this.rtc.connectionState;
  }

  disconnect(): void {
    this.socket.disconnect();
  }

  createRoom(): void {
    this.socket.emit(SocketEvent.CreateRoom);
  }

  joinRoom(roomID: string): void {
    this.socket.emit(SocketEvent.JoinRoom, roomID);
  }

  close() {
    if (!this.rtc) return;
    this.disconnect();
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

  private setupListeners() {
    if (!this.rtc) throw "RTC not init";

    let makingOffer = false;

    // handle incoming remote tracks
    this.rtc.ontrack = ({ streams, track }) => {
      // TODO
      streams.forEach((stream) => {
        logger.info(stream.id);

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
        this.socket.emit(SocketEvent.Offer, this.rtc!.localDescription!);
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
      this.socket.emit(SocketEvent.ICE, candidate!);
  }
}
