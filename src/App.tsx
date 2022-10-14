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
import Alert from 'react-bootstrap/Alert';
import { HandThumbsUpFill, HandThumbsDownFill } from 'react-bootstrap-icons';
import logo from './assets/logo192.png';
import _ from 'lodash';
import { DoseDetails, IDoseWithDate } from './types';
import { countDays } from './actions';

function App() {

  const [notTakenDoses, setNotTakenDoses] = useState<DoseDetails[]>([])
  const [medicines, setMedicines] = useState<IMedicine[]>([]);
  const [newMedicineName, setNewMedicineName] = useState('');
  const [idOfMedicineDetails, setIdOfMedicineDetails] = useState('');
  const [showSpinner, setShowSpinner] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());
  const [showAll, setShowAll] = useState<boolean>(localStorage.getItem('showAll') === 'true');

  const [addMedicineDialogVisible, setAddMedicinceDialogVisible] = useState(false);
  const [showPermissionAlert, setShowPermissionAlert] = useState(false);

  // if (Notification.permission !== 'granted') {
  //   Notification.requestPermission()
  //     .then(
  //       (value) => {
  //         if (value === 'granted') {
  //           setShowPermissionAlert(false);
  //         } else {
  //           setShowPermissionAlert(true);
  //         }
  //       }
  //     ).catch(x => alert(x));
  // }

  const handleNewMedicineNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewMedicineName(event.target.value);
  }


  const handleTakeMedicines = async () => {
    setShowSpinner(true);
    const today = new Date();
    const meds: IMedicine[] = [...medicines];
    const newm: IMedicine[] = [];
    for (let medIndex = 0; medIndex < meds.length; medIndex++) {
      const med = meds[medIndex];
      let sum = 0;
      if (med.count === 0) {
        newm.push(med);
        continue;
      }

      sum += med.doses.filter(d => (d.endDate === null || today <= new Date(d.endDate?.toString() || '')) && today >= new Date(d.takingDate.toString()))
        .reduce((prevValue, dose) => {
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
      med.count -= sum;
      const newDateTaken = today;
      med.doses.forEach(d => d.takingDate = new Date(newDateTaken));

      newm.push(med);
    }

    newm.forEach(x => updateMedicine(x));

    setMedicines([...newm]);
    setNotTakenDoses(refreshNotTakenDoses(newm));
    // setLastCheckTime(new Date());
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

    const today = new Date();

    const elements = meds.reduce((collection: DoseDetails[], x) => {
      let dosesArray: DoseDetails[] = [];

      const newDosesArray = x.doses.filter(d => (d.endDate === null || today <= new Date(d.endDate?.toString() || '')) && today >= new Date(d.takingDate.toString())).flatMap(dose => {

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
      }).map(dose => { return { doseAmount: dose.amount ?? 0, time: `${formatDate(dose.date)}, ${dose.time}`, dose } });
      dosesArray = dosesArray.concat(newDosesArray);
      return collection.concat(dosesArray.map(y => { y.medicine = x; return y }));
    }, []);


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
    fetchMedicines().then(meds => {
      setMedicines(meds);
      const notTakenDoses = refreshNotTakenDoses(meds)
      setNotTakenDoses(notTakenDoses);

      if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
        // dev code
      } else {
        // navigator.serviceWorker.ready.then((registration) => {
        //   registration.getNotifications().then((notifications) => {
        //     // notifications.forEach(n => { console.log('closing notification'); n.close(); });
        //     if (notTakenDoses.length > 0) {
        //       registration.showNotification(`Weź ${notTakenDoses.length} ${getCorrectFormOfWordMedicine(notTakenDoses.length)} `, {
        //         icon: './logo192maskable.png',
        //         body: notTakenDoses
        //           .map(ntd => ntd.time)
        //           .filter((value, index, self) => self.indexOf(value) === index)
        //           .reduce((prev, curr) => prev.concat(curr + ';\r\n'), ''),
        //         actions: [
        //           {
        //             action: 'all-taken',
        //             title: 'Oznacz jako wzięte'
        //           }
        //         ],
        //         data: notTakenDoses
        //       });
        //     }
        //   });
        // });
        // production code
      }
    }).catch((error) => {
      // if (error.code === "ERR_NETWORK") {
      alert("Bład połączenia! " + error)
      // }
    });

    const timer = setInterval(() => setLastCheckTime(new Date()), 5 * 60000);
    return () => {
      clearInterval(timer);
    }

  }, [refreshNotTakenDoses, lastCheckTime]);

  const handleAddMedicineClick = async (e: MouseEvent) => {
    e.preventDefault();
    if (!newMedicineName.trim()) {
      alert('Nie można dodać leku bez nazwy');
      return;
    }
    setShowSpinner(true);
    const newMedicine: IMedicine = {
      id: '',
      name: newMedicineName,
      description: '',
      count: 0,
      isVisible: true,
      doses: [],
      purchases: []
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


  // const test = async () => {
  //   navigator.serviceWorker.ready.then((r) => r.showNotification('teest'));
  // }

  return (
    <>
      <div style={{ position: 'absolute', top: '0', left: '0', bottom: '0', right: '0', backgroundColor: '#ffffffcc', zIndex: '1000', display: 'flex', justifyContent: 'center', alignItems: 'start', paddingTop: '40vh' }} hidden={!showSpinner}  >
        <h3><Spinner animation="border" variant='primary' /> Ładowanie...</h3>
      </div>
      <Container className="mt-2 mb-3">
        <header className='mb-4'>
          <Row>
            <Col>
              <Alert onClose={() => setShowPermissionAlert(false)} variant='warning' dismissible hidden={!showPermissionAlert}>Brak uprawniń do wyświetlania powiadomień</Alert>
            </Col>
          </Row>
          <Row>
            <Col>
              <strong><img src={logo} alt='webtabsy logo' style={{ height: '16px' }} className='me-3' />WEBTABSY</strong>
              {/* <Button onClick={async () => test()}>Test</Button> */}
            </Col>
            <Col xs="auto" className="text-end">
              <small className='text-secondary'>{lastCheckTime.toLocaleString('pl-PL')}</small>
            </Col>
          </Row>
        </header>
        <div>{medicines.length > 0 || (<span>Loading...</span>)}</div>
        <Row hidden={medicines.length === 0}>
          <Col md='4'>
            <section className='my-3'>
              <Row>
                <Col>
                  <strong>Pominięte leki</strong>
                  <Card hidden={medicines.length === 0 || notTakenDoses.length !== 0} className='my-2'>
                    <Card.Body className="text-center">
                      <h4>Gratulacje!</h4>
                      <h6>Wszystkie leki zostały wzięte</h6>
                    </Card.Body>
                  </Card>
                  {medicines.length > 0 && notTakenDoses.map(x =>
                    <Card className='my-2' key={'not-taken-dose-' + x.dose.id + '-time-' + x.time}>
                      <Card.Body>
                        <Row>
                          <Col className="fs-6">
                            <Row>
                              <Col>
                                <span style={{ display: 'inline-block', width: '30px', textAlign: 'right' }}>{x.doseAmount === 0.5 ? String.fromCharCode(189) : x.doseAmount}&nbsp;x&nbsp;</span>
                                <span>{x.medicine?.name}</span>
                              </Col>
                            </Row>
                            <Row>
                              <Col style={{ marginLeft: '30px' }} className="text-secondary">
                                <small>
                                  {x.time}
                                  <span hidden={(x.medicine?.count ?? 0) > 0} className='ms-2 text-danger'><strong>(brak leku)</strong></span>
                                </small>
                              </Col>
                            </Row>
                            <Row>
                              <Col style={{ marginLeft: '30px' }} >
                                <small><i>{x.medicine?.description}</i></small>
                              </Col>
                            </Row>
                          </Col>
                          <Col xs="auto" className="d-flex align-items-center fs-6">
                            <Button variant='primary' disabled={x.medicine?.count === 0 || notTakenDoses.some(y => y.medicine?.id === x.medicine?.id && y.dose.date < x.dose.date)} onClick={async () => {
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
                            <Button className='ms-1' variant='warning' disabled={notTakenDoses.some(y => y.medicine?.id === x.medicine?.id && y.dose.date < x.dose.date) && (x.medicine?.count ?? 0) > 0} onClick={async () => {
                              const meds = [...medicines];
                              const medicine = meds.find(m => m === x.medicine);
                              if (medicine) {
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
                        </Row>
                      </Card.Body>
                    </Card>
                  )}
                  <Row hidden={notTakenDoses.length === 0}>
                    <Col></Col>
                    <Col xs="auto">
                      <Button onClick={async () => await handleTakeMedicines()} variant='primary'><HandThumbsUpFill /> Wszystkie</Button>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </section>
          </Col>
          <Col md='3'>
            <section className='my-3'>
              <Row>
                <Col>
                  <strong>Grafik</strong>
                </Col>
              </Row>
              <Row>
                <Col>
                  {
                    Object.entries(_.groupBy(
                      medicines
                        .filter(m => m.doses.length > 0)
                        .map(m => {
                          return m.doses
                            .filter(d => (() => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const endOfToday = today;
                              endOfToday.setHours(23, 59, 59, 100);
                              console.log(m.name, d.time, today, endOfToday);
                              return (d.endDate === null || today <= new Date(d.endDate.toString())) && endOfToday >= new Date(d.takingDate.toString());
                            })())
                            .map(d => { return { dose: d, name: m.name } })
                        })
                        .flatMap(x => x),
                      x => x.dose.time
                    )).sort((x, y) => x > y ? 1 : -1).map(x =>
                      <Card className='my-2' key={'schedule-' + x[1][0].dose.id}><Card.Header>Godz. {x[0]}</Card.Header><Card.Body>{x[1].sort((y, z) => y.name > z.name ? 1 : -1).map(y => <div key={'schedule-dose-' + y.dose.id}>{y.dose.amount}{' x '}{y.name}</div>)}</Card.Body></Card>
                    )
                  }
                </Col>
              </Row>
            </section>
          </Col>
          <Col md='5'>
            <section className='my-3'>
              <Row>
                <Col>
                  <strong>Lista leków</strong>
                </Col>
                <Col xs="auto">
                  <Form.Switch
                    checked={!showAll}
                    label='Filtrowanie'
                    onChange={(e) => { setShowAll(!e.target.checked); localStorage.setItem('showAll', (!e.target.checked).toString()); setIdOfMedicineDetails(''); }}
                  />
                  <dialog open={addMedicineDialogVisible} style={{ zIndex: '1000' }}>
                    <strong>Nowy lek</strong>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>Nazwa leku</Form.Label>
                        <Form.Control type="text"
                          value={newMedicineName}
                          onChange={handleNewMedicineNameChange}>
                        </Form.Control>
                      </Form.Group>
                      <Row className='text-end'>
                        <Col>
                          <Button type="submit" onClick={(e) => { handleAddMedicineClick(e); setAddMedicinceDialogVisible(false); }} variant="primary">Dodaj</Button>
                          <Button className='ms-2' variant='secondary' onClick={() => setAddMedicinceDialogVisible(false)}>Anuluj</Button>
                        </Col>
                      </Row>
                    </Form>
                  </dialog>
                </Col>
              </Row>
              <Row>
                <Col>{medicines
                  .sort((a, b) => (a.name > b.name ? 1 : -1))
                  .sort((a, b) => a.doses.length > 0 && b.doses.length === 0 ? -1 : 0)
                  .filter(m => showAll || m.isVisible)
                  .map((x: IMedicine) =>
                    <Medicine
                      key={'medicine-' + x.id}
                      {...x}
                      idOfMedicineDetails={idOfMedicineDetails}
                      medicineClick={handleMedicineClick}
                      updateMedicine={handleUpdateMedicine}
                      deleteMedicine={handleDeleteMedicine}
                    />
                  )}
                </Col>
              </Row>
              <Row>
                <Col className='text-end pr-2'>
                  <Button variant='link' onClick={() => setAddMedicinceDialogVisible(true)} style={{ padding: '0px', border: '0px' }} className='mr-2'>Dodaj lek</Button>
                </Col>
              </Row>
            </section>
          </Col>
        </Row>
      </Container >
    </>
  );
}

export default App;

// function getCorrectFormOfWordMedicine(length: number) {
//   switch (length) {
//     case 1:
//       return 'lek';
//     case 2:
//     case 3:
//     case 4:
//       return 'leki';
//     default:
//       return 'leków';
//   }
// }
