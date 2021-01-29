const process = require('process');
const express = require('express');
const config = require('./config.json');
const logger = require('./services/logger');
const forkCluster = require('./services/cluster');
const production = process.env.NODE_ENV === 'production';

// forks a single worker process during local development
if (forkCluster(!production && 1))
    return;

logger.info(`[${process.pid}] Started worker process, parsing schema...`);

const app = express();
app.use('/api', require('./services/api'));

// serve public folder during local development
if (!production)
    app.use(express.static(config.server.client));

// global error handler
app.use((error, request, response, next) => {
    const { name, message, stack } = error;
    logger.error({ message, stack });
    response.status(500).json(`${name}: ${message}`);
});

app.listen(config.server.port, () => {
    logger.info(`Application is running on port: ${config.server.port}`)
});