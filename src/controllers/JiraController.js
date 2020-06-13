const axios = require('axios');

const JiraController = {
  hook: async (request, response) => {
    console.log(`Jiiira message:`, JSON.stringify(request.body));
    response.status(200).send(`Jiiira webhook received!`);
  },

  setWebhook: async (request, response) => {
    const appURLJira = `${process.env.TELEGRAM_JIRA_APP_URL}/jira`;
    const webhook = {
      "name": "Telegram-Jira Webhook",
      "url": appURLJira,
      "events": [
        "jira:issue_created",
        "jira:issue_updated"
      ],
      "jqlFilter": "",
      "excludeIssueDetails": false
    };

    const jiraAPI = axios.create({
      baseURL: `${process.env.TELEGRAM_JIRA_JIRA_URL}/rest`,
      headers: { 'Accept': 'application/json' },
      auth: {
        username: process.env.TELEGRAM_JIRA_JIRA_USER,
        password: process.env.TELEGRAM_JIRA_JIRA_TOKEN
      }
    });

    let responseMessage;
    try {
      const jiraResponse = await jiraAPI.post(`/webhooks/1.0/webhook`, webhook);
      responseMessage = `Jira webhook created! ${JSON.stringify(jiraResponse.data)}`;
      console.log(responseMessage);
      response.status(jiraResponse.status).send(responseMessage);
    }
    catch (error) {
      let errMsg;
      if (error.response) errMsg = error.response.data;
      else errMsg = error.message
      responseMessage = `Can't set Jira webhook. Error: ${JSON.stringify(errMsg)}`;
      console.log(responseMessage);
      response.status(500).send(responseMessage);
    }

  }

};

module.exports = JiraController;