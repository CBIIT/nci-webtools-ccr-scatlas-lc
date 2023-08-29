import path from "path";
import util from "util";
import fs from "fs";
import { createLogger, format, transports } from "winston";
import "winston-daily-rotate-file";

export default function getLogger(name) {
  const folder = "logs";
  const level = "info";
  fs.mkdirSync(folder, { recursive: true });

  return new createLogger({
    level: level || "info",
    format: format.combine(
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.label({ label: name }),
      format.printf(({ label, timestamp, level, message }) =>
        [
          [label, process.pid, timestamp, level].map((s) => `[${s}]`).join(" "),
          util.format(message),
        ].join(" - "),
      ),
    ),
    transports: [new transports.Console()],
    exitOnError: false,
  });
}
