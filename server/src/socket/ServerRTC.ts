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
  config: Config = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      // { urls: "stun:stun.l.google.com:5349" },
      // { urls: "stun:stun1.l.google.com:3478" },
      // { urls: "stun:stun1.l.google.com:5349" },
      // { urls: "stun:stun2.l.google.com:19302" },
      // { urls: "stun:stun2.l.google.com:5349" },
      // { urls: "stun:stun3.l.google.com:3478" },
      // { urls: "stun:stun3.l.google.com:5349" },
      // { urls: "stun:stun4.l.google.com:19302" },
      // { urls: "stun:stun4.l.google.com:5349" },
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
      const recievers = this.rtc.getReceivers();

      Object.entries(this.memDB.rooms[this.roomID]).forEach(
        ([socketID, { rtc, trackEvents }]) => {
          recievers.forEach((receiver) => {
            // 1. find the transceiver sending this track to the peer
            const transceiver = rtc?.rtc
              .getTransceivers()
              .find((t) => t.sender.track?.id === receiver.track.id);
            if (!transceiver)
              throw "transceiver not found to remove track from.";

            // 2. remove the sender from sent tracks and call SocketEvent.RemoveTrack          });
          });
        }
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

  private async addSVC(sender: wrtc.RTCRtpSender) {
    return;
    // if (
    //   this.codecs[this.socket.id].some(
    //     (codec) => codec.mimeType === "video/VP9"
    //   )
    // ) {
    //   const parameters = sender.getParameters();
    //   parameters.encodings = [
    //     {
    //       rid: "high",
    //       maxBitrate: 5000000, // 5 Mbps
    //       scaleResolutionDownBy: 1.0,
    //     },
    //     {
    //       rid: "medium",
    //       maxBitrate: 2500000, // 2.5 Mbps
    //       scaleResolutionDownBy: 2.0,
    //     },
    //     {
    //       rid: "low",
    //       maxBitrate: 1000000, // 1 Mbps
    //       scaleResolutionDownBy: 4.0,
    //     },
    //   ];

    //   await sender.setParameters(parameters);
    // }
  }

  private _onjoinroom() {
    // _addtrack for each event in trackEvents of each peer
    Object.entries(this.memDB.rooms[this.roomID]).forEach(
      ([socketID, { trackEvents }]) => {
        trackEvents.forEach((event) => this._addtrack(event, this));
      }
    );
  }

  private async _restartConn() {
    if (this.rtc.signalingState === "stable") {
      const offer = await this.rtc?.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await this.rtc?.setLocalDescription(offer);
    }
  }

  private _addtrack(event: RTCTrackEvent, rtc: ServerRTC) {
    try {
      event.streams.forEach((stream) => {
        logger.info("_addtrack");
        rtc.rtc.addTrack(event.track, stream);
      });
      logger.info(rtc.rtc.getSenders());
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
        // if (this.rtc.connectionState === "failed") this.rtc.restartIce();
      };

      // handle incoming remote tracks
      this.rtc.ontrack = (event) => {
        logger.info("ontrack");
        // rtpReceiver is automatically added to the rtc
        // insert trackevent to trackevents to be used on later connections
        this.memDB.rooms[this.roomID][this.socket.id].trackEvents.set(
          event.track.id,
          event
        );

        // add track to all peers
        Object.entries(this.memDB.rooms[this.roomID]).forEach(
          ([socketID, { rtc }]) => {
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
