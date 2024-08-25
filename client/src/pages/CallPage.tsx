import React, { useEffect, useState } from "react";
import Page from "../components/ui/Page";
import { useNavigate, useParams } from "react-router-dom";
import { RTC } from "../lib/webRTC/RTC";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { createRTC, selectMedia } from "../store/services/media";
import { RoomAck } from "../types";
import StreamVideo from "../components/webRTC/Video";
import { AppVideo } from "../components/webRTC/Video";

type Props = {};

function CallPage({}: Props) {
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);
  const { roomID } = useParams();
  const media = useAppSelector(selectMedia);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  function onRoomJoined(roomAck: RoomAck) {
    console.log(roomAck);
    navigate("/join/" + roomAck.roomID, {
      replace: true,
    });
  }

  useEffect(() => {
    const rtc = new RTC(media.stream, onRoomJoined, setRemoteStreams);
    console.log(rtc);
    if (roomID) {
      rtc.joinRoom(roomID);
    } else {
      rtc.createRoom();
    }

    dispatch(createRTC(rtc));
  }, []);

  return (
    <Page>
      {remoteStreams.map((stream) => (
        <AppVideo key={stream.id} srcObject={stream} playsInline autoPlay />
      ))}
      <StreamVideo />

      <button
        onClick={() => {
          remoteStreams.forEach((stream) => console.log(stream.getTracks()));
        }}
      >
        click me
      </button>
    </Page>
  );
}

export default CallPage;
