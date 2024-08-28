import wrtc from "@roamhq/wrtc";
import { Socket } from "socket.io";

import {
  Mapping,
  SocketEvent,
  Config,
  StreamMapping,
  Codecs,
  Senders,
  MemDB,
  RTCUser,
} from "../types";
import logger from "../lib/logger";

export class ServerRTC {
  rtc: wrtc.RTCPeerConnection;
  memDB: MemDB;
  roomID: string;
  socket: Socket;
  makingOffer = false;
  ownedStreams: Set<string> = new Set();
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

  constructor(socket: Socket, roomID: string, memDB: MemDB, config?: Config) {
    if (config) this.config = config;
    this.rtc = new wrtc.RTCPeerConnection({
      ...this.config,
      iceCandidatePoolSize: 64,
    });

    this.memDB = memDB;

    this.socket = socket;
    this.roomID = roomID;

    this.init();
    this.setupListeners();
    this.setupSocketListeners();
  }

  free() {
    // remove all senders of this socket from all other clients
    try {
      logger.error("calling free");

      Object.entries(this.memDB.rooms[this.roomID]).forEach(
        ([socketID, { rtc, trackEvents }]) => {}
        // call remove streams and close tranceivers for all peers
      );

      delete this.memDB.rooms[this.roomID][this.socket.id];
      this.socket.disconnect();
      this.rtc.close();
    } catch (err) {
      logger.error(err);
    }
  }

  private init() {
    this.socket.join(this.roomID);

    // all other properties will be init on socket pconnection
    this.memDB.rooms[this.roomID][this.socket.id].rtc = this;
  }

  private _onjoinroom() {
    // _addtrack for each event in trackEvents of each peer
    const streamOwners = [] as { user?: RTCUser; streams: string[] }[];

    Object.entries(this.memDB.rooms[this.roomID]).forEach(
      ([socketID, { trackEvents, rtc }]) => {
        if (socketID === this.socket.id) return;

        trackEvents.forEach((event) => this._addtrack(event, this));
        const streams = rtc?.ownedStreams;
        if (streams) {
          streamOwners.push({
            user: this.memDB.socketInfo.get(socketID)?.user,
            streams: Array.from(streams),
          });
        }
      }
    );

    this.socket.emit(SocketEvent.NewStreams, streamOwners);
  }

  private _addtrack(event: RTCTrackEvent, rtc: ServerRTC) {
    try {
      event.streams.forEach((stream) => {
        rtc.rtc.addTrack(event.track, stream);
      });
    } catch (err) {
      logger.error(err);
    }
  }

  private setupListeners() {
    try {
      this.rtc.onconnectionstatechange = () => {
        logger.info(this.rtc.connectionState);
        if (this.rtc.connectionState === "connected") {
          this._onjoinroom();
        }
      };

      // handle incoming remote tracks
      this.rtc.ontrack = (event) => {
        // rtpReceiver is automatically added to the rtc
        // insert trackevent to trackevents to be used on later connections
        this.memDB.rooms[this.roomID][this.socket.id].trackEvents.set(
          event.track.id,
          event
        );

        // insert stream in streams
        event.streams.forEach((stream) => {
          if (!this.ownedStreams.has(stream.id)) {
            this.ownedStreams.add(stream.id);
            this.socket.to(this.roomID).emit(SocketEvent.NewStreams, [
              {
                user: this.memDB.socketInfo.get(this.socket.id)?.user,
                streams: [stream.id],
              },
            ]);
          }
        });

        // add track to all peers
        Object.entries(this.memDB.rooms[this.roomID]).forEach(
          ([socketID, { rtc }]) => {
            if (socketID === this.socket.id) return;

            if (rtc?.rtc) this._addtrack(event, rtc);
          }
        );
      };

      // handle offer
      this.rtc.onnegotiationneeded = async () => {
        logger.info("negotiating");
        logger.info(this.rtc.connectionState);
        try {
          this.makingOffer = true;
          const offer = await this.rtc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await this.rtc.setLocalDescription(offer);
          this.socket.emit(SocketEvent.Offer, this.rtc.localDescription);
        } catch (err) {
          throw err;
        } finally {
          this.makingOffer = false;
        }
      };

      // handle connection restart
      this.rtc.oniceconnectionstatechange = () => {
        logger.error(this.rtc.iceConnectionState);
        if (this.rtc.iceConnectionState === "failed") {
          // this.rtc.restartIce();
        }
      };

      // handle ICE candidates
      this.rtc.onicecandidate = ({ candidate }) =>
        candidate && this.socket.emit(SocketEvent.ICE, candidate);
    } catch (err) {
      logger.error(err);
    }
  }

  private setupSocketListeners() {
    try {
      this.socket.on(
        SocketEvent.Offer,
        async (offer: wrtc.RTCSessionDescription) => {
          const offerCollision =
            offer.type === "offer" &&
            (this.makingOffer || this.rtc.signalingState !== "stable");

          if (offerCollision) {
            return;
          }

          await this.rtc.setRemoteDescription(offer);
          if (offer.type === "offer") {
            const answer = await this.rtc.createAnswer();
            await this.rtc.setLocalDescription(answer);
            this.socket.emit(SocketEvent.Offer, this.rtc.localDescription);
          }
          // });
        }
      );

      // on ICE candidate
      this.socket.on(SocketEvent.ICE, (candidate: wrtc.RTCIceCandidate) => {
        if (!candidate) return;

        this.rtc.addIceCandidate(candidate);
      });

      // remove RTC
      this.socket.on(SocketEvent.Disconnect, () => {
        this.free();
      });
    } catch (err) {
      logger.error(err);
    }
  }
}
