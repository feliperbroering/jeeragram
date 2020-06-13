const express = require("express");
const routes = express.Router();

const TelegramController = require("./controllers/TelegramController");
const JiraController = require("./controllers/JiraController");

routes.post('/telegram', TelegramController.hook);
routes.post('/telegram/setWebhook', TelegramController.setWebhook);

routes.post('/jira', JiraController.hook);
routes.post('/jira/setWebhook', JiraController.setWebhook);

module.exports = routes;