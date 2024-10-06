import { Mic, Video } from "lucide-react";
import { useEffect } from "react";
import { twMerge } from "tailwind-merge";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  addTrack,
  handleDeviceChange,
  handlePermissionChange,
  initThunk,
  selectMedia,
  toggleTracks,
} from "../../store/services/media";
import { selectUser } from "../../store/services/user";
import AppVideo from "../ui/AppVideo";
import RoundedButton from "../ui/RoundedButton";
import UserBadge from "../ui/UserBadge";

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
        // @ts-expect-error property not in doc
        name: "microphone",
      });
      microphone.addEventListener("change", () => {
        dispatch(handlePermissionChange("audio"));
      });
      const camera = await navigator.permissions.query({
        // @ts-expect-error property not in doc
        name: "camera",
      });
      camera.addEventListener("change", () => {
        dispatch(handlePermissionChange("video"));
      });

      navigator.mediaDevices.addEventListener("devicechange", () =>
        dispatch(handleDeviceChange()),
      );

      dispatch(initThunk());
    }

    setup();
  }, []);

  const videoEnabled = media.video.streamEnabled;
  const audioEnabled = media.audio.streamEnabled;

  return (
    <div {...props} className={twMerge("video-container", className)}>
      <AppVideo
        id="source-video"
        srcObject={media.stream}
        autoPlay
        muted
        playsInline
      />
      {!videoEnabled && (
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
      )}
      <div className="controls-container overflow-hidden">
        <RoundedButton
          onClick={() => handleClick("audio")}
          className={
            (media.audio.availableDevices.length && media.audio.hasPermission
              ? audioEnabled
                ? "rnd_enabled"
                : "rnd_disabled"
              : "rnd_no_permission") + " rnd_btn"
          }
        >
          <Mic />
        </RoundedButton>
        <RoundedButton
          onClick={() => {
            handleClick("video");
          }}
          className={
            (media.video.hasPermission && media.video.availableDevices.length
              ? videoEnabled
                ? "rnd_enabled"
                : "rnd_disabled"
              : "rnd_no_permission") + " rnd_btn"
          }
        >
          <Video />
        </RoundedButton>
      </div>
    </div>
  );
}
