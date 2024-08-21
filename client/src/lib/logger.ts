import pino from "pino";
import dayjs from "dayjs";

const transports = {
  targets: [
    {
      target: "pino-pretty",
      options: { destination: 1 },
    },
  ],
};

const logger = pino({
  timestamp: () => `,"time":"${dayjs().format()}"`,
  browser: {
    asObject: true,
  },
});

export default logger;
