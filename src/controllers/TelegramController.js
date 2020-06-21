const axios = require('axios');
const TelegramBot = require("node-telegram-bot-api");
const telegram = new TelegramBot(process.env.JEERAGRAM_BOT_TOKEN);

telegram.on('message', msg => {
  const echoMessage = `<pre><code class="language-JSON">${JSON.stringify(msg, null, 4)}</code></pre>`
  telegram.sendMessage(msg.chat.id, echoMessage, {parse_mode: "HTML"});
});

const TelegramController = {

  hook: async (request, response) => {
    console.log(`Telegram message:`, JSON.stringify(request.body));
    //telegram.processUpdate(request.body);
    return response.json({ message: `Telegram webhook received!` });
  },

  setWebhook: async (request, response) => {

    const botWebhook = `https://api.telegram.org/bot${process.env.JEERAGRAM_BOT_TOKEN}/setWebhook`;
    const appURL = `${process.env.JEERAGRAM_APP_URL}/telegram`;
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

  sendMessage: async (message) => {
    telegram.sendMessage(
      process.env.JEERAGRAM_CHAT_IDS,
      message,
      {
        parse_mode: "HTML",
        disable_web_page_preview: true
      }
    );
  }

};

module.exports = TelegramController;