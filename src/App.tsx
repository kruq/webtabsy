import React, { useState, useEffect } from 'react';
import './App.css';

// type Medicine = { name: string }

function App() {

  const apiUrl = 'https://webtabsyapi.execa.pl/medicine'
//  const apiUrl = 'https://localhost:7078/medicine'

  let [medicines, setMedicines] = useState([]);

  useEffect(() => {
    fetch(apiUrl, { mode:'cors' })
    .then(res => res.json())
    .then(text => { setMedicines(text); });
  }, []);

  const addMedicine = () => {
    fetch(apiUrl, { 
        method: "POST", 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: "aaa", name: "Nowy lek" }) 
    });
  }

  return (
    <div className="App">
      <header className="App-header">
        <p>
            Webtabsy
        </p>
        <div>
            <label>Nazwa leku:</label>
            <input type="text" />
            <button type="button" onClick={addMedicine}>Dodaj</button>
        </div>
        <div>{ medicines.map((x: {id: string, name: string},i) => <p key={i}>{x.id}: {x.name}</p>) }</div>
      </header>
    </div>
  );
}

export default App;
