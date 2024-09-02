import dayjs from "dayjs";
import pino from "pino";

const transports = {
  targets: [
    {
      target: "pino/file",
      options: {
        destination: `${process.cwd()}/logs/${dayjs().format(
          "DD-MM-YYYY"
        )}.log`,
        mkdir: true,
      },
    },
    {
      target: "pino-pretty",
      options: { destination: 1 },
    },
  ],
};

const logger = pino({
  transport: transports,
  timestamp: () => `,"time":"${dayjs().format()}"`,
});

export default logger;
