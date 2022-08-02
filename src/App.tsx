import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Medicine from './Medicine';
import IMedicine from './models/IMedicine';
import { addMedicine, fetchMedicines, updateMedicine } from './services/medicine.service';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';


function App() {

  const [medicines, setMedicines] = useState<IMedicine[]>([]);
  const [newMedicineName, setNewMedicineName] = useState('');
  const [idOfMedicineDetails, setIdOfMedicineDetails] = useState('');
  const [showSpinner, setShowSpinner] = useState(false);

  const handleNewMedicineNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewMedicineName(event.target.value);
  }

  const countDays = (date1: Date, date2: Date) => {
    const diff = date1.getTime() - date2.getTime();
    const noOfDays = Math.floor(diff / (1000 * 3600 * 24));
    return noOfDays;
  }

  const handleTakeMedicines = async () => {
    setShowSpinner(true);
    const today = new Date();
    const m: IMedicine[] = [...medicines];
    m.forEach(async x => {
      console.log(`${x.name.toUpperCase()}`);
      let noOfDays = countDays(today, new Date(x.lastDateTaken));
      let sum = 0;
      for (let i = noOfDays; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        sum += x.doses.reduce((prevValue, dose) => {
          const hourAndMinute = dose.time.split(":");
          date.setHours(parseInt(hourAndMinute[0]), parseInt(hourAndMinute[1]), 0, 0);
          // console.log(new Date(x.lastDateTaken.toString()), date, today);
          if (date > new Date(x.lastDateTaken.toString()) && date < today) {
            const totalDose = dose.amount ?? 0;
            // const text = `${x.name}: ${date.toLocaleString("pl-PL")}`;
            // console.log(`${text} - ${dose.amount ?? 0} tab., razem ${prevValue + totalDose} `);
            return prevValue + totalDose;
          }
          return prevValue;
        }, 0);
      }
      // x.count = x.count - (countDays(today, new Date(x.lastDateTaken)) * x.dose);
      console.log(x.name, sum, x.count);
      x.count -= sum;
      const newDateTaken = today;
      // newDateTaken.setDate(today.getDate() - 2)
      // newDateTaken.setHours(10,0,0,0);
      x.lastDateTaken = new Date(newDateTaken);
      await updateMedicine(x);
    });
    setMedicines(await fetchMedicines());
    setShowSpinner(false);
  }

  const getNotTakenDoses = useCallback(() => {
    const today = new Date();
    const m: IMedicine[] = [...medicines];
    const elements = m.reduce((collection: string[], x) => {
      console.log(`${x.name.toUpperCase()}`);
      let noOfDays = countDays(today, new Date(x.lastDateTaken));
      let items: string[] = [];
      for (let i = noOfDays; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const newArray = x.doses.filter(dose => {
          const hourAndMinute = dose.time.split(":");
          date.setHours(parseInt(hourAndMinute[0]), parseInt(hourAndMinute[1]), 0, 0);
          const result = ((date > new Date(x.lastDateTaken.toString())) && (date < today))
          return result;
        }).map(dose => `${date.toLocaleDateString('pl-PL')} ${dose.time}: ${dose.amount} tab.`);
        items = items.concat(newArray);
      }
      return collection.concat(items.map(y => `${x.name} - ${y}`));
    }, []);
    console.log(elements);
    return elements.map(x => <p>{x}</p>);
  }, [medicines]);

  const handleMedicineClick = (medicineId: string) => {
    if (idOfMedicineDetails === medicineId) {
      setIdOfMedicineDetails('');
    } else {
      setIdOfMedicineDetails(medicineId);
    }
  }

  // useEffect(() => {
  //   // setMedicines([]);
  //   const getMedicines = async () => {
  //     const medicines = await fetchMedicines();
  //     setMedicines(medicines);
  //   };

  //   getMedicines();
  //   // handleTakeMedicines();
  // }
  //   //, [handleTakeMedicines]
  //   , [medicines]
  // );

  useEffect(() => {
    fetchMedicines().then(x => setMedicines(x));
  }, [medicines]);

  const handleAddMedicineClick = () => {
    addMedicine(newMedicineName);
    fetchMedicines();
  }

  const getDateWhenMedicinesTaken = useCallback(() => {
    // return medicines?.length > 0 && new Date(medicines[0]?.lastDateTaken?.toString()).toLocaleDateString('pl-PL')
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(medicines[0]?.lastDateTaken?.toString());
    const diff = countDays(today, date);
    if (isNaN(diff)) {
      return "-";
    }
    const h = date.getHours().toString();
    let m = date.getMinutes().toString();
    if (m.length === 1) {
      m = "0" + m;
    }
    switch (diff) {
      case -1:
      case 0: return `dzisiaj o ${h}:${m}`
      case 1: return `wczoraj o ${h}:${m}`
      default: return diff + ` dni temu - ${date.toLocaleDateString('pl-PL')} o ${h}:${m}`;
    }
  }, [medicines]);

  return (
    <Container className="my-2">
      <header>
        <Row>
          <Col className="display-6">Webtabsy
            <Spinner animation="border" variant="primary" hidden={!showSpinner} />
          </Col>
          <Col xs="auto" className="text-end">
            <p>Dzisiaj jest <strong>{new Date().toLocaleDateString('pl-PL')}</strong></p>
            <p>Oznaczone jako wzięte <strong>{getDateWhenMedicinesTaken()}</strong></p>
          </Col>
        </Row>
      </header>
      <section>
        {getNotTakenDoses()}
      </section>
      <section>
        <Row>
          <Col xs="auto"><Button onClick={handleTakeMedicines}>Weź leki</Button></Col>
        </Row>
        <hr />
        <div>
          <div>{medicines.length > 0 || (<span>Loading...</span>)}</div>
          <div>{medicines.map((x: IMedicine, i: number) => <Medicine key={i} medicine={x} idOfMedicineDetails={idOfMedicineDetails} medicineClick={handleMedicineClick} />)}</div>
        </div>
        <hr />
        <div>
          <h3>Nowy lek</h3>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nazwa leku</Form.Label>
              <Form.Control type="text"
                value={newMedicineName}
                onChange={handleNewMedicineNameChange}>
              </Form.Control>
            </Form.Group>
            <Button type="button" onClick={handleAddMedicineClick} variant="primary">Dodaj</Button>
          </Form>
        </div>
      </section>
    </Container >
  );
}

export default App;
