import React, { useState, useEffect } from 'react';
import './App.css';


interface IMedicine { 
  id: string; 
  name: string;
  count: number;
  dose: number;
  lastDateTaken: Date;  
}

function App() {

//  const apiUrl = 'https://webtabsyapi.execa.pl/medicine'
//  const apiUrl = 'https://localhost:7078/medicine'
  const apiUrl = 'https://webtabsyapi.azurewebsites.net/medicine'

  const [medicines, setMedicines] = useState<IMedicine[]>([]);
  const [newMedicineName, setNewMedicineName] = useState('');
  const [idOfMedicineDetails, setIdOfMedicineDetails] = useState('');


  const fetchMedicines = () => {
    fetch(apiUrl, { mode:'cors' })
    .then(res => res.json())
    .then(text => { setMedicines(text); })
    .catch(e => alert(e));
  }

  const addMedicine = () => {
    fetch(apiUrl, { 
        method: "POST", 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newMedicineName }) 
    })
    .then(_ => fetchMedicines())
    .catch(e => alert(e));
  }

  const updateMedicine = (medicine: IMedicine) => {
    fetch(apiUrl, {
      method: "PUT",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medicine)
    })
    .then(_ => fetchMedicines())
    .catch(e => alert(e));
  }

  const deleteMedicine = (medicine: IMedicine) => {
    fetch(apiUrl, {
      method: "DELETE",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medicine)
    })
    .then(_ => fetchMedicines())
    .catch(e => alert(e));
  }

  const toogleDetailsVisibility = (medicine: IMedicine) => {
    const current = medicines.find(x => x.id === medicine.id);
    if (current) {
      if (idOfMedicineDetails === current.id) {
        setIdOfMedicineDetails('');
      } else {
        setIdOfMedicineDetails(medicine.id);
      }
    }
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

  const handleMedicineDoseChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const m: IMedicine[] = [...medicines];
    m[index].dose = parseFloat(event.target.value);
    setMedicines(m);
    updateMedicine(m[index]);
  }

  const handleTakeMedicines = () => {
//  m.forEach(x => { x.lastDateTaken = new Date(2022,6,1); updateMedicine(x);});

    const countDays = (date1: Date, date2: Date) => {
      const diff = date1.getTime() - date2.getTime();
      return Math.floor(diff / (1000 * 3600 * 24));
    }

    const today = new Date();
    const m: IMedicine[] = [...medicines];
    m.forEach(x =>  {
      x.count = x.count - (countDays(today, new Date(x.lastDateTaken)) * x.dose);
      x.lastDateTaken = today;
      updateMedicine(x);
    });
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
          <p>Ostatnio oznaczone jako wzięte <strong>{ medicines?.length > 0 && new Date(medicines[0]?.lastDateTaken?.toString()).toLocaleDateString() }</strong></p>
          <p><button onClick={handleTakeMedicines}>Weź leki</button></p>
        </div>
        <hr />
        <div>
          <div>{ medicines.length > 0 || (<span>Loading...</span>) }</div>
          <div>{ medicines.map((x: IMedicine, i:number) => 
                <div key={i}>
                  <h3 className="medicine-title" onClick={() => toogleDetailsVisibility(x)}>
                      {x.name}: <small>{x.count} tab.</small>
                  </h3>
                  <div hidden={x.id !== idOfMedicineDetails}>
                    <p><button onClick={() => deleteMedicine(x)}>Usuń</button></p>
                    <p>Ilość tabletek: <input type="number" value={x.count} onChange={(e) => handleMedicineCountChange(e, i)} /></p>
                    <p>Dzienna dawka : <input type="number" value={x.dose} onChange={(e) => handleMedicineDoseChange(e, i)} /></p>
                  </div>
                </div>) 
             }</div>
        </div>
        <hr />
        <div>
            <h3>Nowy lek</h3>
            <p><label>Nazwa leku: </label>
              <input  type="text" 
                      value={newMedicineName} 
                      onChange={handleNewMedicineNameChange} />
              <button type="button" onClick={addMedicine}>Dodaj</button>
            </p>
        </div>
      </section>
    </div>
  );
}

export default App;
