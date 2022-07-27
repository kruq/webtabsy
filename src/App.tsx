import React, { useState, useEffect } from 'react';
import './App.css';
import Medicine from './Medicine';
import IMedicine from './models/IMedicine';
import { addMedicine, fetchMedicines, updateMedicine } from './services/medicine.service';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';


function App() {

  const [medicines, setMedicines] = useState<IMedicine[]>([]);
  const [newMedicineName, setNewMedicineName] = useState('');
  const [idOfMedicineDetails, setIdOfMedicineDetails] = useState('');


  const handleNewMedicineNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewMedicineName(event.target.value);
  }

  const handleTakeMedicines = async () => {

    const countDays = (date1: Date, date2: Date) => {
      const diff = date1.getTime() - date2.getTime();
      const noOfDays = Math.floor(diff / (1000 * 3600 * 24));
      console.log(noOfDays);
      return noOfDays;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const m: IMedicine[] = [...medicines];
    m.forEach(async x => {
      x.count = x.count - (countDays(today, new Date(x.lastDateTaken)) * x.dose);
      console.log(x.name, x.count);
      x.lastDateTaken = today;
      console.log(x.lastDateTaken);
      await updateMedicine(x);
    });
    setMedicines(await fetchMedicines());
  };

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
  }, []);

  const handleAddMedicineClick = () => {
    addMedicine(newMedicineName);
    fetchMedicines();
  }

  const getDateWhenMedicinesTaken = () => {
    // return medicines?.length > 0 && new Date(medicines[0]?.lastDateTaken?.toString()).toLocaleDateString('pl-PL')
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = today.getDate() - new Date(medicines[0]?.lastDateTaken?.toString()).getDate();
    if (isNaN(diff)) {
      return "-";
    }
    switch (diff) {
      case 0: return "dzisiaj"
      case 1: return "wczoraj"
      default: return diff + " dni temu";
    }
  }

  return (
    <Container className="my-2">
      <header>
        <Row>
          <Col className="display-6">Webtabsy</Col>
          <Col xs="auto">
            {new Date().toLocaleDateString('pl-PL')}
          </Col>
        </Row>
      </header>
      <section>
        <Row>
          <p>Oznaczone jako wzięte <strong>{getDateWhenMedicinesTaken()}</strong></p>
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
