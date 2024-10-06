import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Page from "../components/ui/Page";
import StreamVideo from "../components/webRTC/StreamVideo";

export default function Home() {
  const [roomID, setRoomID] = useState("");
  const navigate = useNavigate();

  function handleSubmit() {
    navigate("/join/" + roomID);
  }

  return (
    <Page id="home-page" className="home-page grid">
      <div className="flex h-full w-full items-center p-4">
        <StreamVideo />
      </div>
      <div className="flex h-full w-full flex-col items-center justify-center gap-y-4">
        <input
          title="roomID"
          placeholder="Enter roomID to join; blank to create"
          className="z-10 w-full min-w-fit max-w-96 rounded border p-4 text-xl outline-blue-600"
          value={roomID}
          onChange={({ target }) => setRoomID(target.value)}
        />
        <Button onClick={() => handleSubmit()}>
          {roomID.length ? "Join Room" : "Create Room"}
        </Button>
      </div>
    </Page>
  );
}
