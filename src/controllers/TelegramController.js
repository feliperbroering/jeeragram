const axios = require('axios');
const TelegramBot = require("node-telegram-bot-api");
const telegram = new TelegramBot(process.env.TELEGRAM_JIRA_BOT_TOKEN);

telegram.on('message', msg => {
  const echoMsg = `<pre><code class="language-JSON">${JSON.stringify(msg, null, 4)}</code></pre>`
  telegram.sendMessage(msg.chat.id, echoMsg, {parse_mode: "HTML"});
});

notifyTelegram = async (request) => {
  const { issue, webhookEvent, changelog, comment, sprint } = request.body;
  const n = `<pre>\n</pre>`;
  let issueInfo = "";
  if (issue){
    const jiraURL = `${process.env.TELEGRAM_JIRA_JIRA_URL}/browse/${issue.key}`;  
    issueInfo = `<a href="${jiraURL}">${issue.key}: ${issue.fields.summary}</a>${n}`
  }
  let details = "{}";
  if (webhookEvent.startsWith("jira:issue")){
    details = JSON.stringify(changelog.items, null, 4);
  }
  else if (webhookEvent.startsWith("comment")){
    details = JSON.stringify(comment, null, 4);
  }
  else if (webhookEvent.startsWith("sprint")){
    details = JSON.stringify(sprint, null, 4);
  }
  // version released
  const detailsInfo = `<pre><code class="language-JSON">${details}</code></pre>`
  let message = `${issueInfo}${webhookEvent}:${detailsInfo}`;
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
    telegram.processUpdate(request.body);
    return response.json({ message: `Telegram webhook received!` });
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
          responseMessage = `Teletram webhook created!`;
          console.log(responseMessage, JSON.stringify(botResponse.data));
          return response.json({ 
            message: responseMessage,
            telegramResponse: botResponse.data
          });
        }
        else {
          responseMessage = `Can't set telegram webhook.`;
          console.log(responseMessage, JSON.stringify(botResponse.data));
          return response.status(botResponse.status).json({ 
            message: responseMessage,
            telegramResponse: botResponse.data
          });
        }
      })
      .catch(error => {
        responseMessage = `Can't set telegram webhook.`;
        console.log(responseMessage, JSON.stringify(error.response.data));
        return response.status(500).json({
          message: responseMessage,
          telegramResponse: error.response.data
        });
      });
  },

  sendMessage: async (request) => {
    await notifyTelegram(request);
  }

};

module.exports = TelegramController;