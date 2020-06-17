const axios = require('axios');
const TelegramBot = require("node-telegram-bot-api");
const telegram = new TelegramBot(process.env.TELEGRAM_JIRA_BOT_TOKEN);

notifyTelegram = async (request) => {
  const { issue, webhookEvent, changelog } = request.body;
  const n = `<pre>\n</pre>`;
  const jiraURL = `${process.env.TELEGRAM_JIRA_JIRA_URL}/browse/${issue.key}`;  
  const issueInfo = `<a href="${jiraURL}">${issue.key}: ${issue.fields.summary}</a>`
  const changed = `<pre><code class="language-JSON">${JSON.stringify(changelog.items, null, 4)}</code></pre>`
  let message = `${issueInfo}${n}${webhookEvent}:${changed}`;
  telegram.sendMessage(
    process.env.TELEGRAM_JIRA_CHAT_IDS,
    message,
    {
      parse_mode: "HTML",
      disable_web_page_preview: true
    }
  );
};

const TelegramController = {

  hook: async (request, response) => {
    console.log(`Telegram message:`, JSON.stringify(request.body));
    response.status(200).send(`Telegram webhook received!`);
  },

  setWebhook: async (request, response) => {

    const botWebhook = `https://api.telegram.org/bot${process.env.TELEGRAM_JIRA_BOT_TOKEN}/setWebhook`;
    const appURL = `${process.env.TELEGRAM_JIRA_APP_URL}/telegram`;
    console.log(botWebhook);
    console.log(appURL);
    let responseMessage;
    axios
      .post(botWebhook, { "url": appURL })
      .then(botResponse => {
        if (botResponse.status === 200) {
          responseMessage = `Teletram webhook created! ${JSON.stringify(botResponse.data)}`;
          console.log(responseMessage);
          response.status(200).send(responseMessage);
        }
        else {
          responseMessage = `Can't set telegram webhook. Response status: ${JSON.stringify(botResponse.data)}`;
          console.log(responseMessage);
          response.status(botResponse.status).send(responseMessage);
        }
      })
      .catch(error => {
        responseMessage = `Can't set telegram webhook. Error: ${JSON.stringify(botResponse.data)}}`;
        console.log(responseMessage);
        response.status(500).send(responseMessage);
      });
  },

  sendMessage: async (request) => {
    notifyTelegram(request);
  }

};

module.exports = TelegramController;