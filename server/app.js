const express = require("express");
const helmet = require("helmet");
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

app.listen(process.env.PORT, () => {
  logger.info(`Application is running on port: ${process.env.PORT}`);
});

module.exports = app;
