import React, { useState, useEffect, useCallback, MouseEvent } from 'react';
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
import IDose from './models/IDose';


function App() {

  const [notTakenDoses, setNotTakenDoses] = useState<{ medicineName: string, time: string, dose: string }[]>([])
  const [medicines, setMedicines] = useState<IMedicine[]>([]);
  const [newMedicineName, setNewMedicineName] = useState('');
  const [idOfMedicineDetails, setIdOfMedicineDetails] = useState('');
  const [showSpinner, setShowSpinner] = useState(true);

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
    const meds: IMedicine[] = [...medicines];
    const newm: IMedicine[] = [];
    for (let medIndex = 0; medIndex < meds.length; medIndex++) {
      const med = meds[medIndex];
      // console.log(`${x.name.toUpperCase()}`);
      let sum = 0;
      sum += med.doses.reduce((prevValue, dose) => {
        let noOfDays = countDays(today, new Date(dose.takingDate));
        for (let i = noOfDays; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const hourAndMinute = dose.time.split(":");
          date.setHours(parseInt(hourAndMinute[0]), parseInt(hourAndMinute[1]), 0, 0);
          if (date > new Date(dose.takingDate.toString()) && date < today) {
            const totalDose = dose.amount ?? 0;
            return prevValue + totalDose;
          }
        }
        return prevValue;
      }, 0);
      console.log(med.name, sum, med.count);
      med.count -= sum;
      const newDateTaken = today;
      med.doses.forEach(d => d.takingDate = new Date(newDateTaken));
      newm.push(med);
    }

    newm.forEach(async (x) => await updateMedicine(x));
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

    interface IDoseWithDate extends IDose {
      date: Date
    }

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
      let dosesArray: DoseDetails[] = [];

      const newDosesArray = x.doses.flatMap(dose => {

        let noOfDays = countDays(today, new Date(dose.takingDate));
        console.log(`noOfDays = ${noOfDays}`)
        if (noOfDays > 100) {
          noOfDays = 0;
        }

        // Create array of numbers in sequence starting from 0
        const days = [...Array.from(Array(noOfDays + 1).keys())];
        console.log(days);

        return days.reverse().reduce((foundDoses, dayNo) => {
          const date = new Date(today);
          date.setDate(date.getDate() - dayNo);

          const hourAndMinute = dose.time.split(":");
          date.setHours(parseInt(hourAndMinute[0]), parseInt(hourAndMinute[1]), 0, 0);
          if ((date > new Date(dose.takingDate.toString())) && (date < today)) {
            foundDoses.push({ ...dose, date });
          }
          return foundDoses;
        }, new Array<IDoseWithDate>());
      }).map(dose => { return { medicineName: '', dose: `${dose.amount} tab. `, time: `${formatDate(dose.date)}, godz ${dose.time}` } });
      dosesArray = dosesArray.concat(newDosesArray);
      return collection.concat(dosesArray.map(y => { y.medicineName = x.name; return y }));
    }, []);


    console.log(elements);
    return elements
      .sort((a, b) => { return a.time > b.time ? 1 : -1 });

    // useCallback
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
    fetchMedicines().then(meds => {
      setMedicines(meds);
      setNotTakenDoses(refreshNotTakenDoses(meds));
      setShowSpinner(false);
    });
    /*
    timer = setInterval(() => handleRefresh(), 100 * 1000);
    let timer: NodeJS.Timer;
    Notification.requestPermission().then((result) => console.log(result));
    return () => clearInterval(timer);
    */
  }, [refreshNotTakenDoses]);

  const handleAddMedicineClick = async (e: MouseEvent) => {
    setShowSpinner(true);
    e.preventDefault();
    const newMedicine: IMedicine = {
      id: '',
      name: newMedicineName,
      count: 0,
      doses: [],
    };
    await addMedicine(newMedicine);
    setMedicines(await fetchMedicines());
    setNewMedicineName('');
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
    // setShowSpinner(true);
    let newMedicine = null;
    const meds = medicines.map(m => {
      if (m.id === id) {
        newMedicine = { ...m, ...params };
        return newMedicine
      }
      return m;
    });
    setMedicines(meds);
    if (!newMedicine) { return }
    console.log('Update new medicine', newMedicine, params);
    await updateMedicine(newMedicine);
    const m = refreshNotTakenDoses(meds);
    setNotTakenDoses(m);
    // setShowSpinner(false);
  }

  // const getDateWhenMedicinesTaken = useCallback(() => {
  //   // return medicines?.length > 0 && new Date(medicines[0]?.lastDateTaken?.toString()).toLocaleDateString('pl-PL')
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);
  //   const date = new Date(medicines[0]?.lastDateTaken?.toString());
  //   const diff = countDays(today, date);
  //   if (isNaN(diff)) {
  //     return "-";
  //   }
  //   const h = date.getHours().toString();
  //   let m = date.getMinutes().toString();
  //   if (m.length === 1) {
  //     m = "0" + m;
  //   }
  //   switch (diff) {
  //     case -1: return `jutro ????`
  //     case 0: return `dzisiaj o ${h}:${m}`
  //     case 1: return `wczoraj o ${h}:${m}`
  //     default: return diff + ` dni temu - ${date.toLocaleDateString('pl-PL')} o ${h}:${m}`;
  //   }
  // }, [medicines]);

  return (
    <>
      <div style={{ position: 'absolute', top: '0', left: '0', bottom: '0', right: '0', backgroundColor: '#ffffffcc', zIndex: '1000', display: 'flex', justifyContent: 'center', alignItems: 'start', paddingTop: '40vh' }} hidden={!showSpinner}  >
        <h3><Spinner animation="border" variant='primary' /> Ładowanie...</h3>
      </div>
      <Container className="my-2">
        <header className='mb-2'>
          <Row>
            <Col className="display-6">
              Webtabsy
              {/* <Button onClick={async () => await updateDoses()}>Fetch</Button> */}
            </Col>
            <Col xs="auto" className="text-end">
              <small>Dzisiaj: <strong>{new Date().toLocaleDateString('pl-PL')}</strong></small><br />
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
                    <Col>
                      {x.medicineName} </Col><Col xs="auto"><small>{x.time}</small>
                      <Button>Weź</Button>
                      <Button>Pomiń</Button>
                    </Col>
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
              <Button type="submit" onClick={handleAddMedicineClick} variant="primary">Dodaj</Button>
            </Form>
          </div>
        </section>
      </Container >
    </>
  );
}

export default App;