import express from "express";
import { createLogger } from "./services/logger.js";
import { createApi } from "./services/api.js";
import { validateEnvironment } from "./services/environment.js";
import { isMainModule } from "./services/utils.js";
BigInt.prototype.toJSON = function () {
  return this.toString();
};

// if this module is the main module, start the app
if (isMainModule(import.meta)) {
  const env = process.env;
  validateEnvironment(env);
  await main(env);
}

/**
 * Creates and starts an express app given a specified environment.
 * @param {object} env
 * @returns {Promise<import("http").Server>} a node http server
 */
export async function main(env) {
  const { PORT, APPLICATION_NAME, SERVER_TIMEOUT } = env;
  const serverTimeout = +SERVER_TIMEOUT || 1000 * 60 * 15;
  const app = await createApp(env);
  const server = app.listen(PORT, () => {
    app.locals.logger.info(`${APPLICATION_NAME} started on port ${PORT}`);
  });
  server.setTimeout(serverTimeout);
  return server;
}

/**
 * Creates an express app given a specified environment.
 * @param {object} env
 * @returns {Promise<express.Application>} an Express app
 */
export async function createApp(env) {
  const { APPLICATION_NAME, LOG_LEVEL } = env;
  const app = express();

  // if behind a proxy, use the first x-forwarded-for address as the client's ip address
  app.set("trust proxy", true);
  app.set("json spaces", 2);
  app.set("x-powered-by", false);

  // register services as app locals
  app.locals.logger = createLogger(APPLICATION_NAME, LOG_LEVEL);
  app.use("/api", await createApi(env));

  return app;
}
