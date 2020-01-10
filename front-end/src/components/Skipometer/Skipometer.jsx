import React from 'react';
import './Skipometer.css';
import numberToTime from '../../misc/numberToTime';
import states from '../../misc/states';

class Skipometer extends React.Component {
  constructor(props) {
    super(props);

    this.state = { skipometer: { votes: [] } };

    this.ws = new WebSocket('ws://localhost:5000');
  }

  componentDidMount() {
    this.ws.onmessage = event => {
      this.setState(JSON.parse(event.data));
    };
  }

  render() {
    return (
      <div className="skipometer">
        <div
          className={
            'skipometer__progress-bar' +
            (this.state.skipometer.state === states.SKIPPED
              ? ' skipometer__progress-bar--skipped'
              : '')
          }
          hidden={
            !(
              this.state.skipometer.voting ||
              this.state.skipometer.state === states.TIMEOUT ||
              this.state.skipometer.state === states.SKIPPED
            )
          }
        >
          <div
            style={{
              width: `${(this.state.skipometer.currentSkipNumber /
                this.state.skipometer.skipNumber) *
                100}%`
            }}
          ></div>
          {this.state.skipometer.currentSkipNumber}/
          {this.state.skipometer.skipNumber}
        </div>
        <div className="skipometer__caption">
          {this.state.skipometer.caption}
        </div>
        <div
          className={
            'skipometer__time' +
            (this.state.skipometer.state === states.TIMEOUT ||
            this.state.skipometer.state === states.SKIPPED
              ? ' skipometer__time--timeout'
              : '')
          }
          hidden={!this.state.skipometer.enableTimer}
        >
          {numberToTime(this.state.skipometer.timeLeft)}
        </div>
      </div>
    );
  }
}

export default Skipometer;
