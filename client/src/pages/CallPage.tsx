import { Copy, PhoneOff, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AppVideo from "../components/ui/AppVideo";
import Page from "../components/ui/Page";
import RoundedButton from "../components/ui/RoundedButton";
import UserBadge from "../components/ui/UserBadge";
import StreamVideo from "../components/webRTC/StreamVideo";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { RTC } from "../lib/webRTC/RTC";
import { createRTC, selectMedia } from "../store/services/media";
import { RoomAck, RTCUser } from "../types";


function CallPage() {
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);
  const [remoteUsers, setRemoteUsers] = useState<
    { user: RTCUser; streams: string[] }[]
  >([]);
  const { roomID } = useParams();
  const media = useAppSelector(selectMedia);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(false);

  function onRoomJoined(roomAck: RoomAck) {
    navigate("/join/" + roomAck.roomID, {
      replace: true,
    });
  }

  function handleMute() {
    setIsMuted((prev) => {
      const elements = document.querySelectorAll("audio, video") as NodeListOf<
        HTMLVideoElement | HTMLAudioElement
      >;
      elements.forEach((item) => {
        item.muted = !prev;
      });

      return !prev;
    });
  }

  async function handleCopy() {
    toast.promise(navigator.clipboard.writeText(window.location.href), {
      loading: "Copying...",
      success: <b>Copied to Clipboard!</b>,
      error: <b>Clipboard permission disabled.</b>,
    });
  }

  useEffect(() => {
    const rtc = new RTC(
      media.stream,
      onRoomJoined,
      setRemoteStreams,
      setRemoteUsers
    );

    dispatch(createRTC(rtc));

    if (roomID) {
      rtc.joinRoom(roomID);
    } else {
      rtc.createRoom();
    }

    return () => rtc.free();
  }, []);

  async function handleEndCall() {
    navigate("/");
    media.rtc?.free();
  }

  return (
    <Page className="flex flex-col">
      <div className="video-grid h-full w-full overflow-y-auto p-4 items-center">
        {remoteStreams.map((stream) => {
          const user = remoteUsers.find(({ streams }) => {
            if (streams.find((sid) => sid === stream.id)) return true;
            return false;
          });

          let isEnabled = false;
          stream.getVideoTracks().forEach((track) => {
            isEnabled = isEnabled || track.enabled;
          });

          return (
            <div className="video-container" key={stream.id}>
              <AppVideo playsInline autoPlay srcObject={stream} />
              {!isEnabled && (
                <UserBadge user={user?.user} className="user-badge" />
              )}
              <span className="user-tag text-white absolute bottom-2 left-4 opacity-0 translate-y-8 custom_transition">
                {user?.user.username}
              </span>
            </div>
          );
        })}
        <StreamVideo />
      </div>
      <div className="controls h-24 w-full flex items-center justify-center gap-x-4 relative font-semibold">
        <button
          className="absolute left-4 copy flex items-center justify-center gap-x-4 rounded-lg border-2 p-2 border-blue-600 text-blue-600 text-lg"
          title="Copy link"
          onClick={() => {
            handleCopy();
          }}
        >
          <Copy />
          <span>{location.pathname}</span>
        </button>
        <RoundedButton
          className="rnd_danger"
          title="Hang up"
          onClick={() => handleEndCall()}
        >
          <PhoneOff />
        </RoundedButton>
        <RoundedButton
          className={isMuted ? "rnd_danger" : "rnd_enabled"}
          onClick={() => handleMute()}
          title={isMuted ? "Enable audio" : "Disable audio"}
        >
          {isMuted ? <VolumeX /> : <Volume2 />}
        </RoundedButton>
      </div>
    </Page>
  );
}

export default CallPage;
