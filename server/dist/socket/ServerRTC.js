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
        this.ownedStreams = new Set();
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
        logger_1.default.info("RTC constructor called");
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
            Object.entries(this.memDB.rooms[this.roomID]).forEach(([socketID, { rtc, trackEvents }]) => { }
            // call remove streams and close tranceivers for all peers
            );
            delete this.memDB.rooms[this.roomID][this.socket.id];
            this.socket.disconnect();
            this.rtc.close();
        }
        catch (err) {
            logger_1.default.error(err);
        }
    }
    init() {
        try {
            logger_1.default.info("init method called");
            this.socket.join(this.roomID);
            // all other properties will be init on socket pconnection
            this.memDB.rooms[this.roomID][this.socket.id].rtc = this;
        }
        catch (err) {
            logger_1.default.error(err);
        }
    }
    _onjoinroom() {
        try {
            logger_1.default.info("_onjoinroom called");
            // _addtrack for each event in trackEvents of each peer
            const streamOwners = [];
            Object.entries(this.memDB.rooms[this.roomID]).forEach(([socketID, { trackEvents, rtc }]) => {
                var _a;
                if (socketID === this.socket.id)
                    return;
                trackEvents.forEach((event) => this._addtrack(event, this));
                const streams = rtc === null || rtc === void 0 ? void 0 : rtc.ownedStreams;
                if (streams) {
                    streamOwners.push({
                        user: (_a = this.memDB.socketInfo.get(socketID)) === null || _a === void 0 ? void 0 : _a.user,
                        streams: Array.from(streams),
                    });
                }
            });
            this.socket.emit(types_1.SocketEvent.NewStreams, streamOwners);
        }
        catch (err) {
            logger_1.default.error(err);
        }
    }
    _addtrack(event, rtc) {
        try {
            logger_1.default.info("_addtrack called");
            event.streams.forEach((stream) => {
                logger_1.default.info(event.track.enabled);
                rtc.rtc.addTrack(event.track, stream);
            });
        }
        catch (err) {
            logger_1.default.error(err);
        }
    }
    setupListeners() {
        logger_1.default.info("setupListeners called");
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
                this.memDB.rooms[this.roomID][this.socket.id].trackEvents.set(event.track.id, event);
                // insert stream in streams
                event.streams.forEach((stream) => {
                    var _a;
                    if (!this.ownedStreams.has(stream.id)) {
                        this.ownedStreams.add(stream.id);
                        this.socket.to(this.roomID).emit(types_1.SocketEvent.NewStreams, [
                            {
                                user: (_a = this.memDB.socketInfo.get(this.socket.id)) === null || _a === void 0 ? void 0 : _a.user,
                                streams: [stream.id],
                            },
                        ]);
                    }
                });
                // add track to all peers
                Object.entries(this.memDB.rooms[this.roomID]).forEach(([socketID, { rtc }]) => {
                    if (socketID === this.socket.id)
                        return;
                    if (rtc === null || rtc === void 0 ? void 0 : rtc.rtc)
                        this._addtrack(event, rtc);
                });
            }
            catch (err) {
                logger_1.default.error(err);
            }
        };
        // handle offer
        this.rtc.onnegotiationneeded = () => __awaiter(this, void 0, void 0, function* () {
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
                logger_1.default.error(err);
            }
            finally {
                this.makingOffer = false;
            }
        });
        // handle ICE candidates
        this.rtc.onicecandidate = ({ candidate }) => {
            try {
                candidate && this.socket.emit(types_1.SocketEvent.ICE, candidate);
            }
            catch (err) {
                logger_1.default.error(err);
            }
        };
    }
    setupSocketListeners() {
        logger_1.default.info("setupSocketListeners called");
        this.socket.on(types_1.SocketEvent.Offer, (offer) => __awaiter(this, void 0, void 0, function* () {
            try {
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
            }
            catch (err) {
                logger_1.default.error(err);
            }
        }));
        // on ICE candidate
        this.socket.on(types_1.SocketEvent.ICE, (candidate) => {
            try {
                if (!candidate)
                    return;
                this.rtc.addIceCandidate(candidate);
            }
            catch (err) {
                logger_1.default.error(err);
            }
        });
        // remove RTC
        this.socket.on(types_1.SocketEvent.Disconnect, () => {
            try {
                this.free();
            }
            catch (err) {
                logger_1.default.error(err);
            }
        });
    }
}
exports.ServerRTC = ServerRTC;
