const axios = require('axios');

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
  }  

};

module.exports = TelegramController;