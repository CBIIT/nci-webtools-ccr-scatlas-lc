const express = require("express");
const helmet = require("helmet");
const config = require("./config.json");
const getLogger = require("./services/logger");
const forkCluster = require("./services/cluster");
const { logErrors } = require("./services/middleware");

const production = process.env.NODE_ENV === "production";
const logger = getLogger("scatlas-lc");

if (forkCluster()) return;

const app = express();
app.locals.logger = logger;
logger.info(`Started worker process, parsing schema...`);

app.use(helmet({ 
  contentSecurityPolicy: false,
  hsts: false,
}));
app.use(logErrors);
app.use("/api", require("./services/api"));

// serve public folder during local development
if (!production && config.server.client)
  app.use(express.static(config.server.client));

app.listen(config.server.port, () => {
  logger.info(`Application is running on port: ${config.server.port}`);
});

module.exports = app;
