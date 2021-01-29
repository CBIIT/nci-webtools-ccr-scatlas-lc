const express = require('express');
const compression = require('compression');
const sqlite = require('better-sqlite3');
const config = require('../config');
const logger = require('./logger');
const { query } = require('./query');

const database = new sqlite(config.database, {
    verbose: message => logger.debug(message)
});

const pluck = sql => database.prepare(sql).pluck();

const lookup = {
    gene: pluck('select gene from gene order by gene').all(),
    malignantCellType: pluck('select type from malignant_cell_type order by type').all(),
    nonmalignantCellTypes: pluck('select type from nonmalignant_cell_type order by type').all(),
    tCellTypes: pluck('select type from t_cell_type order by type').all(),
};

const router = express.Router();
router.use(express.json());
router.use(compression());
router.use((request, response, next) => {
    if (request.method === 'GET')
        response.set(`Cache-Control', 'public, max-age=${60 * 60}`);
    next();
})

router.get('/ping', (request, response) => {
    response.json(1 === pluck(`select 1`).get());
});

router.get('/lookup', (request, response) => {
    response.json(lookup);
});

router.get('/query', (request, response) => {
    response.json(query(database, request.query));
});

router.get('/contact', (request, response) => {
    response.json(true);
});

module.exports = router;