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
    logger.info("RTC constructor called");
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
    try {
      logger.info("init method called");
      this.socket.join(this.roomID);

      // all other properties will be init on socket pconnection
      this.memDB.rooms[this.roomID][this.socket.id].rtc = this;
    } catch (err) {
      logger.error(err);
    }
  }

  private _onjoinroom() {
    try {
      logger.info("_onjoinroom called");
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
    } catch (err) {
      logger.error(err);
    }
  }

  private _addtrack(event: RTCTrackEvent, rtc: ServerRTC) {
    try {
      logger.info("_addtrack called");
      event.streams.forEach((stream) => {
        logger.info(event.track.enabled);
        rtc.rtc.addTrack(event.track, stream);
      });
    } catch (err) {
      logger.error(err);
    }
  }

  private setupListeners() {
    logger.info("setupListeners called");
    this.rtc.onconnectionstatechange = () => {
      if (this.rtc.connectionState === "connected") {
        this._onjoinroom();
      }
    };

    // handle incoming remote tracks
    this.rtc.ontrack = (event) => {
      try {
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
      } catch (err) {
        logger.error(err);
      }
    };

    // handle offer
    this.rtc.onnegotiationneeded = async () => {
      try {
        this.makingOffer = true;
        const offer = await this.rtc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await this.rtc.setLocalDescription(offer);
        this.socket.emit(SocketEvent.Offer, this.rtc.localDescription);
      } catch (err) {
        logger.error(err);
      } finally {
        this.makingOffer = false;
      }
    };

    // handle ICE candidates
    this.rtc.onicecandidate = ({ candidate }) => {
      try {
        candidate && this.socket.emit(SocketEvent.ICE, candidate);
      } catch (err) {
        logger.error(err);
      }
    };
  }

  private setupSocketListeners() {
    logger.info("setupSocketListeners called");
    this.socket.on(
      SocketEvent.Offer,
      async (offer: wrtc.RTCSessionDescription) => {
        try {
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
        } catch (err) {
          logger.error(err);
        }
      }
    );

    // on ICE candidate
    this.socket.on(SocketEvent.ICE, (candidate: wrtc.RTCIceCandidate) => {
      try {
        if (!candidate) return;

        this.rtc.addIceCandidate(candidate);
      } catch (err) {
        logger.error(err);
      }
    });

    // remove RTC
    this.socket.on(SocketEvent.Disconnect, () => {
      try {
        this.free();
      } catch (err) {
        logger.error(err);
      }
    });
  }
}
