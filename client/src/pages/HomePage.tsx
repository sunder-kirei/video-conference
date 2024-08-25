import React, { LegacyRef, useEffect, useMemo, useRef, useState } from "react";
import logger from "../lib/logger";
import { io } from "socket.io-client";
import GoogleAuthButton from "../components/GoogleAuthButton/GoogleAuthButton";
import { api, selectUser } from "../store/services/user";
import store from "../store/store";
import { redirect, useLoaderData, useNavigate } from "react-router-dom";
import { RoomAck, User } from "../types";
import Page from "../components/ui/Page";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { Video, Mic, BadgePlus, Plus } from "lucide-react";
import AppVideo from "../components/webRTC/Video";
import RoundedButton from "../components/ui/RoundedButton";
import mediaReducers, { selectMedia } from "../store/services/media";
import UserBadge from "../components/ui/UserBadge";
import StreamVideo from "../components/webRTC/Video";
import Button from "../components/ui/Button";
import { RTC } from "../lib/webRTC/RTC";

type Props = {};

export default function Home({}: Props) {
  const [roomID, setRoomID] = useState("");
  const media = useAppSelector(selectMedia);
  const navigate = useNavigate();

  function handleSubmit() {
    navigate("/join/" + roomID);
  }

  return (
    <Page id="home-page" className="flex items-center">
      <StreamVideo />
      <div className="w-full h-full flex flex-col items-center justify-center gap-y-4">
        <input
          title="roomID"
          placeholder="Enter roomID to join; blank to create"
          className="p-4 rounded z-10 w-1/2 text-xl border outline-blue-600"
          value={roomID}
          onChange={({ target }) => setRoomID(target.value)}
        />
        <Button onClick={() => handleSubmit()}>Join Room</Button>
      </div>
      <Button className="w-fit rounded-xl aspect-square p-4 absolute right-8 bottom-8">
        <Plus size={"2rem"} />
      </Button>
    </Page>
  );
}
