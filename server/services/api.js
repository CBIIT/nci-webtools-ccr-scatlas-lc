const express = require('express');
const compression = require('compression');
const sqlite = require('better-sqlite3');
const config = require('../config');
const logger = require('./logger');
const { query } = require('./query');
var mail = require('./mail');
var fs = require('fs');


async function readTemplate(filePath, data) {
	const template = await fs.promises.readFile(path.resolve(filePath));
	console.log(template)

	// replace {tokens} with data values or removes them if not found
	return String(template).replace(
		/{[^{}]+}/g,
		key => data[key.replace(/[{}]+/g, '')] || ''
	);
}

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

router.post('/sendMail', async function (request,response) { 
    logger.debug('hi')
    console.log('hi')
    const templateData = {
        name: request.body.name,
        body: request.body.body,
        email: request.body.email
    }

    logger.debug(request.body)

    try{
        await mail.sendMail(
            request.body.email,
            config.mail.to,
            request.body.subject,
            '',
            await readTemplate(__dirname + '/templates/contact-email-template.html', templateData)
        )
        res.json({ status: 200, data: 'sent' });
    } catch(e){
        logger.debug(e)
        res.json({ status: 400, data: 'failed' });
    }
})

module.exports = router;