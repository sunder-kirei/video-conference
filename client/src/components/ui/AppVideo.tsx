import { useRef, useEffect, VideoHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

type Props = VideoHTMLAttributes<HTMLVideoElement> & {
  srcObject?: MediaStream;
};

function AppVideo({ srcObject, className, ...props }: Props) {
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
        "h-full w-full rounded-sm border bg-black object-contain",
        className,
      )}
    />
  );
}

export default AppVideo;
