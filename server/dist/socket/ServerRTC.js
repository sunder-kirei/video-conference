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
class ServerRTC {
    constructor(socket, roomID, mappings, codecs, senders, streamMappings, config) {
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
        this.mappings = mappings;
        this.streamMappings = streamMappings;
        this.codecs = codecs;
        this.senders = senders;
        this.socket = socket;
        this.roomID = roomID;
        this.init();
        this.setupListeners();
        this.setupSocketListeners();
    }
    free() {
        if (this.senders[this.socket.id]) {
            this.senders[this.socket.id].forEach((sender) => {
                Object.entries(this.mappings[this.roomID]).forEach(([id, srtc]) => {
                    if (id === this.socket.id)
                        return;
                    try {
                        srtc.rtc.removeTrack(sender);
                    }
                    catch (err) {
                        console.log("error at remove track");
                    }
                });
            });
        }
        this.rtc.close();
        this.socket.disconnect();
        delete this.mappings[this.roomID][this.socket.id];
        delete this.streamMappings[this.roomID][this.socket.id];
        delete this.codecs[this.socket.id];
    }
    init() {
        this.socket.join(this.roomID);
        this.mappings[this.roomID] = Object.assign(Object.assign({}, this.mappings[this.roomID]), { [this.socket.id]: this });
        this.streamMappings[this.roomID] = Object.assign(Object.assign({}, this.streamMappings[this.roomID]), { [this.socket.id]: new Map() });
    }
    addSVC(sender) {
        return __awaiter(this, void 0, void 0, function* () {
            return;
            if (this.codecs[this.socket.id].some((codec) => codec.mimeType === "video/VP9")) {
                const parameters = sender.getParameters();
                parameters.encodings = [
                    {
                        rid: "high",
                        maxBitrate: 5000000, // 5 Mbps
                        scaleResolutionDownBy: 1.0,
                    },
                    {
                        rid: "medium",
                        maxBitrate: 2500000, // 2.5 Mbps
                        scaleResolutionDownBy: 2.0,
                    },
                    {
                        rid: "low",
                        maxBitrate: 1000000, // 1 Mbps
                        scaleResolutionDownBy: 4.0,
                    },
                ];
                yield sender.setParameters(parameters);
            }
        });
    }
    joinRoom() {
        Object.entries(this.streamMappings[this.roomID]).forEach((value) => {
            const [id, map] = value;
            if (id === this.socket.id)
                return;
            map.forEach((stream) => {
                stream.getTracks().forEach((track) => {
                    const sender = this.rtc.addTrack(track, stream);
                    if (this.senders[id])
                        this.senders[id].add(sender);
                    else
                        this.senders[id] = new Set([sender]);
                    this.addSVC(sender);
                });
            });
        });
    }
    setupListeners() {
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
                    this.streamMappings[this.roomID][this.socket.id].set(stream.id, stream);
                }
                stream.addTrack(track);
                Object.entries(this.mappings[this.roomID]).forEach((value) => {
                    const id = value[0], srtc = value[1];
                    if (id === this.socket.id)
                        return;
                    // TODO
                    const sender = srtc.rtc.addTrack(track, stream);
                    if (this.senders[this.socket.id])
                        this.senders[this.socket.id].add(sender);
                    else
                        this.senders[this.socket.id] = new Set([sender]);
                    this.addSVC(sender);
                });
            });
        };
        // handle offer
        this.rtc.onnegotiationneeded = () => __awaiter(this, void 0, void 0, function* () {
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
    setupSocketListeners() {
        this.socket.on(types_1.SocketEvent.Offer, (offer) => __awaiter(this, void 0, void 0, function* () {
            this.socket.rooms.forEach((roomID, _) => __awaiter(this, void 0, void 0, function* () {
                if (roomID === this.socket.id)
                    return;
                const rtc = this.mappings[roomID][this.socket.id];
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
            }));
        }));
        // on ICE candidate
        this.socket.on(types_1.SocketEvent.ICE, (candidate) => {
            if (!candidate)
                return;
            this.socket.rooms.forEach((roomID, _) => {
                if (roomID === this.socket.id)
                    return;
                const rtc = this.mappings[roomID][this.socket.id];
                this.rtc.addIceCandidate(candidate);
            });
        });
        // remove RTC
        this.socket.on(types_1.SocketEvent.Disconnect, () => {
            this.free();
        });
    }
}
exports.ServerRTC = ServerRTC;
