import React, { useState, useEffect } from 'react';
import './App.css';
import Medicine from './Medicine';
import IMedicine from './models/IMedicine';
import { addMedicine, fetchMedicines, updateMedicine } from './services/medicine.service';


function App() {

  const [medicines, setMedicines] = useState<IMedicine[]>([]);
  const [newMedicineName, setNewMedicineName] = useState('');
  const [idOfMedicineDetails, setIdOfMedicineDetails] = useState('');

  useEffect(() => {
    setMedicines([]);
    const getMedicines = async () => {
      const medicines = await fetchMedicines();
      setMedicines(medicines);
    };

    getMedicines();
    handleTakeMedicines();
  }, []);

  const handleNewMedicineNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewMedicineName(event.target.value);
  }

  const handleTakeMedicines = () => {

    const countDays = (date1: Date, date2: Date) => {
      const diff = date1.getTime() - date2.getTime();
      const noOfDays = Math.floor(diff / (1000 * 3600 * 24));
      console.log(noOfDays);
      return noOfDays;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const m: IMedicine[] = [...medicines];
    m.forEach(x => {
      x.count = x.count - (countDays(today, new Date(x.lastDateTaken)) * x.dose);
      console.log(x.name, x.count);
      x.lastDateTaken = today;
      console.log(x.lastDateTaken);
      updateMedicine(x);
    });
  }

  const handleAddMedicineClick = () => {
    addMedicine(newMedicineName);
    fetchMedicines();
  }

  const handleMedicineClick = (medicineId: string) => {
    if (idOfMedicineDetails === medicineId) {
      setIdOfMedicineDetails('');
    } else {
      setIdOfMedicineDetails(medicineId);
    }
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
          <p>Ostatnio oznaczone jako wzięte <strong>{medicines?.length > 0 && new Date(medicines[0]?.lastDateTaken?.toString()).toLocaleDateString()}</strong></p>
          {/* <p><button onClick={handleTakeMedicines}>Weź leki</button></p> */}
        </div>
        <hr />
        <div>
          <div>{medicines.length > 0 || (<span>Loading...</span>)}</div>
          <div>{medicines.map((x: IMedicine, i: number) => <Medicine key={i} medicine={x} idOfMedicineDetails={idOfMedicineDetails} medicineClick={handleMedicineClick} />)}</div>
        </div>
        <hr />
        <div>
          <h3>Nowy lek</h3>
          <p><label>Nazwa leku: </label>
            <input type="text"
              value={newMedicineName}
              onChange={handleNewMedicineNameChange} />
            <button type="button" onClick={handleAddMedicineClick}>Dodaj</button>
          </p>
        </div>
      </section>
    </div>
  );
}

export default App;
