import { io, Socket } from "socket.io-client";
import {
  Config,
  Constraints,
  RoomAck,
  RTCUser,
  SocketEvent,
} from "../../types";

export class RTC {
  rtc?: RTCPeerConnection;
  setRemoteTrack: React.Dispatch<React.SetStateAction<MediaStream[]>>;
  setRemoteUsers: React.Dispatch<
    React.SetStateAction<
      {
        user: RTCUser;
        streams: string[];
      }[]
    >
  >;
  stream: MediaStream;
  constraints: Constraints;
  socket: Socket;
  isPolite: boolean;
  makingOffer = false;
  ignoreOffer = false;
  private onRoomJoinedCallback: (roomAck: RoomAck) => void;
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
    stream: MediaStream,
    onRoomJoinedCallback: (roomAck: RoomAck) => void,
    setRemoteTrack: React.Dispatch<React.SetStateAction<MediaStream[]>>,
    setRemoteUsers: React.Dispatch<
      React.SetStateAction<
        {
          user: RTCUser;
          streams: string[];
        }[]
      >
    >,
    config?: Config,
    constraints: Constraints = { audio: true, video: true },
  ) {
    if (config) this.config = config;
    this.socket = io(`${process.env.REACT_APP_BACKEND}`, {
      withCredentials: true,
    });
    this.stream = stream;
    this.setRemoteTrack = setRemoteTrack;
    this.setRemoteUsers = setRemoteUsers;
    this.constraints = constraints;
    this.isPolite = false;
    this.onRoomJoinedCallback = onRoomJoinedCallback;
    this.setupSignalerListeners();
  }

  free() {
    this.socket.disconnect();
    this.stream.getTracks().forEach((track) => {
      track.stop();
      this.stream.removeTrack(track);
    });
    this.rtc?.close();
  }

  private setupSignalerListeners() {
    // on connect
    this.socket.on(SocketEvent.Connect, () => {
      this.sendConfig();
    });

    // on disconnect
    window.onbeforeunload = () => {
      this.socket.emit(SocketEvent.Disconnect);
    };

    // on ICE candidate
    this.socket.on(
      SocketEvent.ICE,
      async (candidate: RTCIceCandidate) =>
        await this.rtc!.addIceCandidate(candidate),
    );

    // on remote offer
    this.socket.on(SocketEvent.Offer, async (remoteOffer) => {
      const offerCollision =
        remoteOffer.type === "offer" &&
        (this.makingOffer || this.rtc!.signalingState !== "stable");

      this.ignoreOffer = !this.isPolite && offerCollision;
      if (this.ignoreOffer) return;

      await this.rtc!.setRemoteDescription(remoteOffer);

      if (remoteOffer.type === "offer") {
        await this.rtc!.setLocalDescription();
        this.socket.emit(SocketEvent.Offer, this.rtc!.localDescription!);
      }
    });

    // on room joined
    this.socket.on(SocketEvent.RoomJoinAck, async (roomAck: RoomAck) => {
      this.isPolite = roomAck.isPolite;
      await this.connect();
      this.onRoomJoinedCallback(roomAck);
    });

    // on new streams
    this.socket.on(
      SocketEvent.NewStreams,
      (
        streamOwners: {
          user: RTCUser;
          streams: string[];
        }[],
      ) => {
        this.setRemoteUsers((prev) => [...prev, ...streamOwners]);
      },
    );

    // on removeStream
    this.socket.on(SocketEvent.RemoveStream, (streamID: string) => {
      this.setRemoteTrack((prev) =>
        prev.filter((stream) => stream.id !== streamID),
      );
    });

    // on statusToggle
    this.socket.on(
      SocketEvent.StreamStatus,
      (status: { streamID: string; trackID: string; enabled: boolean }[]) => {
        status.forEach((st) => {
          this.setRemoteTrack((prev) => {
            prev.forEach((s) => {
              if (s.id === st.streamID && s.getTrackById(st.trackID)) {
                s.getTrackById(st.trackID)!.enabled = st.enabled;
              }
            });
            return [...prev];
          });
        });
      },
    );
  }

  replaceTrack(kind: "audio" | "video", track: MediaStreamTrack) {
    const sender = this.rtc
      ?.getSenders()
      .find((sender) => kind === sender.track?.kind);

    if (!sender) {
      this.addTrack(track);
      return;
    }

    sender?.replaceTrack(track);
    this.socket.emit(SocketEvent.StreamStatus, [
      {
        streamID: this.stream.id,
        trackID: track.id,
        enabled: track.enabled,
      },
    ]);
  }

  private sendConfig() {
    const capabilities = RTCRtpReceiver.getCapabilities("video");
    this.socket.emit(SocketEvent.Codecs, capabilities?.codecs ?? []);
  }

  get connState() {
    if (!this.rtc) return "uninit";
    return this.rtc.connectionState;
  }

  disconnect(): void {
    this.socket.disconnect();
  }

  createRoom(): void {
    this.socket.emit(SocketEvent.CreateRoom);
  }

  joinRoom(roomID: string): void {
    this.socket.emit(SocketEvent.JoinRoom, roomID);
  }

  close() {
    if (!this.rtc) return;
    this.disconnect();
    this.rtc?.close();
  }

  // add track if not sending
  // just enable if already sending
  addTrack(track: MediaStreamTrack) {
    if (!this.rtc) throw "RTC not init";

    this.rtc.addTrack(track, this.stream);
    this.socket.emit(SocketEvent.StreamStatus, [
      {
        streamID: this.stream.id,
        trackID: track.id,
        enabled: track.enabled,
      },
    ]);
  }

  initRTC() {
    this.rtc = new RTCPeerConnection({
      ...this.config,
      iceCandidatePoolSize: 64,
    });
    this.stream.getTracks().forEach((track) => {
      this.addTrack(track);
    });
    this.setupListeners();
  }

  private async connect() {
    try {
      this.makingOffer = true;
      const offer = await this.rtc?.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await this.rtc!.setLocalDescription(offer);
      this.socket.emit(SocketEvent.Offer, this.rtc!.localDescription!);
    } finally {
      this.makingOffer = false;
    }
  }

  private setupListeners() {
    if (!this.rtc) throw "RTC not init";

    this.rtc.onconnectionstatechange = () =>
      console.log({ connectionState: this.rtc?.connectionState });

    // handle incoming remote tracks
    this.rtc.ontrack = ({ streams, track }) => {
      // TODO
      streams.forEach((stream) => {
        this.setRemoteTrack((prev) => {
          let foundStream = prev.find((s) => s.id === stream.id);
          if (!foundStream) {
            foundStream = stream;
          }
          foundStream.addTrack(track);
          return [...prev.filter((s) => s.id != stream.id), foundStream];
        });
      });
    };

    //handle offer
    this.rtc.onnegotiationneeded = async () => {
      await this.connect();
    };

    // handle ICE candidates
    this.rtc.onicecandidate = ({ candidate }) =>
      candidate && this.socket.emit(SocketEvent.ICE, candidate);
  }
}
