const tmi = require('tmi.js');

class Bot {
  constructor(username, password, channel) {
    this.username = username;
    this.password = password;
    this.channel = channel;
    this.opts = {
      options: { debug: true },
      connection: {
        secure: true,
        reconnect: true
      },
      identity: {
        username: username,
        password: password
      },
      channels: [channel]
    };
    this.client = new tmi.client(this.opts);
    this.client.on('connected', (addr, port) => {
      console.log(`* Connected to ${addr}:${port}`);
    });
    this.client.connect();
  }
}

module.exports = Bot;
