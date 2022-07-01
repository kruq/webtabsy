import React, { useState, useEffect } from 'react';
import './App.css';


interface IMedicine { 
  id: string; 
  name: string;
  count: number; 
}

function App() {

  const apiUrl = 'https://webtabsyapi.execa.pl/medicine'
//  const apiUrl = 'https://localhost:7078/medicine'

  const [medicines, setMedicines] = useState<IMedicine[]>([]);
  const [newMedicineName, setNewMedicineName] = useState('');


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

  const updateMedicine = (medicine: IMedicine) => {
    fetch(apiUrl, {
      method: "PUT",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medicine)
    })
    .then(_ => fetchMedicines());
  }

  const deleteMedicine = (medicine: IMedicine) => {
    fetch(apiUrl, {
      method: "DELETE",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medicine)
    })
    .then(_ => fetchMedicines());
  }

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleNewMedicineNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewMedicineName(event.target.value);
  }

  const handleMedicineCountChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const m: IMedicine[] = [...medicines];
    m[index].count = parseFloat(event.target.value);
    setMedicines(m);
    updateMedicine(m[index]);
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
        <div>{ medicines.map((x: IMedicine, i:number) => 
                <div key={i}>
                  <h2><button onClick={() => deleteMedicine(x)}>Usuń</button> {x.name}: {x.count} tab.</h2>
                  Ustaw ilość: <input type="number" value={x.count} onChange={(e) => handleMedicineCountChange(e, i)} />
                </div>) 
             }
        </div>
      </section>
    </div>
  );
}

export default App;
