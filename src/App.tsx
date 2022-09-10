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
import IDose from './models/IDose';
import { HandThumbsUpFill, HandThumbsDownFill } from 'react-bootstrap-icons';


interface IDoseWithDate extends IDose {
  date: Date,
  // canEdit: boolean
}

type DoseDetails = {
  medicine?: IMedicine,
  doseAmount: string,
  time: string,
  dose: IDoseWithDate
}

function App() {

  const [notTakenDoses, setNotTakenDoses] = useState<DoseDetails[]>([])
  const [medicines, setMedicines] = useState<IMedicine[]>([]);
  const [newMedicineName, setNewMedicineName] = useState('');
  const [idOfMedicineDetails, setIdOfMedicineDetails] = useState('');
  const [showSpinner, setShowSpinner] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());

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
      let dosesArray: DoseDetails[] = [];

      const newDosesArray = x.doses.flatMap(dose => {

        let noOfDays = countDays(today, new Date(dose.takingDate));
        if (noOfDays > 100) {
          noOfDays = 0;
        }

        // Create array of numbers in sequence starting from 0
        const days = [...Array.from(Array(noOfDays + 1).keys())];

        return days.reverse().reduce((foundDoses, dayNo) => {
          const date = new Date(today);
          date.setDate(date.getDate() - dayNo);

          const hourAndMinute = dose.time.split(":");
          date.setHours(parseInt(hourAndMinute[0]), parseInt(hourAndMinute[1]), 0, 0);
          if ((date > new Date(dose.takingDate.toString())) && (date < today)) {

            //            const canEdit = !foundDoses.some(y => y.amount === dose.amount && y.time === dose.time);
            foundDoses.push({ ...dose, date });
          }
          return foundDoses;
        }, new Array<IDoseWithDate>());
      }).map(dose => { return { doseAmount: `${dose.amount} x `, time: `${formatDate(dose.date)}, ${dose.time}`, dose } });
      dosesArray = dosesArray.concat(newDosesArray);
      return collection.concat(dosesArray.map(y => { y.medicine = x; return y }));
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
    // setShowSpinner(true);
    let not: Notification;
    fetchMedicines().then(meds => {
      setMedicines(meds);
      const notTakenDoses = refreshNotTakenDoses(meds)
      setNotTakenDoses(notTakenDoses);
      // setShowSpinner(false);
      console.log('display notification');
      if (notTakenDoses.length > 0) {
        not = new Notification("Weź leki");
      }
    });

    const timer = setInterval(() => setLastCheckTime(new Date()), 2 * 60 * 1000);
    // Notification.requestPermission().then((result) => console.log(result));
    return () => {
      clearInterval(timer);
      if (not) {
        not.close();
      }
    }

  }, [refreshNotTakenDoses, lastCheckTime]);

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
              <small><strong>{lastCheckTime.toLocaleString('pl-PL')}</strong></small>
            </Col>
          </Row>
          <hr />
        </header>
        <section className='mb-2' hidden={notTakenDoses.length === 0}>
          <Row>
            <Col>
              <Card>
                <Card.Header>Pominięte leki</Card.Header>
                <Card.Body>
                  {notTakenDoses.map(x =>
                    <Row key={x.medicine?.name + x.time}>
                      <Col className="d-flex align-items-center"><div>{x.doseAmount} {x.medicine?.name}</div></Col>
                      <Col xs="auto" className="d-flex align-items-center">
                        <div><small>{x.time}</small></div>
                      </Col>
                      <Col xs="auto" className="d-flex align-items-center">
                        <Button variant='success' disabled={notTakenDoses.some(y => y.medicine?.id === x.medicine?.id && y.dose.date < x.dose.date)} onClick={async () => {
                          const meds = [...medicines];
                          const medicine = meds.find(m => m === x.medicine);
                          if (medicine && medicine.count > 0) {
                            const dose = medicines.find(m => m === x.medicine)?.doses?.find(d => d.time === x.dose.time);
                            if (dose && dose.amount) {
                              let newDate = new Date(x.dose.date);
                              newDate.setTime(newDate.getTime() + 1000);
                              dose.takingDate = newDate;
                              medicine.count -= dose.amount;
                              await updateMedicine(medicine);
                              setMedicines(meds);
                              setNotTakenDoses(refreshNotTakenDoses(meds));
                            }
                          }
                        }}><HandThumbsUpFill /></Button>
                        <Button className='mx-1' variant='warning' disabled={notTakenDoses.some(y => y.medicine?.id === x.medicine?.id && y.dose.date < x.dose.date)} onClick={async () => {
                          const meds = [...medicines];
                          const medicine = meds.find(m => m === x.medicine);
                          if (medicine && medicine.count > 0) {
                            const dose = medicines.find(m => m === x.medicine)?.doses?.find(d => d.time === x.dose.time);
                            if (dose && dose.amount) {
                              let newDate = new Date(x.dose.date);
                              newDate.setTime(newDate.getTime() + 1000);
                              dose.takingDate = newDate;
                              await updateMedicine(medicine);
                              setMedicines(meds);
                              setNotTakenDoses(refreshNotTakenDoses(meds));
                            }
                          }
                        }}><HandThumbsDownFill /></Button>
                      </Col>
                      <hr />
                    </Row>
                  )}
                  <Row>
                    <Col></Col>
                    <Col xs="auto" className="mt-2"><Button onClick={handleTakeMedicines} variant='success'><HandThumbsUpFill /> Wszystkie leki są wzięte</Button></Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <hr />
        </section>
        <section>
          <h4>Lista leków</h4>
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
            <h4>Nowy lek</h4>
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