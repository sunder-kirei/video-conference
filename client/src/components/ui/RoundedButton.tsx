import React, { PropsWithChildren } from "react";
import { twMerge } from "tailwind-merge";

type Props = {};

function RoundedButton(
  props: PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>
) {
  return (
    <div
      {...props}
      className={twMerge(
        "border p-4 w-fit aspect-square rounded-full",
        props.className
      )}
    />
  );
}

export default RoundedButton;
