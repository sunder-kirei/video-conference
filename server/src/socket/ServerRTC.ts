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
    this.rtc = new wrtc.RTCPeerConnection(this.config);

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
      const outGoingStreams =
        this.memDB.rooms[this.roomID][this.socket.id].outgoingStreams;

      outGoingStreams.forEach((stream, streamID) => {
        Object.entries(this.memDB.rooms[this.roomID]).forEach(
          ([socketID, srtc]) => {
            srtc.rtc?.socket.emit(SocketEvent.RemoveStream, streamID);
          }
        );
      });

      const outgoingSenders =
        this.memDB.rooms[this.roomID][this.socket.id].outgoingSenders;

      Object.entries(outgoingSenders).forEach(([socketID, senders]) => {
        senders.forEach((sender) =>
          this.memDB.rooms[this.roomID][socketID].rtc?.rtc.removeTrack(sender)
        );
      });
    } catch (err) {
      logger.error(err);
    }

    this.rtc.close();
    this.socket.disconnect();

    this.memDB.rooms[this.roomID][this.socket.id] = {
      outgoingSenders: {},
      outgoingStreams: new Map(),
    };
  }

  private init() {
    this.socket.join(this.roomID);

    // all other properties will be init on socket connection
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

  private _addSender(
    trackID: string,
    sender: wrtc.RTCRtpSender,
    streamOwner: string,
    receiver: ServerRTC
  ) {
    try {
      console.log("calling add sender", trackID);
      if (
        !this.memDB.rooms[this.roomID][streamOwner].outgoingSenders[
          receiver.socket.id
        ]
      ) {
        this.memDB.rooms[this.roomID][streamOwner].outgoingSenders[
          receiver.socket.id
        ] = new Map();
      }
      this.memDB.rooms[this.roomID][streamOwner].outgoingSenders[
        receiver.socket.id
      ].set(trackID, sender);
    } catch (err) {
      logger.error(err);
    }
  }

  private _sendStream(
    track: wrtc.MediaStreamTrack,
    stream: wrtc.MediaStream,
    streamOwner: RTCUser,
    receiver: ServerRTC
  ) {
    try {
      const sender = receiver.rtc.addTrack(track, stream);
      receiver.socket.emit(SocketEvent.NewStream, {
        streamID: stream.id,
        user: streamOwner,
      });
      return sender;
    } catch (err) {
      logger.error(err);
    }
  }

  private joinRoom() {
    // send all media streams to new peer,
    // also add its RTCSender to the stream owner
    Object.entries(this.memDB.rooms[this.roomID]).forEach(
      ([streamOwner, data]) => {
        if (streamOwner === this.socket.id) return;

        data.outgoingStreams.forEach((stream) => {
          stream.getTracks().forEach((track) => {
            const sender = this._sendStream(
              track,
              stream,
              this.memDB.socketInfo.get(streamOwner)!.user,
              this
            );
            if (sender) this._addSender(track.id, sender, streamOwner, this);
          });
        });
      }
    );
  }

  private setupListeners() {
    try {
      let makingOffer = false;

      this.rtc.onconnectionstatechange = () => {
        logger.info(this.rtc.connectionState);
        if (this.rtc.connectionState === "connected") {
          this.joinRoom();
        }
        if (this.rtc.connectionState === "closed") {
          this.free();
        }
      };

      // handle incoming remote tracks
      this.rtc.ontrack = ({ streams, track }) => {
        streams.forEach((stream) => {
          // store streams
          logger.info(track);
          this.memDB.rooms[this.roomID][this.socket.id].outgoingStreams.set(
            stream.id,
            stream
          );
          stream.addTrack(track);

          // send streams to all peers
          Object.entries(this.memDB.rooms[this.roomID]).forEach(
            ([receiverID, data]) => {
              if (receiverID === this.socket.id) return;

              if (data.rtc) {
                const sender = this._sendStream(
                  track,
                  stream,
                  this.memDB.socketInfo.get(this.socket.id)!.user,
                  data.rtc
                );
                if (sender)
                  this._addSender(track.id, sender, this.socket.id, data.rtc);
              }
            }
          );
        });
      };

      // handle offer
      this.rtc.onnegotiationneeded = async () => {
        if (this.rtc.connectionState === "closed") {
          this.free();
          return;
        }
        try {
          makingOffer = true;
          const offer = await this.rtc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
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

      // remove RTC
      this.rtc.oniceconnectionstatechange = () => {
        if (this.rtc.iceConnectionState === "disconnected") {
          this.free();
        }
      };
    } catch (err) {
      logger.error(err);
    }
  }

  private setupSocketListeners() {
    this.socket.on(
      SocketEvent.Offer,
      async (offer: wrtc.RTCSessionDescription) => {
        const rtc = this.rtc;

        let makingOffer = false;

        const offerCollision =
          offer.type === "offer" &&
          (makingOffer || this.rtc.signalingState !== "stable");

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

    this.socket.on(SocketEvent.RemoveTrack, (trackID: string) => {
      try {
        const outgoingSenders =
          this.memDB.rooms[this.roomID][this.socket.id].outgoingSenders;
        Object.entries(outgoingSenders).forEach(([socketID, senders]) => {
          senders.forEach((sender, senderTrackID) => {
            logger.info({ senderID: senderTrackID, trackID });
            if (senderTrackID === trackID) {
              sender.track?.stop();
              this.memDB.rooms[this.roomID][socketID].rtc?.rtc.removeTrack(
                sender
              );
              console.log("removetrackevent");

              this.memDB.rooms[this.roomID][socketID].rtc?.socket.emit(
                SocketEvent.RemoveTrack,
                trackID
              );
            }
          });
        });
      } catch (err) {
        logger.error(err);
      }
    });

    // remove RTC
    this.socket.on(SocketEvent.Disconnect, () => {
      this.free();
    });
  }
}
