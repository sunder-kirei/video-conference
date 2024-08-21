import React, { useMemo } from "react";
import logger from "../lib/logger";
import { io } from "socket.io-client";

type Props = {};

export default function Root({}: Props) {
  return (
    <div>
      RootPage
      <button
        onClick={async () => {
          window.location.href =
            process.env.REACT_APP_BACKEND! +
            "/api/auth/google?callback=http://localhost:3001/";
        }}
      >
        Make request
      </button>
      <button
        onClick={async () => {
          const url = process.env.REACT_APP_BACKEND! + "/api/user";
          const data = await fetch(url, { credentials: "include" });
          console.log(await data.json());
        }}
      >
        get user
      </button>
    </div>
  );
}
