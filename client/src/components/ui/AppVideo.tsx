import { useRef, useEffect, VideoHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

type Props = VideoHTMLAttributes<HTMLVideoElement> & {
  srcObject?: MediaStream;
};

function AppVideo({ srcObject, ...props }: Props) {
  const refVideo = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!refVideo.current || !srcObject) return;
    refVideo.current.srcObject = srcObject;
  }, [srcObject]);

  return (
    <video
      ref={refVideo}
      {...props}
      className={twMerge(
        "aspect-video w-full rounded-sm border bg-black object-cover",
        props.className,
      )}
    />
  );
}

export default AppVideo;
