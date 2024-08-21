"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerRTC = void 0;
const wrtc_1 = __importDefault(require("@roamhq/wrtc"));
const types_1 = require("../types");
const logger_1 = __importDefault(require("../lib/logger"));
class ServerRTC {
    constructor(socket, roomID, 
    // mappings: Mapping,
    // codecs: Codecs,
    // senders: Senders,
    // streamMappings: StreamMapping,
    memDB, config) {
        this.config = {
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
        if (config)
            this.config = config;
        this.rtc = new wrtc_1.default.RTCPeerConnection(this.config);
        // this.mappings = mappings;
        // this.streamMappings = streamMappings;
        // this.codecs = codecs;
        // this.senders = senders;
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
            const outgoingSenders = this.memDB.rooms[this.roomID][this.socket.id].outgoingSenders;
            Object.entries(outgoingSenders).forEach(([socketID, senders]) => {
                senders.forEach((sender) => { var _a; return (_a = this.memDB.rooms[this.roomID][socketID].rtc) === null || _a === void 0 ? void 0 : _a.rtc.removeTrack(sender); });
            });
        }
        catch (err) {
            logger_1.default.error(err);
        }
        // if (this.senders[this.socket.id]) {
        //   this.senders[this.socket.id].forEach((sender) => {
        //     Object.entries(this.mappings[this.roomID]).forEach(([id, srtc]) => {
        //       if (id === this.socket.id) return;
        //       try {
        //         srtc.rtc.removeTrack(sender);
        //       } catch (err) {
        //         logger.warn("error at remove track");
        //       }
        //     });
        //   });
        // }
        this.rtc.close();
        this.socket.disconnect();
        this.memDB.rooms[this.roomID][this.socket.id] = {
            outgoingSenders: {},
            outgoingStreams: new Map(),
        };
        // delete this.mappings[this.roomID][this.socket.id];
        // delete this.streamMappings[this.roomID][this.socket.id];
        // delete this.codecs[this.socket.id];
    }
    init() {
        this.socket.join(this.roomID);
        // all other properties will be init on socket connection
        this.memDB.rooms[this.roomID][this.socket.id].rtc = this;
        // this.mappings[this.roomID] = {
        //   ...this.mappings[this.roomID],
        //   [this.socket.id]: this,
        // };
        // this.streamMappings[this.roomID] = {
        //   ...this.streamMappings[this.roomID],
        //   [this.socket.id]: new Map(),
        // };
    }
    addSVC(sender) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    _addSender(sender, streamOwner, receiver) {
        if (!this.memDB.rooms[this.roomID][streamOwner].outgoingSenders[receiver.socket.id]) {
            this.memDB.rooms[this.roomID][streamOwner].outgoingSenders[receiver.socket.id] = new Set();
        }
        this.memDB.rooms[this.roomID][streamOwner].outgoingSenders[receiver.socket.id].add(sender);
    }
    _sendStream(track, stream, streamOwner, receiver) {
        const sender = receiver.rtc.addTrack(track, stream);
        receiver.socket.emit(types_1.SocketEvent.NewStream, {
            streamID: stream.id,
            user: streamOwner,
        });
        return sender;
    }
    joinRoom() {
        // send all media streams to new peer,
        // also add its RTCSender to the stream owner
        Object.entries(this.memDB.rooms[this.roomID]).forEach(([streamOwner, data]) => {
            if (streamOwner === this.socket.id)
                return;
            data.outgoingStreams.forEach((stream) => {
                stream.getTracks().forEach((track) => {
                    const sender = this._sendStream(track, stream, this.memDB.socketInfo.get(streamOwner).user, this);
                    this._addSender(sender, streamOwner, this);
                });
            });
        });
        // Object.entries(this.streamMappings[this.roomID]).forEach((value) => {
        //   const [id, map] = value;
        //   if (id === this.socket.id) return;
        //   map.forEach((stream) => {
        //     stream.getTracks().forEach((track) => {
        //       const sender = this.rtc.addTrack(track, stream);
        //       if (this.senders[id]) this.senders[id].add(sender);
        //       else this.senders[id] = new Set([sender]);
        //       this.addSVC(sender);
        //     });
        //   });
        // });
    }
    setupListeners() {
        try {
            let makingOffer = false;
            this.rtc.onconnectionstatechange = () => {
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
                    this.memDB.rooms[this.roomID][this.socket.id].outgoingStreams.set(stream.id, stream);
                    stream.addTrack(track);
                    // send streams to all peers
                    Object.entries(this.memDB.rooms[this.roomID]).forEach(([receiverID, data]) => {
                        if (receiverID === this.socket.id)
                            return;
                        if (data.rtc) {
                            const sender = this._sendStream(track, stream, this.memDB.socketInfo.get(this.socket.id).user, data.rtc);
                            this._addSender(sender, this.socket.id, data.rtc);
                        }
                    });
                    // if (!this.streamMappings[this.roomID][this.socket.id].has(stream.id)) {
                    //   this.streamMappings[this.roomID][this.socket.id].set(
                    //     stream.id,
                    //     stream
                    //   );
                    // }
                    // stream.addTrack(track);
                    // Object.entries(this.mappings[this.roomID]).forEach((value) => {
                    //   const id = value[0],
                    //     srtc = value[1];
                    //   if (id === this.socket.id) return;
                    //   // TODO
                    //   const sender = srtc.rtc.addTrack(track, stream);
                    //   if (this.senders[this.socket.id])
                    //     this.senders[this.socket.id].add(sender);
                    //   else this.senders[this.socket.id] = new Set([sender]);
                    //   this.addSVC(sender);
                    // });
                });
            };
            // handle offer
            this.rtc.onnegotiationneeded = () => __awaiter(this, void 0, void 0, function* () {
                if (this.rtc.connectionState === "closed") {
                    this.free();
                    return;
                }
                try {
                    makingOffer = true;
                    const offer = yield this.rtc.createOffer();
                    yield this.rtc.setLocalDescription(offer);
                    this.socket.emit(types_1.SocketEvent.Offer, this.rtc.localDescription);
                }
                catch (err) {
                    throw err;
                }
                finally {
                    makingOffer = false;
                }
            });
            // handle connection restart
            this.rtc.oniceconnectionstatechange = () => {
                if (this.rtc.iceConnectionState === "failed") {
                    this.rtc.restartIce();
                }
            };
            // handle ICE candidates
            this.rtc.onicecandidate = ({ candidate }) => this.socket.emit(types_1.SocketEvent.ICE, candidate);
            // remove RTC
            this.rtc.oniceconnectionstatechange = () => {
                if (this.rtc.iceConnectionState === "disconnected") {
                    this.free();
                }
            };
        }
        catch (err) {
            logger_1.default.error(err);
        }
    }
    setupSocketListeners() {
        this.socket.on(types_1.SocketEvent.Offer, (offer) => __awaiter(this, void 0, void 0, function* () {
            // this.socket.rooms.forEach(async (roomID, _) => {
            // if (roomID === this.socket.id) return;
            // const rtc = this.memDB[roomID][this.socket.id];
            const rtc = this.rtc;
            let makingOffer = false;
            const offerCollision = offer.type === "offer" &&
                (makingOffer || this.rtc.signalingState !== "stable");
            if (offerCollision)
                return;
            yield this.rtc.setRemoteDescription(offer);
            if (offer.type === "offer") {
                const answer = yield this.rtc.createAnswer();
                yield this.rtc.setLocalDescription(answer);
                this.socket.emit(types_1.SocketEvent.Offer, this.rtc.localDescription);
            }
            // });
        }));
        // on ICE candidate
        this.socket.on(types_1.SocketEvent.ICE, (candidate) => {
            if (!candidate)
                return;
            // this.socket.rooms.forEach((roomID, _) => {
            // if (roomID === this.socket.id) return;
            // const rtc = this.mappings[roomID][this.socket.id];
            this.rtc.addIceCandidate(candidate);
            // });
        });
        // remove RTC
        this.socket.on(types_1.SocketEvent.Disconnect, () => {
            this.free();
        });
    }
}
exports.ServerRTC = ServerRTC;
