const path = require("path");
const util = require("util");
const fs = require("fs");
const { createLogger, format, transports, info } = require("winston");

require("winston-daily-rotate-file");

module.exports = getLogger;

function getLogger(name) {
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
    transports: [
      new transports.Console(),
      new transports.DailyRotateFile({
        filename: path.resolve(folder, `${name}-%DATE%.log`),
        datePattern: "YYYY-MM-DD-HH",
        zippedArchive: false,
        maxSize: "1024m",
        timestamp: true,
        maxFiles: "1d",
        prepend: true,
      }),
    ],
    exitOnError: false,
  });
}
