import React, { useMemo } from "react";
import logger from "../lib/logger";
import { io } from "socket.io-client";
import GoogleAuthButton from "../components/GoogleAuthButton/GoogleAuthButton";

type Props = {};

export default function Root({}: Props) {
  return (
    <div>
      <GoogleAuthButton />
    </div>
  );
}
