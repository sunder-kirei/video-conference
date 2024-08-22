import React from "react";
import LoadingIcon from "../components/Loading/LoadingIcon";

type Props = {};

export default function LoadingPage({}: Props) {
  return (
    <div className="grid place-items-center min-h-full">
      <div className="w-52 aspect-square">
        <LoadingIcon />
      </div>
    </div>
  );
}
