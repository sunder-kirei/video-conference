export abstract class Signaler {
  abstract isPolite: boolean;

  abstract sendOffer(offer: RTCSessionDescription): void;
  abstract sendICE(ICEcandidate: RTCIceCandidate): void;

  abstract createRoom(): void;
  abstract joinRoom(roomID: string): void;

  abstract setupListeners(
    onRemoteOffer: (remoteOffer: RTCSessionDescription) => Promise<void>,
    onICECandidate: (ICEcandidate: RTCIceCandidate) => Promise<void>,
    onRoomJoined: (params?: any) => void
  ): void;
}
