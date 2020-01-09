const states = require('../misc/states');
const numberToTime = require('../misc/numberToTime');
const timeToNumber = require('../misc/timeToNumber');
const Pause = require('./Pause');

class Skipometer {
  constructor(
    webSocketServer,
    caption = '',
    initialTimeLeft = '01:00:00',
    startVotingTime = '00:30:00',
    skipNumber = 10
  ) {
    this.webSocketServer = webSocketServer;
    this.caption = caption;
    this.initialTimeLeft = initialTimeLeft;
    this.startVotingTime = startVotingTime;
    this.skipNumber = skipNumber;
    this.state = states.STOP;
    this.voting = false;
    this.votes = [];
    this.startTime = null;
    this.timeLeft = timeToNumber(this.initialTimeLeft);
    this.timer = null;
    this.previousState = states.STOP;
    this.pauses = [];
  }

  sendToClients() {
    this.webSocketServer.clients.forEach(client => {
      client.send(
        JSON.stringify({
          skipometer: {
            caption: this.caption,
            initialTimeLeft: this.initialTimeLeft,
            startVotingTime: this.startVotingTime,
            skipNumber: this.skipNumber,
            currentSkipNumber: this.countSkipNumber(),
            state: this.state,
            voting: this.voting,
            startTime: this.startTime,
            timeLeft: this.timeLeft,
            votes: this.votes,
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
    if (this.countSkipNumber() >= this.skipNumber) {
      clearInterval(this.timer);
      this.state = states.SKIPPED;
      this.voting = false;
    }
    this.sendToClients();
  }

  countSkipNumber() {
    return this.votes.reduce((accumulator, currentVote) => {
      if (currentVote.skip) {
        return ++accumulator;
      } else {
        return --accumulator;
      }
    }, 0);
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

    if (this.state === states.TIMING) {
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
        this.startTime = Date.now() - 1;
        this.pauses = [];
        this.votes = [];
        this.timer = setInterval(tick, 1000);
        tick();
      }

      if (this.previousState === states.PAUSE) {
        this.pauses[this.pauses.length - 1].end = Date.now();
        this.timer = setInterval(tick, 1000);
        tick();
      }
    }

    if (this.state === states.PAUSE) {
      if (this.previousState !== states.PAUSE) {
        clearInterval(this.timer);
        this.pauses.push(new Pause(Date.now()));
      }

      this.sendToClients();
    }

    if (this.state === states.STOP) {
      clearInterval(this.timer);
      this.startTime = null;
      this.timeLeft = timeToNumber(this.initialTimeLeft);
      this.pauses = [];
      this.votes = [];
      this.voting = false;
      this.sendToClients();
    }
  }
}

module.exports = Skipometer;
