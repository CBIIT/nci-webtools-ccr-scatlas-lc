const fsp = require("fs").promises;
const path = require("path");
const express = require("express");
const compression = require("compression");
const sqlite = require("better-sqlite3");
const { createTransport } = require("nodemailer");
const { template } = require("lodash");
const config = require("../config");
const { logRequests, publicCacheControl, withAsync } = require("./middleware");
const { query } = require("./query");

const database = new sqlite(config.database);

const lookup = {
  // gene: database.prepare('select gene from gene order by gene').pluck().all(),
};

const router = express.Router();
router.use(express.json());
router.use(compression());
router.use(logRequests());
router.use(publicCacheControl(60 * 60));

router.get("/ping", (request, response) => {
  response.json(1 === database.prepare(`select 1`).pluck().get());
});

router.get("/lookup", (request, response) => {
  response.json(lookup);
});

router.get("/query", (request, response) => {
  response.json(query(database, request.query));
});

router.post(
  "/sendMail",
  withAsync(async (request, response) => {
    const { name, email, subject, body } = request.body;
    const { from, to, smtp } = config.mail;
    const templateSource = await fsp.readFile(
      path.resolve(__dirname, "../templates/contact-email-template.html"),
      "utf-8",
    );

    // use lodash's template function to prevent html injection
    const html = template(templateSource)({ name, email, subject, body });
    await createTransport(smtp).sendMail({
      from,
      to,
      subject: `scAtlas-LC Contact - ${subject}`,
      html,
    });
    response.json(true);
  }),
);

module.exports = router;
