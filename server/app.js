import express from "express";
import http from "http";
import helmet from "helmet";
import getLogger from "./services/logger.js";
import forkCluster from "./services/cluster.js";
import { logErrors } from "./services/middleware.js";
import { createApi } from "./services/api.js";
import * as dotenv from 'dotenv';
dotenv.config();

const production = process.env.NODE_ENV === "production";
const logger = getLogger("scatlas-lc");

export async function createApp() {
  const app = express();
  app.locals.logger = logger;
  logger.info(`Started worker process, parsing schema...`);

  app.use(helmet({
    contentSecurityPolicy: false,
    hsts: false,
  }));
  app.use(logErrors);
  app.use("/api", await createApi());
  return app;
}

export default async function main() {
  const app = await createApp();

  const server = app.listen(process.env.PORT, () => {
    logger.info(`Application is running on port: ${process.env.PORT}`);
  });
  return server;
}

main()


