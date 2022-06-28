import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

function App() {

  let [medicines, setMedicines] = useState('Ładuję...');

  useEffect(() => {
    fetch('https://webtabsyapi.execa.pl/medicine', { mode:'cors' })
    .then(res => res.text())
    .then(text => { setMedicines(text); });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <p>{ medicines }</p>
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
