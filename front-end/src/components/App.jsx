import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import ControlPanel from './ControlPanel/ControlPanel';
import Skipometer from './Skipometer/Skipometer';
import './common/style.css';

class App extends React.Component {
  render() {
    return (
      <Router>
        <Route exact path="/">
          <ControlPanel />
        </Route>
        <Route path="/ControlPanel">
          <ControlPanel />
        </Route>
        <Route path="/Skipometer">
          <Skipometer />
        </Route>
      </Router>
    );
  }
}

export default App;
