import React from 'react';
import logo from './logo.svg';
import './App.css';
import axios from 'axios';

function App() {

  async function getData() {
    try {
      const response = await axios.get('http://webtabsyapi.execa.pl/medicine');
      return response
    } catch (error) {
      alert(error);  
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
          { getData() }
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Webtabsy are going
        </a>
      </header>
    </div>
  );
}

export default App;
