const axios = require('axios');
const TelegramController = require("./TelegramController");

const JiraController = {
  hook: async (request, response) => {
    console.log(`Jira message:`, JSON.stringify(request.body));
    await TelegramController.sendMessage(request);
    return response.json({ message: `Jira webhook received! Sent to telegram!` });
  },

  setWebhook: async (request, response) => {
    //https://developer.atlassian.com/cloud/jira/platform/webhooks/
    const appURLJira = `${process.env.TELEGRAM_JIRA_APP_URL}/jira`;
    const webhook = {
      "name": "Telegram-Jira Webhook",
      "url": appURLJira,
      "events": [
        "jira:issue_created",
        "jira:issue_updated",
        "jira:issue_deleted",
        "comment_created",
        "comment_updated",
        "comment_deleted",
        "jira:version_released",
        "sprint_started",
        "sprint_updated",
        "sprint_closed"
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
      responseMessage = `Jira webhook created!`;
      console.log(responseMessage, JSON.stringify(jiraResponse.data));
      return response.json({
        message: responseMessage, 
        jiraStatus: jiraResponse.status, 
        jiraResponse: jiraResponse.data
      });
    }
    catch (error) {
      let errorData;
      if (error.response) 
        errorData = error.response.data;
      else 
        errorData = error.message
      responseMessage = `Can't set Jira webhook.`;
      console.log(responseMessage, JSON.stringify(errorData) );
      return response.status(500).json({
        message: responseMessage,
        jiraResponse: errorData
      });
    }

  }

};

module.exports = JiraController;