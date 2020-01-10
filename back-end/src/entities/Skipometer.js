const timeToNumber = require('../misc/timeToNumber');
const Pause = require('./Pause');
const Vote = require('./Vote');
const states = require('../misc/states');

class Skipometer {
  constructor(
    webSocketServer,
    bot,
    caption = '',
    enableTimer = true,
    initialTimeLeft = '01:00:00',
    startVotingTime = '00:30:00',
    skipNumber = 10,
    allowRevote = true,
    saveValue = 0.5
  ) {
    this.caption = caption;
    this.enableTimer = enableTimer;
    this.initialTimeLeft = initialTimeLeft;
    this.startVotingTime = startVotingTime;

    this.skipNumber = skipNumber;
    this.allowRevote = allowRevote;
    this.saveValue = saveValue;

    this.previousState = states.STOP;
    this.state = states.STOP;
    this.voting = false;
    this.votes = [];
    this.startTime = null;
    this.timeLeft = timeToNumber(this.initialTimeLeft);
    this.pauses = [];
    this.timer = null;

    this.webSocketServer = webSocketServer;
    webSocketServer.on('connection', ws => {
      ws.on('message', message => {
        this.processDataFromControlPanel(message);
        this.sendToClients();
      });

      this.sendToClients();
    });

    this.bot = bot;
    bot.client.on('message', (channel, tags, message, self) => {
      const username = tags.username;
      const command = message.trim().toLowerCase();

      if (self) return;

      if (this.voting) {
        if (command === '!skip' || command === '!скип') {
          this.tryAddOrChangeVote(new Vote(username, true));
        }

        if ((command === '!save' || command === '!сейв') && this.countSkipNumber() > 0) {
          this.tryAddOrChangeVote(new Vote(username, false));
        }
      }
    });
  }

  sendToClients() {
    this.webSocketServer.clients.forEach(client => {
      client.send(
        JSON.stringify({
          skipometer: {
            caption: this.caption,

            enableTimer: this.enableTimer,
            initialTimeLeft: this.initialTimeLeft,
            startVotingTime: this.startVotingTime,

            skipNumber: this.skipNumber,
            allowRevote: this.allowRevote,
            saveValue: this.saveValue,

            state: this.state,
            voting: this.voting,
            startTime: this.startTime,
            timeLeft: this.timeLeft,
            votes: this.votes,
            currentSkipNumber: this.countSkipNumber(),
          },
        })
      );
    });
  }

  viewerVoted(nickname) {
    return this.votes.some(vote => nickname === vote.nickname);
  }

  addVote(vote) {
    this.votes.push(vote);
  }

  changeVote(vote) {
    const voteToChange = this.votes.find(item => item.nickname === vote.nickname);

    voteToChange.skip = vote.skip;
  }

  tryAddOrChangeVote(vote) {
    let changed = false;

    if (!this.viewerVoted(vote.nickname)) {
      this.addVote(vote);
      changed = true;
    } else if (this.allowRevote) {
      this.changeVote(vote);
      changed = true;
    }

    if (changed) {
      if (this.countSkipNumber() >= this.skipNumber) {
        clearInterval(this.timer);
        this.state = states.SKIPPED;
        this.voting = false;
      }
      this.sendToClients();
    }
  }

  countSkipNumber() {
    const result = this.votes.reduce((accumulator, currentVote) => {
      if (currentVote.skip) {
        return ++accumulator;
      } else {
        return accumulator - this.saveValue;
      }
    }, 0);

    return result > 0 ? result : 0;
  }

  processDataFromControlPanel(message) {
    const state = JSON.parse(message);
    const skipometer = state.skipometer;

    this.caption = skipometer.caption;
    this.initialTimeLeft = skipometer.initialTimeLeft;
    this.startVotingTime = skipometer.startVotingTime;
    this.skipNumber = skipometer.skipNumber;
    this.previousState = this.state;
    this.state = skipometer.state;
    this.enableTimer = skipometer.enableTimer;
    this.allowRevote = skipometer.allowRevote;
    this.saveValue = skipometer.saveValue;

    if (this.state === states.RUNNING) {
      const tick = () => {
        const pausedTime = this.pauses.reduce(
          (accumulator, currentPause) => accumulator + currentPause.end - currentPause.start,
          0
        );

        this.timeLeft =
          timeToNumber(this.initialTimeLeft) + this.startTime - Date.now() + pausedTime;

        if (this.timeLeft <= timeToNumber(this.startVotingTime)) {
          this.voting = true;
        }

        if (this.timeLeft <= 0) {
          clearInterval(this.timer);
          this.state = states.TIMEOUT;
          this.timeLeft = 0;
          this.voting = false;
        }

        this.sendToClients();
      };

      if (
        this.previousState === states.STOP ||
        this.previousState === states.TIMEOUT ||
        this.previousState === states.SKIPPED
      ) {
        this.votes = [];
        this.pauses = [];

        if (this.enableTimer) {
          this.startTime = Date.now() - 1;
          this.timer = setInterval(tick, 1000);
          tick();
        } else {
          this.voting = true;
          this.startTime = null;
        }
      }

      if (this.previousState === states.PAUSE && this.enableTimer) {
        this.pauses[this.pauses.length - 1].end = Date.now();
        this.timer = setInterval(tick, 1000);
        tick();
      }
    }

    if (this.state === states.PAUSE && this.enableTimer) {
      if (this.previousState !== states.PAUSE) {
        clearInterval(this.timer);
        this.pauses.push(new Pause(Date.now()));
      }
    }

    if (this.state === states.STOP) {
      clearInterval(this.timer);
      this.startTime = null;
      this.timeLeft = timeToNumber(this.initialTimeLeft);
      this.pauses = [];
      this.votes = [];
      this.voting = false;
    }
  }
}

module.exports = Skipometer;
