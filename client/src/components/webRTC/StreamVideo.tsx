import { Mic, Video } from "lucide-react";
import { VideoHTMLAttributes, useEffect, useMemo, useRef } from "react";
import {
  initThunk,
  selectMedia,
  addTrack,
  handleDeviceChange,
  handlePermissionChange,
  toggleTracks,
} from "../../store/services/media";
import user, { selectUser } from "../../store/services/user";
import RoundedButton from "../ui/RoundedButton";
import UserBadge from "../ui/UserBadge";
import { useAppSelector, useAppDispatch } from "../../hooks/redux";
import { twMerge } from "tailwind-merge";
import AppVideo from "../ui/AppVideo";

export default function StreamVideo({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const media = useAppSelector(selectMedia);
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();

  const handleClick = (type: "audio" | "video") => {
    if (media[type].enabled) {
      dispatch(toggleTracks(type));
    } else {
      dispatch(addTrack(type));
    }
  };

  useEffect(() => {
    async function setup() {
      const microphone = await navigator.permissions.query({
        // @ts-ignore
        name: "microphone",
      });
      microphone.addEventListener("change", () => {
        dispatch(handlePermissionChange("audio"));
      });
      const camera = await navigator.permissions.query({
        // @ts-ignore
        name: "camera",
      });
      camera.addEventListener("change", (event) => {
        dispatch(handlePermissionChange("video"));
      });

      navigator.mediaDevices.addEventListener("devicechange", () =>
        dispatch(handleDeviceChange())
      );

      dispatch(initThunk());
    }

    setup();
  }, []);

  const videoEnabled = media.video.streamEnabled;
  const audioEnabled = media.audio.streamEnabled;

  return (
    <div
      {...props}
      className={twMerge("video-container overflow-hidden", className)}
    >
      <AppVideo
        id="source-video"
        srcObject={media.stream}
        autoPlay
        playsInline
      />
      {/* {!videoEnabled && audioEnabled && ( */}
      <UserBadge
        user={
          user && {
            username: user.username,
            profilePicture: user.profilePicture,
          }
        }
        className="user-badge"
        noanimation
      />
      {/* )} */}
      <div className="controls-container">
        <RoundedButton
          onClick={() => handleClick("audio")}
          className={
            media.audio.availableDevices.length && media.audio.hasPermission
              ? audioEnabled
                ? "rnd_enabled"
                : "rnd_disabled"
              : "rnd_no_permission" + " grid place-items-center"
          }
        >
          <Mic />
        </RoundedButton>
        <RoundedButton
          onClick={() => {
            handleClick("video");
          }}
          className={
            media.video.hasPermission && media.video.availableDevices.length
              ? videoEnabled
                ? "rnd_enabled"
                : "rnd_disabled"
              : "rnd_no_permission" + " grid place-items-center"
          }
        >
          <Video />
        </RoundedButton>
      </div>
    </div>
  );
}
