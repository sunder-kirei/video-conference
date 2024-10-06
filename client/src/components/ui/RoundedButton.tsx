import React, { PropsWithChildren } from "react";
import { twMerge } from "tailwind-merge";


function RoundedButton({
  className,
  ...props
}: PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      {...props}
      className={twMerge(
        "border p-4 w-fit aspect-square rounded-full cursor-pointer custom_transition  grid place-items-center",
        className
      )}
    />
  );
}

export default RoundedButton;
