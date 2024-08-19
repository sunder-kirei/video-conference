import wrtc from "@roamhq/wrtc";
import { Socket } from "socket.io";

import { Mapping, SocketEvent, Config, StreamMapping } from "../types";

export class ServerRTC {
  rtc: wrtc.RTCPeerConnection;
  mappings: Mapping;
  streamMappings: StreamMapping;
  roomID: string;
  socket: Socket;
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
    socket: Socket,
    roomID: string,
    mappings: Mapping,
    streamMappings: StreamMapping,
    config?: Config
  ) {
    if (config) this.config = config;
    this.rtc = new wrtc.RTCPeerConnection(this.config);

    this.mappings = mappings;
    this.streamMappings = streamMappings;
    this.socket = socket;
    this.roomID = roomID;

    this.init();
    this.setupListeners();
    this.setupSocketListeners();
  }

  private init() {
    this.socket.join(this.roomID);

    this.mappings[this.roomID] = {
      ...this.mappings[this.roomID],
      [this.socket.id]: this,
    };
    this.streamMappings[this.roomID] = {
      ...this.streamMappings[this.roomID],
      [this.socket.id]: new Map(),
    };
  }

  private joinRoom() {
    Object.entries(this.streamMappings[this.roomID]).forEach((value) => {
      const [id, map] = value;
      if (id === this.socket.id) return;

      map.forEach((stream) => {
        stream.getTracks().forEach((track) => {
          this.rtc.addTrack(track, stream);
        });
      });
    });
  }

  private setupListeners() {
    let makingOffer = false;

    this.rtc.onconnectionstatechange = () => {
      if (this.rtc.connectionState == "connected") {
        this.joinRoom();
      }
    };

    // handle incoming remote tracks
    this.rtc.ontrack = ({ streams, track }) => {
      streams.forEach((stream) => {
        // store streams
        if (!this.streamMappings[this.roomID][this.socket.id].has(stream.id)) {
          this.streamMappings[this.roomID][this.socket.id].set(
            stream.id,
            stream
          );
        }
        stream.addTrack(track);

        Object.entries(this.mappings[this.roomID]).forEach((value) => {
          const id = value[0],
            srtc = value[1];
          if (id === this.socket.id) return;

          // TODO
          const sender = srtc.rtc.addTrack(track, stream);
        });
      });
    };

    // handle offer
    this.rtc.onnegotiationneeded = async () => {
      try {
        makingOffer = true;
        const offer = await this.rtc.createOffer();
        await this.rtc.setLocalDescription(offer);
        this.socket.emit(SocketEvent.Offer, this.rtc.localDescription);
      } catch (err) {
        throw err;
      } finally {
        makingOffer = false;
      }
    };

    // handle connection restart
    this.rtc.oniceconnectionstatechange = () => {
      if (this.rtc.iceConnectionState === "failed") {
        this.rtc.restartIce();
      }
    };

    // handle ICE candidates
    this.rtc.onicecandidate = ({ candidate }) =>
      this.socket.emit(SocketEvent.ICE, candidate);
  }

  private setupSocketListeners() {
    this.socket.on(
      SocketEvent.Offer,
      async (offer: wrtc.RTCSessionDescription) => {
        this.socket.rooms.forEach(async (roomID, _) => {
          if (roomID === this.socket.id) return;

          const rtc = this.mappings[roomID][this.socket.id];

          let makingOffer = false;

          const offerCollision =
            offer.type === "offer" &&
            (makingOffer || this.rtc.signalingState !== "stable");

          if (offerCollision) return;

          await this.rtc.setRemoteDescription(offer);
          if (offer.type === "offer") {
            const answer = await this.rtc.createAnswer();
            await this.rtc.setLocalDescription(answer);
            this.socket.emit(SocketEvent.Offer, this.rtc.localDescription);
          }
        });
      }
    );

    // on ICE candidate
    this.socket.on(SocketEvent.ICE, (candidate: wrtc.RTCIceCandidate) => {
      if (!candidate) return;
      this.socket.rooms.forEach((roomID, _) => {
        if (roomID === this.socket.id) return;

        const rtc = this.mappings[roomID][this.socket.id];
        this.rtc.addIceCandidate(candidate);
      });
    });
  }
}
