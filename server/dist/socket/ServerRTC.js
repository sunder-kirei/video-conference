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
        this.makingOffer = false;
        this.config = {
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
        if (config)
            this.config = config;
        this.rtc = new wrtc_1.default.RTCPeerConnection(Object.assign(Object.assign({}, this.config), { iceCandidatePoolSize: 64 }));
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
            logger_1.default.error("calling free");
            const recievers = this.rtc.getReceivers();
            Object.entries(this.memDB.rooms[this.roomID]).forEach(([socketID, { rtc, trackEvents }]) => {
                recievers.forEach((receiver) => {
                    // 1. find the transceiver sending this track to the peer
                    const transceiver = rtc === null || rtc === void 0 ? void 0 : rtc.rtc.getTransceivers().find((t) => { var _a; return ((_a = t.sender.track) === null || _a === void 0 ? void 0 : _a.id) === receiver.track.id; });
                    if (!transceiver)
                        throw "transceiver not found to remove track from.";
                    // 2. remove the sender from sent tracks and call SocketEvent.RemoveTrack          });
                });
            });
            delete this.memDB.rooms[this.roomID][this.socket.id];
            this.socket.disconnect();
            this.rtc.close();
        }
        catch (err) {
            logger_1.default.error(err);
        }
    }
    init() {
        this.socket.join(this.roomID);
        // all other properties will be init on socket pconnection
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
    _onjoinroom() {
        // _addtrack for each event in trackEvents of each peer
        Object.entries(this.memDB.rooms[this.roomID]).forEach(([socketID, { trackEvents }]) => {
            trackEvents.forEach((event) => this._addtrack(event, this));
        });
    }
    _restartConn() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (this.rtc.signalingState === "stable") {
                const offer = yield ((_a = this.rtc) === null || _a === void 0 ? void 0 : _a.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true,
                }));
                yield ((_b = this.rtc) === null || _b === void 0 ? void 0 : _b.setLocalDescription(offer));
            }
        });
    }
    _addtrack(event, rtc) {
        try {
            event.streams.forEach((stream) => {
                logger_1.default.info("_addtrack");
                rtc.rtc.addTrack(event.track, stream);
            });
            logger_1.default.info(rtc.rtc.getSenders());
        }
        catch (err) {
            logger_1.default.error(err);
        }
    }
    setupListeners() {
        try {
            this.rtc.onconnectionstatechange = () => {
                logger_1.default.info(this.rtc.connectionState);
                if (this.rtc.connectionState === "connected") {
                    this._onjoinroom();
                }
                // if (this.rtc.connectionState === "failed") this.rtc.restartIce();
            };
            // handle incoming remote tracks
            this.rtc.ontrack = (event) => {
                logger_1.default.info("ontrack");
                // rtpReceiver is automatically added to the rtc
                // insert trackevent to trackevents to be used on later connections
                this.memDB.rooms[this.roomID][this.socket.id].trackEvents.set(event.track.id, event);
                // add track to all peers
                Object.entries(this.memDB.rooms[this.roomID]).forEach(([socketID, { rtc }]) => {
                    if (rtc === null || rtc === void 0 ? void 0 : rtc.rtc)
                        this._addtrack(event, rtc);
                });
            };
            // handle offer
            this.rtc.onnegotiationneeded = () => __awaiter(this, void 0, void 0, function* () {
                logger_1.default.info("negotiating");
                logger_1.default.info(this.rtc.connectionState);
                try {
                    this.makingOffer = true;
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
                    this.makingOffer = false;
                }
            });
            // handle connection restart
            this.rtc.oniceconnectionstatechange = () => {
                logger_1.default.error(this.rtc.iceConnectionState);
                if (this.rtc.iceConnectionState === "failed") {
                    // this.rtc.restartIce();
                }
            };
            // handle ICE candidates
            this.rtc.onicecandidate = ({ candidate }) => candidate && this.socket.emit(types_1.SocketEvent.ICE, candidate);
        }
        catch (err) {
            logger_1.default.error(err);
        }
    }
    setupSocketListeners() {
        try {
            this.socket.on(types_1.SocketEvent.Offer, (offer) => __awaiter(this, void 0, void 0, function* () {
                const offerCollision = offer.type === "offer" &&
                    (this.makingOffer || this.rtc.signalingState !== "stable");
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
            // remove RTC
            this.socket.on(types_1.SocketEvent.Disconnect, () => {
                this.free();
            });
        }
        catch (err) {
            logger_1.default.error(err);
        }
    }
}
exports.ServerRTC = ServerRTC;
