# Jeeragram
Extend [Jira](https://www.atlassian.com/software/jira) powers with the convenience of [Telegram messenger](https://telegram.org/).
![Jira](https://wac-cdn.atlassian.com/dam/jcr:b86a32cb-0aa8-4783-aa81-9592d4fbf829/jsw-header-illustrations---v3.png?cdnVersion=1081)

## 🔥 Key features
* Receive key Jira notification events on a telegram
* Supported Jira events: issues, comments, versions and sprints CRUD
* Monitor telegram chats to get issues info, like issue details
* Serverless: easy deploy on google cloud functions

## 🚴‍♂️ Roadmap / Ideas
* Configs: easy way to choose witch jira events for what telegram chat
* Create Jira issue
* Issue chat: create new chat with team members to discuss some issue and store comments on jira comments

## Dev to-dos
1. Google cloud function env vars file to easy deploy
1. Security hashes for Jira and Telegram webhooks
1. Render messages in a pretty way (today I send as JSON)
1. Implement jira issue get info
1. Mock Jira and Telegram webhooks payload to easy local tests
1. Implement tests


Feel free to contribute and send PRs.