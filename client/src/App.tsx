import { RoomAck, RTC } from "./lib";
import { useEffect, useMemo, useState } from "react";
import Video from "./Video";

const socketURL = "http://192.168.29.248:3000";

function App() {
  const [roomID, setRoomID] = useState("");
  const [genRoomID, setGenRoomID] = useState<string | null>();
  const [streams, setStreams] = useState<MediaStream[]>([]);

  const roomJoinedCallback = useMemo(
    () => (roomAck: RoomAck) => {
      setGenRoomID(roomAck.roomID);
    },
    []
  );
  const rtc = useMemo(
    () => new RTC(socketURL, roomJoinedCallback, setStreams),
    []
  );

  useEffect(() => {
    const selfVideo: HTMLVideoElement = document.querySelector("video.self")!;

    rtc.bindVideo(selfVideo);

    return rtc.close();
  }, []);

  streams.forEach((stream) => {
    stream.onremovetrack = () => {
      if (!stream.active)
        setStreams((prev) => prev.filter((s) => s.id != stream.id));
    };
  });

  return (
    <div className="App">
      {streams.map(
        (stream) =>
          stream.active && (
            <Video autoPlay width={500} height={500} srcObject={stream} />
          )
      )}
      <video className="self" autoPlay width={500} height={500} />
      {genRoomID && <div>{genRoomID}</div>}
      <label htmlFor="roomID">Enter room ID</label>
      <input
        type="text"
        name="roomID"
        title="roomID"
        value={roomID}
        onChange={({ target }) => setRoomID(target.value)}
      />
      <button
        onClick={() => {
          rtc.joinRoom(roomID);
        }}
      >
        JOIN ROOM
      </button>
      <button onClick={() => rtc.createRoom()}>CREATE ROOM</button>
    </div>
  );
}

export default App;
