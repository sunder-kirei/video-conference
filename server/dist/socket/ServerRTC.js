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
    constructor(socket, roomID, memDB, config) {
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
            const outGoingStreams = this.memDB.rooms[this.roomID][this.socket.id].outgoingStreams;
            outGoingStreams.forEach((stream, streamID) => {
                Object.entries(this.memDB.rooms[this.roomID]).forEach(([socketID, srtc]) => {
                    var _a;
                    (_a = srtc.rtc) === null || _a === void 0 ? void 0 : _a.socket.emit(types_1.SocketEvent.RemoveStream, streamID);
                });
            });
            const outgoingSenders = this.memDB.rooms[this.roomID][this.socket.id].outgoingSenders;
            Object.entries(outgoingSenders).forEach(([socketID, senders]) => {
                senders.forEach((sender) => { var _a; return (_a = this.memDB.rooms[this.roomID][socketID].rtc) === null || _a === void 0 ? void 0 : _a.rtc.removeTrack(sender); });
            });
        }
        catch (err) {
            logger_1.default.error(err);
        }
        this.rtc.close();
        this.socket.disconnect();
        this.memDB.rooms[this.roomID][this.socket.id] = {
            outgoingSenders: {},
            outgoingStreams: new Map(),
        };
    }
    init() {
        this.socket.join(this.roomID);
        // all other properties will be init on socket connection
        this.memDB.rooms[this.roomID][this.socket.id].rtc = this;
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
    _addSender(trackID, sender, streamOwner, receiver) {
        try {
            console.log("calling add sender", trackID);
            if (!this.memDB.rooms[this.roomID][streamOwner].outgoingSenders[receiver.socket.id]) {
                this.memDB.rooms[this.roomID][streamOwner].outgoingSenders[receiver.socket.id] = new Map();
            }
            this.memDB.rooms[this.roomID][streamOwner].outgoingSenders[receiver.socket.id].set(trackID, sender);
        }
        catch (err) {
            logger_1.default.error(err);
        }
    }
    _sendStream(track, stream, streamOwner, receiver) {
        try {
            const sender = receiver.rtc.addTrack(track, stream);
            receiver.socket.emit(types_1.SocketEvent.NewStream, {
                streamID: stream.id,
                user: streamOwner,
            });
            return sender;
        }
        catch (err) {
            logger_1.default.error(err);
        }
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
                    if (sender)
                        this._addSender(track.id, sender, streamOwner, this);
                });
            });
        });
    }
    setupListeners() {
        try {
            let makingOffer = false;
            this.rtc.onconnectionstatechange = () => {
                logger_1.default.info(this.rtc.connectionState);
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
                    logger_1.default.info(track);
                    this.memDB.rooms[this.roomID][this.socket.id].outgoingStreams.set(stream.id, stream);
                    stream.addTrack(track);
                    // send streams to all peers
                    Object.entries(this.memDB.rooms[this.roomID]).forEach(([receiverID, data]) => {
                        if (receiverID === this.socket.id)
                            return;
                        if (data.rtc) {
                            const sender = this._sendStream(track, stream, this.memDB.socketInfo.get(this.socket.id).user, data.rtc);
                            if (sender)
                                this._addSender(track.id, sender, this.socket.id, data.rtc);
                        }
                    });
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
                    const offer = yield this.rtc.createOffer({
                        offerToReceiveAudio: true,
                        offerToReceiveVideo: true,
                    });
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
            const rtc = this.rtc;
            let makingOffer = false;
            const offerCollision = offer.type === "offer" &&
                (makingOffer || this.rtc.signalingState !== "stable");
            if (offerCollision) {
                return;
            }
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
            this.rtc.addIceCandidate(candidate);
        });
        this.socket.on(types_1.SocketEvent.RemoveTrack, (trackID) => {
            try {
                const outgoingSenders = this.memDB.rooms[this.roomID][this.socket.id].outgoingSenders;
                Object.entries(outgoingSenders).forEach(([socketID, senders]) => {
                    senders.forEach((sender, senderTrackID) => {
                        var _a, _b, _c;
                        logger_1.default.info({ senderID: senderTrackID, trackID });
                        if (senderTrackID === trackID) {
                            (_a = sender.track) === null || _a === void 0 ? void 0 : _a.stop();
                            (_b = this.memDB.rooms[this.roomID][socketID].rtc) === null || _b === void 0 ? void 0 : _b.rtc.removeTrack(sender);
                            console.log("removetrackevent");
                            (_c = this.memDB.rooms[this.roomID][socketID].rtc) === null || _c === void 0 ? void 0 : _c.socket.emit(types_1.SocketEvent.RemoveTrack, trackID);
                        }
                    });
                });
            }
            catch (err) {
                logger_1.default.error(err);
            }
        });
        // remove RTC
        this.socket.on(types_1.SocketEvent.Disconnect, () => {
            this.free();
        });
    }
}
exports.ServerRTC = ServerRTC;
