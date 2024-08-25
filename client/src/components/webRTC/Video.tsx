import { Mic, Video } from "lucide-react";
import { VideoHTMLAttributes, useEffect, useRef } from "react";
import media, {
  initThunk,
  selectMedia,
  addTrack,
  handleDeviceChange,
  handlePermissionChange,
  removeTrack,
} from "../../store/services/media";
import user, { selectUser } from "../../store/services/user";
import RoundedButton from "../ui/RoundedButton";
import UserBadge from "../ui/UserBadge";
import { useAppSelector, useAppDispatch } from "../../hooks/redux";

type PropsType = VideoHTMLAttributes<HTMLVideoElement> & {
  srcObject: MediaStream;
};

export function AppVideo({ srcObject, ...props }: PropsType) {
  const refVideo = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    console.log("add stream callback");
    if (!refVideo.current) return;
    refVideo.current.srcObject = srcObject;
  }, [srcObject]);

  return <video ref={refVideo} {...props} />;
}

export default function StreamVideo() {
  const media = useAppSelector(selectMedia);
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();

  const handleClick = (type: "audio" | "video") => {
    if (media[type].enabled) {
      dispatch(removeTrack(type));
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

  return (
    <div className="source-video w-full aspect-video flex relative flex-col justify-end">
      {!media.video.enabled && media.audio.enabled && (
        <UserBadge
          user={user}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-32 z-20"
        />
      )}
      <AppVideo
        id="source-video"
        srcObject={media.stream}
        className="aspect-video w-full border absolute bg-black object-cover rounded-sm"
        autoPlay
        playsInline
      />
      <div className="controls flex items-end w-full h-full p-4 justify-center  z-10 gap-x-4">
        <RoundedButton
          onClick={() => handleClick("audio")}
          className={
            media.audio.availableDevices.length && media.audio.hasPermission
              ? media.audio.enabled
                ? "rnd_enabled"
                : "rnd_disabled"
              : "rnd_no_permission"
          }
        >
          <Mic />
        </RoundedButton>
        <RoundedButton
          onClick={() => handleClick("video")}
          className={
            media.video.hasPermission && media.video.availableDevices.length
              ? media.video.enabled
                ? "rnd_enabled"
                : "rnd_disabled"
              : "rnd_no_permission"
          }
        >
          <Video />
        </RoundedButton>
      </div>
    </div>
  );
}
