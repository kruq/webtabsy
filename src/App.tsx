import React from 'react';
import logo from './logo.svg';
import './App.css';
// import axios from 'axios';

function App() {

  let d;  
  fetch('https://webtabsyapi.execa.pl/medicine', {mode:'cors'})
                .then(res => d = res); 

  console.log(d);
  console.log(d.json());
  console.log(JSON(d.json()));

  d = JSON(d.json());

/*
  async function getData() {
    try {
      const response = await axios.get('https://webtabsyapi.execa.pl/medicine');
      return response.json()
    } catch (error) {
      console.log(error);  
    }
  }

  const Data = ({data: []}) : Component => (
    <p>
        {data.map((x: string,i: number) => (<p key={i}>{x}</p>))}
    </p>
  );
*/

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <p>{ d }</p>
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
