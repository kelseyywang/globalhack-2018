import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        Welcome to SLafety Net.
        <TextBox />
      </div>
    );
  }
}

class TextBox extends Component
{
  constructor(props)
  {
      super(props);
      this.state = {

      }
  }

  render()
  {
    return (
      <input type="text" ></input>
    );
  }
}

export default App;
