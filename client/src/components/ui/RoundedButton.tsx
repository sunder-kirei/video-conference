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
        "custom_transition grid aspect-square w-fit cursor-pointer place-items-center rounded-full border p-4",
        className,
      )}
    />
  );
}

export default RoundedButton;
