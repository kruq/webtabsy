import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Medicine from './Medicine';
import IMedicine from './models/IMedicine';
import { addMedicine, fetchMedicines, updateMedicine, deleteMedicine } from './services/medicine.service';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';


function App() {

  const [notTakenDoses, setNotTakenDoses] = useState<{ medicineName: string, time: string, dose: string }[]>([])
  const [medicines, setMedicines] = useState<IMedicine[]>([]);
  const [newMedicineName, setNewMedicineName] = useState('');
  const [idOfMedicineDetails, setIdOfMedicineDetails] = useState('');
  const [showSpinner, setShowSpinner] = useState(false);

  const handleNewMedicineNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewMedicineName(event.target.value);
  }

  const countDays = (date1: Date, date2: Date) => {
    const date11 = new Date(date1);
    const date22 = new Date(date2);
    date11.setHours(0, 0, 0, 0);
    date22.setHours(0, 0, 0, 0);
    const diff = date11.getTime() - date22.getTime();
    const noOfDays = Math.floor(diff / (1000 * 3600 * 24));
    return noOfDays;
  }

  const handleTakeMedicines = () => {
    setShowSpinner(true);
    const today = new Date();
    const m: IMedicine[] = [...medicines];
    const newm: IMedicine[] = [];
    for (let j = 0; j < m.length; j++) {
      const x = m[j];
      // console.log(`${x.name.toUpperCase()}`);
      let noOfDays = countDays(today, new Date(x.lastDateTaken));
      let sum = 0;
      for (let i = noOfDays; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        sum += x.doses.reduce((prevValue, dose) => {
          const hourAndMinute = dose.time.split(":");
          date.setHours(parseInt(hourAndMinute[0]), parseInt(hourAndMinute[1]), 0, 0);
          if (date > new Date(x.lastDateTaken.toString()) && date < today) {
            const totalDose = dose.amount ?? 0;
            return prevValue + totalDose;
          }
          return prevValue;
        }, 0);
      }
      console.log(x.name, sum, x.count);
      x.count -= sum;
      const newDateTaken = today;
      x.lastDateTaken = new Date(newDateTaken);
      newm.push(x);
    }

    newm.forEach(x => updateMedicine(x));
    console.log("set medicines when take medicines", newm);
    setMedicines([...newm]);
    setNotTakenDoses([]);
    setShowSpinner(false);
  };

  type DoseDetails = { medicineName: string, dose: string, time: string }

  const refreshNotTakenDoses = useCallback((meds: IMedicine[]) => {

    const weekDays = [
      'Nd',
      'Pn',
      'Wt',
      'Śr',
      'Czw',
      'Pt',
      'Sb'
    ]

    const formatDate = (date: Date) => {
      let d = weekDays[date.getDay()];
      d = `${d}. ${date.getDate()}`;
      if (date.getDate() === (new Date()).getDate()) {
        d = "dziś";
      }
      return d;
    }

    console.log('getNotTakenDoses');
    const today = new Date();
    // const meds = [...medicines];
    console.log("medicines: " + meds.length)
    const elements = meds.reduce((collection: DoseDetails[], x) => {
      let noOfDays = countDays(today, new Date(x.lastDateTaken));
      console.log(`noOfDays = ${noOfDays}`)
      if (noOfDays > 100) {
        noOfDays = 0;
      }
      let items: DoseDetails[] = [];
      for (let i = noOfDays; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const newArray = x.doses.filter(dose => {
          const hourAndMinute = dose.time.split(":");
          date.setHours(parseInt(hourAndMinute[0]), parseInt(hourAndMinute[1]), 0, 0);
          const result = ((date > new Date(x.lastDateTaken.toString())) && (date < today))
          return result;
        }).map(dose => { return { medicineName: '', dose: `${dose.amount} tab. `, time: `${formatDate(date)}, godz ${dose.time}` } });
        items = items.concat(newArray);
      }
      return collection.concat(items.map(y => { y.medicineName = x.name; return y }));
    }, []);
    console.log(elements);
    return elements
      .sort((a, b) => { return a.time > b.time ? 1 : -1 });

  }, []);

  const handleMedicineClick = (medicineId: string) => {
    if (idOfMedicineDetails === medicineId) {
      setIdOfMedicineDetails('');
    } else {
      setIdOfMedicineDetails(medicineId);
    }
  }

  useEffect(() => {
    setShowSpinner(true);
    fetchMedicines().then(x => {
      console.log('set medicines in use effect ', x)
      setMedicines(x);
      // const elements = getNotTakenDoses();
      // setNotTakenDoses(elements);
      const m = refreshNotTakenDoses(x);
      setNotTakenDoses(m);
      // console.log("use effect", m);
      setShowSpinner(false);
    });
    /*
    timer = setInterval(() => handleRefresh(), 100 * 1000);
    let timer: NodeJS.Timer;
    Notification.requestPermission().then((result) => console.log(result));
    return () => clearInterval(timer);
    */
  }, [refreshNotTakenDoses]);

  const handleAddMedicineClick = async () => {
    setShowSpinner(true);
    const newMedicine: IMedicine = {
      id: '',
      name: newMedicineName,
      count: 0,
      lastDateTaken: new Date(),
      doses: [],
    };
    await addMedicine(newMedicine);
    setMedicines(await fetchMedicines());
    setShowSpinner(false);
  }

  const handleDeleteMedicine = async (id: string): Promise<void> => {
    setShowSpinner(true);
    const medicine = medicines.find(m => m.id === id);
    if (!medicine) { return }
    await deleteMedicine(medicine);
    const meds = medicines.filter(m => m.id !== medicine.id);
    setMedicines(meds);
    const m = refreshNotTakenDoses(meds);
    console.log("delete medicine", m);
    setNotTakenDoses(m);
    setShowSpinner(false);
  }

  const handleUpdateMedicine = async (id: string, params: any) => {
    setShowSpinner(true);
    const meds = medicines.map(m => {
      if (m.id === id) {
        return { ...m, ...params };
      }
      return m;
    });
    setMedicines(meds);
    const medicine = medicines.find(m => m.id === id);
    if (!medicine) { return }
    console.log('Update new medicine', medicine, params);
    await updateMedicine(medicine);
    const m = refreshNotTakenDoses(meds);
    console.log("updeate medicine", m);
    setNotTakenDoses(m);
    setShowSpinner(false);
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
      case -1: return `jutro ????`
      case 0: return `dzisiaj o ${h}:${m}`
      case 1: return `wczoraj o ${h}:${m}`
      default: return diff + ` dni temu - ${date.toLocaleDateString('pl-PL')} o ${h}:${m}`;
    }
  }, [medicines]);

  return (
    <>
      <div style={{ position: 'absolute', top: '0', left: '0', bottom: '0', right: '0', backgroundColor: '#ffffffcc', zIndex: '1000', fontSize: '10rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }} hidden={!showSpinner}  >
        <Spinner animation="border" variant='primary' />
      </div>
      <Container className="my-2">
        <header className='mb-2'>
          <Row>
            <Col className="display-6">
              Webtabsy
            </Col>
            <Col xs="auto" className="text-end">
              <small>Dzisiaj: <strong>{new Date().toLocaleDateString('pl-PL')}</strong></small><br />
              <small>Oznaczone: <strong>{getDateWhenMedicinesTaken()}</strong></small>
            </Col>
          </Row>
        </header>
        <section className='mb-2'>
          <Card>
            <Card.Header>Pominięte dawki</Card.Header>
            <ListGroup variant="flush">
              {notTakenDoses.map(x =>
                <ListGroup.Item key={x.medicineName + x.time}>
                  <Row>
                    <Col xs="3" sm="2" lg="1" className="text-end">{x.dose}</Col>
                    <Col>{x.medicineName} </Col><Col xs="auto"><small>{x.time}</small></Col>
                  </Row>
                </ListGroup.Item>)}
            </ListGroup>
          </Card>
        </section>
        <section>
          <Row>
            <Col xs="auto"><Button onClick={handleTakeMedicines} >Weź leki</Button></Col>
          </Row>
          <hr />
          <div>
            <div>{medicines.length > 0 || (<span>Loading...</span>)}</div>
            <div>{medicines.map((x: IMedicine, i: number) =>
              <Medicine
                key={i}
                {...x}
                idOfMedicineDetails={idOfMedicineDetails}
                medicineClick={handleMedicineClick}
                updateMedicine={handleUpdateMedicine}
                deleteMedicine={handleDeleteMedicine}
              />
            )}
            </div>
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
    </>
  );
}

export default App;
