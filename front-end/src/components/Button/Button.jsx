import React from 'react';

class Button extends React.Component {
  render() {
    return (
      <input
        type="button"
        value={this.props.caption}
        onClick={this.props.callback}
      />
    );
  }
}

export default Button;
