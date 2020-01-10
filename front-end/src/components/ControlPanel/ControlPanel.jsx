import React from 'react';
import './ControlPanel.css';
import states from '../../misc/states';

class ControlPanel extends React.Component {
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

  updateSkipometer(calback) {
    const skipometer = this.state.skipometer;
    calback(skipometer);
    this.setState({ skipometer: skipometer });
  }

  setStateFromInputs() {
    this.updateSkipometer(skipometer => {
      skipometer.caption = document.getElementById('caption').value;

      skipometer.enableTimer = document.getElementById('enableTimer').checked;
      skipometer.initialTimeLeft = document.getElementById(
        'initialTimeLeft'
      ).value;
      skipometer.startVotingTime = document.getElementById(
        'startVotingTime'
      ).value;

      skipometer.skipNumber = document.getElementById('skipNumber').value;
      skipometer.allowRevote = document.getElementById('allowRevote').checked;
      skipometer.saveValue = document.getElementById('saveValue').value;
    });
  }

  sendStateToWSS() {
    this.ws.send(JSON.stringify(this.state));
  }

  render() {
    return (
      <div className="control-panel">
        <aside
          id="skipometer"
          onClick={() => {
            window.open('/Skipometer');
          }}
        >
          Skipometer
        </aside>

        <header className="control-panel__header">ControlPanel</header>
        <form className="control-panel__form">
          <div className="field">
            Caption:
            <input
              id="caption"
              type="text"
              defaultValue={this.state.skipometer.caption}
            ></input>
          </div>
          <label className="field" htmlFor="enableTimer">
            Enable timer:
            <input
              id="enableTimer"
              type="checkbox"
              defaultChecked={this.state.skipometer.enableTimer}
              onInput={() => {
                this.setStateFromInputs();
                this.sendStateToWSS();
              }}
              disabled={
                this.state.skipometer.state === states.RUNNING ||
                this.state.skipometer.state === states.PAUSE
              }
            ></input>
          </label>
          <div className="field">
            Initial time left:
            <input
              id="initialTimeLeft"
              type="time"
              step="2"
              defaultValue={this.state.skipometer.initialTimeLeft}
              disabled={
                this.state.skipometer.state === states.RUNNING ||
                this.state.skipometer.state === states.PAUSE ||
                !this.state.skipometer.enableTimer
              }
            ></input>
          </div>
          <div className="field">
            Start voting:
            <input
              id="startVotingTime"
              type="time"
              step="2"
              defaultValue={this.state.skipometer.startVotingTime}
              disabled={
                this.state.skipometer.state === states.RUNNING ||
                this.state.skipometer.state === states.PAUSE ||
                !this.state.skipometer.enableTimer
              }
            ></input>
          </div>
          <div className="field">
            Skip number:
            <input
              id="skipNumber"
              type="number"
              min="1"
              defaultValue={this.state.skipometer.skipNumber}
            ></input>
          </div>
          <label className="field" htmlFor="allowRevote">
            Allow revote:
            <input
              id="allowRevote"
              type="checkbox"
              defaultChecked={this.state.skipometer.allowRevote}
              onInput={() => {
                this.setStateFromInputs();
                this.sendStateToWSS();
              }}
            ></input>
          </label>
          <div className="field">
            Save value: {this.state.skipometer.saveValue}
            <input
              id="saveValue"
              type="range"
              min="0"
              max="1"
              step="0.5"
              defaultValue={this.state.skipometer.saveValue}
              disabled={
                this.state.skipometer.state === states.RUNNING ||
                this.state.skipometer.state === states.PAUSE
              }
              onInput={() => {
                this.setStateFromInputs();
              }}
            ></input>
          </div>
          <div className="buttons">
            <input
              id="start"
              type="button"
              value="Start"
              hidden={this.state.skipometer.state === states.RUNNING}
              onClick={() => {
                this.setStateFromInputs();
                this.updateSkipometer(skipometer => {
                  skipometer.state = states.RUNNING;
                });
                this.sendStateToWSS();
              }}
            />
            <input
              id="pause"
              type="button"
              value="Pause"
              hidden={
                this.state.skipometer.state !== states.RUNNING ||
                !this.state.skipometer.enableTimer
              }
              onClick={() => {
                this.updateSkipometer(skipometer => {
                  skipometer.state = states.PAUSE;
                });
                this.sendStateToWSS();
              }}
            />
            <input
              id="reset"
              type="button"
              value="Reset"
              onClick={() => {
                this.updateSkipometer(skipometer => {
                  skipometer.state = states.STOP;
                });
                this.setStateFromInputs();
                this.sendStateToWSS();
              }}
            />
          </div>
        </form>
        <div className="logs">
          {this.state.skipometer.votes.map((vote, index) => (
            <div
              key={'vote#' + index}
              className={
                'logs__element' +
                (vote.skip ? ' logs__element--red' : ' logs__element--green')
              }
            >{`${vote.nickname}: ${
              vote.skip ? 'skip +1' : 'save -' + this.state.skipometer.saveValue
            }`}</div>
          ))}
        </div>
      </div>
    );
  }
}

export default ControlPanel;
