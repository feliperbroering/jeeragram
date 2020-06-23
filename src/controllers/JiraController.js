const TelegramController = require("./TelegramController");
const axios = require('axios');

const n = `<pre>\n</pre>`;
class JiraMarkdownParser {

  constructor(text){
    this._text = text;
    this._regexUsers = /\[~accountid:([\S]+)\]/gm;
    this._regexImages = /!([^!]*)!/gm;
    this._regexLinks = /\[([^\]]*)\|([^\]]*)\]/gm;
    this._regexItalic = /_([^_]*)_/gm;
    this._regexBold = /\*([^\*]*)\*/gm;  
    this._regexCode = /({.+})(.+)({.+})/gm;
  }

  text() {
    return this._text;
  }

  parseLinks() {
    let m;
    let regex = this._regexLinks;
    while ((m = regex.exec(this._text)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      const htmlLink = `<a href="${m[2]}">${m[1]}</a>`
      this._text = this._text.replace(m[0], htmlLink);
    }
  }

  parseBold() {
    let m;
    let regex = this._regexBold;
    while ((m = regex.exec(this._text)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      const htmlBold = `<b>${m[1]}</b>`
      this._text = this._text.replace(m[0], htmlBold);
    }
  }

  parseItalic() {
    let m;
    let regex = this._regexItalic;
    while ((m = regex.exec(this._text)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      const htmlItalic = `<i>${m[1]}</i>`
      this._text = this._text.replace(m[0], htmlItalic);
    }
  }

  parseCode() {
    let m;
    let regex = this._regexCode;
    while ((m = regex.exec(this._text)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      const htmlCode = `<code>${m[2]}</code>`
      this._text = this._text.replace(m[0], htmlCode);
    }
  }

  parseImages() {
    this._text = this._text.replace(this._regexImages, '');
    return this;
  }

  getUsersAccountIds(){
    let keys = this._text.match(this._regexUsers);
    let users = [];
    if ( keys && keys.length > 0) {
      users = keys.map(key => {
        return key.replace('[~accountid:', '').replace(']', '');
      });
    }
    return users;
  }

  parseUsers(users) {
    users.forEach(user => {
      this._text = this._text.replace(`[~accountid:${user.accountId}]`, user.displayName);
    });
    return this;
  }  

};

const getJiraUsers = async (usersAccountIds) => {

  const jiraAPI = axios.create({
    baseURL: `${process.env.JEERAGRAM_JIRA_URL}/rest/api/3`,
    headers: { 'Accept': 'application/json' },
    auth: {
      username: process.env.JEERAGRAM_JIRA_USER,
      password: process.env.JEERAGRAM_JIRA_TOKEN
    }
  });

  let usersQuery = usersAccountIds.map(id => {
    return `accountId=${id}`
  });
  usersQuery = usersQuery.join('&');  

  try {
    const jiraResponse = await jiraAPI.get(`/user/bulk?${usersQuery}`);
    console.log(`Get Jira users: `, JSON.stringify(jiraResponse.data));
    if ( jiraResponse.data )
      return jiraResponse.data.values;
    else
      return null;
  }
  catch (error) {
    let errorData;
    if (error.response)
      errorData = error.response.data;
    else
      errorData = error.message
    console.log(`Can't get Jira users: ${usersQuery}.`, JSON.stringify(errorData));
    return null;
  }    
};

const parseJiraMarkdown = async (originalJiraText) => {
  
  if (!originalJiraText)
    return null;

  const parser = new JiraMarkdownParser(originalJiraText);
  parser.parseImages();
  parser.parseLinks();
  parser.parseBold();
  parser.parseItalic();
  parser.parseCode();
  const usersAccountIds = parser.getUsersAccountIds();
  if ( usersAccountIds.length > 0 ) {
    const users = await getJiraUsers(usersAccountIds);
    parser.parseUsers(users);
  }
  console.log(parser.text());
  return parser.text();
}

const JiraWebhookParser = {
  issue: async (action, details) => {
    console.log(`Parsing message for ${details.webhookEvent}`);
    const { user, issue, changelog } = details;

    const userActionInfo = `${user.displayName} ${action} the issue`;
    const jiraURL = `${process.env.JEERAGRAM_JIRA_URL}/browse/${issue.key}`;
    const issueInfo = `<a href="${jiraURL}">${issue.fields.issuetype.name}: ${issue.key} ${issue.fields.summary}</a>${n}`

    let changed = "";
    for (let i = 0; i < changelog.items.length; i++) {
      const { field, fromString, toString } = changelog.items[i];
      let toStringParsed = toString;
      let fromStringParsed = fromString;
      if (field === 'description') {
        toStringParsed = await parseJiraMarkdown(toString);
        fromStringParsed = await parseJiraMarkdown(fromString);
      }
      changed += `<b>${field}</b> from <i>${fromStringParsed}</i> → <code>${toStringParsed}</code>${n}`;      
    }

    return message = `${userActionInfo} ${issueInfo}${n}${changed}`;
  },

  comment: async (action, details) => {
    console.log(`Parsing message for ${details.webhookEvent}`); 
    const { issue, comment } = details;
    const { updateAuthor } = comment;

    const userActionInfo = `💬 ${updateAuthor.displayName} ${action} a comment on`;

    const jiraURL = `${process.env.JEERAGRAM_JIRA_URL}/browse/${issue.key}`;
    const issueInfo = `<a href="${jiraURL}">${issue.fields.issuetype.name}: ${issue.key} ${issue.fields.summary}</a>${n}`

    const parsedComment = await parseJiraMarkdown(comment.body);

    return message = `${userActionInfo} ${issueInfo}${n}${parsedComment}`;
  }
}

const JiraController = {
  hook: async (request, response) => {
    console.log(`Jira message:`, JSON.stringify(request.body));
    const details = request.body;
    const { webhookEvent } = details;
    const entity = webhookEvent.split('_')[0].replace(/jira:/g, '');
    const action = webhookEvent.split('_')[1];
    parser = await JiraWebhookParser[entity];
    if (parser){
      const message = await parser(action, details);
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