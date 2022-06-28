import React, { useState, useEffect } from 'react';
import './App.css';

// type Medicine = { name: string }

function App() {

  const apiUrl = 'https://webtabsyapi.execa.pl/medicine'
//  const apiUrl = 'https://localhost:7078/medicine'

  const [medicines, setMedicines] = useState([]);
  const [newMedicineName, setNewMedicineName] = useState('Nazwa leku');


  const fetchMedicines = () => {
    fetch(apiUrl, { mode:'cors' })
    .then(res => res.json())
    .then(text => { setMedicines(text); });
  }

  const addMedicine = () => {
    fetch(apiUrl, { 
        method: "POST", 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newMedicineName }) 
    })
    .then(_ => fetchMedicines());
    
  }

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleNewMedicineNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewMedicineName(event.target.value);
  }

  return (
    <div className="App">
      <header className="App-header">
        <p>
            Webtabsy
        </p>
      </header>
      <section>
        <div>
            <p><label>Nazwa leku: </label>
              <input  type="text" 
                      value={newMedicineName} 
                      onChange={handleNewMedicineNameChange} />
              <button type="button" onClick={addMedicine}>Dodaj</button>
            </p>
        </div>
        <div>{ medicines.map((x:{ name: string },i) => <p key={i}>{i}: {x.name}</p>) }</div>
      </section>
    </div>
  );
}

export default App;
