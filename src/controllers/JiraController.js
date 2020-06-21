const axios = require('axios');
const TelegramController = require("./TelegramController");

const n = `<pre>\n</pre>`;

const JiraWebhookParser = {
  issue: (action, details) => {
    console.log(`Parsing message for ${details.webhookEvent}`);
    const { user, issue, changelog } = details;

    const userActionInfo = `${user.displayName} ${action} the issue`;
    const jiraURL = `${process.env.JEERAGRAM_JIRA_URL}/browse/${issue.key}`;
    const issueInfo = `<a href="${jiraURL}">${issue.fields.issuetype.name}: ${issue.key} ${issue.fields.summary}</a>${n}`

    let changed = "";
    changelog.items.forEach(item => {
      const { field, fromString, toString } = item;
      changed += `<b>${field}</b> from <i>${fromString}</i> → <code>${toString}</code>${n}`;
    })

    return message = `${userActionInfo} ${issueInfo}${n}${changed}`;
  },

  comment: (action, details) => {
    console.log(`Parsing message for ${details.webhookEvent}`); 
    const { issue, comment } = details;
    const { updateAuthor } = comment;

    const userActionInfo = `💬 ${updateAuthor.displayName} ${action} a comment on`;

    const jiraURL = `${process.env.JEERAGRAM_JIRA_URL}/browse/${issue.key}`;
    const issueInfo = `<a href="${jiraURL}">${issue.fields.issuetype.name}: ${issue.key} ${issue.fields.summary}</a>${n}`

    const commentInfo = `<i>${comment.body}</i>`

    return message = `${userActionInfo} ${issueInfo}${n}${commentInfo}`;
  }
}

const JiraController = {
  hook: async (request, response) => {
    console.log(`Jira message:`, JSON.stringify(request.body));
    const details = request.body;
    const { webhookEvent } = details;
    const entity = webhookEvent.split('_')[0].replace(/jira:/g, '');
    const action = webhookEvent.split('_')[1];
    parser = JiraWebhookParser[entity];
    if (parser){
      const message = parser(action, details);
      await TelegramController.sendMessage(message);
      return response.json({ message: `Jira webhook received! Sent to telegram!` });
    }
    else {
      const message = `Parser not yet implemented for ${details.webhookEvent} 🙄${n}`;
      const detailsJSON = `<pre><code class="language-JSON">${JSON.stringify(details, null, 4)}</code></pre>`;
      await TelegramController.sendMessage(`${message}${detailsJSON}`);
      return response.json(message);
    }
  },

  setWebhook: async (request, response) => {
    //https://developer.atlassian.com/cloud/jira/platform/webhooks/
    const appURLJira = `${process.env.JEERAGRAM_APP_URL}/jira`;
    const webhook = {
      "name": "Jeeragram Webhook",
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
      baseURL: `${process.env.JEERAGRAM_JIRA_URL}/rest`,
      headers: { 'Accept': 'application/json' },
      auth: {
        username: process.env.JEERAGRAM_JIRA_USER,
        password: process.env.JEERAGRAM_JIRA_TOKEN
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