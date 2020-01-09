const Bot = require('./twitchAPI/Bot');
const config = require('./twitchAPI/config');
const WebSocket = require('ws');
const Skipometer = require('./entities/Skipometer');
const Vote = require('./entities/Vote');
const states = require('./misc/states');

const bot = new Bot(config.username, config.password, config.channel);
const webSocketServer = new WebSocket.Server({ port: 5000 });
const skipometer = new Skipometer(webSocketServer);

webSocketServer.on('connection', ws => {
  ws.on('message', message => {
    skipometer.processDataFromControlPanel(message);
    skipometer.sendToClients();
  });

  skipometer.sendToClients();
});

bot.client.on('message', (channel, tags, message, self) => {
  const username = tags.username;
  const command = message.trim().toLowerCase();

  if (self) return;

  if (skipometer.voting && !skipometer.viewerVoted(username)) {
    if (command === '!skip' || command === '!скип') {
      skipometer.addVote(new Vote(username, true));
    }
    if (command === '!save' || command === '!сейв') {
      skipometer.addVote(new Vote(username, false));
    }
  }
});
