import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Page from "../components/ui/Page";
import StreamVideo from "../components/webRTC/StreamVideo";
import { useAppSelector } from "../hooks/redux";
import { selectMedia } from "../store/services/media";

type Props = {};

export default function Home({}: Props) {
  const [roomID, setRoomID] = useState("");
  const media = useAppSelector(selectMedia);
  const navigate = useNavigate();

  function handleSubmit() {
    navigate("/join/" + roomID);
  }

  return (
    <Page id="home-page" className="grid home-page">
      <div className="h-full w-full flex items-center p-4">
        <StreamVideo />
      </div>
      <div className="w-full h-full flex flex-col items-center justify-center gap-y-4">
        <input
          title="roomID"
          placeholder="Enter roomID to join; blank to create"
          className="p-4 max-w-96 w-full min-w-fit rounded z-10 text-xl border outline-blue-600"
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
