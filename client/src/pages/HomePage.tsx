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
import AppVideo from "../components/webRTC/StreamVideo";
import RoundedButton from "../components/ui/RoundedButton";
import mediaReducers, { selectMedia } from "../store/services/media";
import UserBadge from "../components/ui/UserBadge";
import StreamVideo from "../components/webRTC/StreamVideo";
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
