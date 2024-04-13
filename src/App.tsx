import React, { useState, useEffect, useCallback, MouseEvent } from 'react';
import './App.css';
import Medicine from './medicine.component';
import IMedicine from './models/IMedicine';
import { addMedicine, fetchMedicines, updateMedicine, deleteMedicine } from './services/medicine.service';
import { findOverdueDoses } from './services/overdueDoses.service';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';
import logo from './assets/logo192.png';
import { countDays } from './actions';
import { TfiCheck, TfiClose } from 'react-icons/tfi';
import OverdueDoseGroup from './models/OverdueDosesGroup';
import Schedule from './schedule.component';
import Tab from 'react-bootstrap/Tab';
import moment from 'moment';
import { Nav } from 'react-bootstrap';
import { BsCardList, BsFillPersonCheckFill, BsFillCalendarWeekFill } from 'react-icons/bs'
import { weekDays } from './text.helpers';

function App() {

  // const [notTakenDoses, setNotTakenDoses] = useState<DoseDetails[]>([])
  const [medicines, setMedicines] = useState<IMedicine[]>([]);
  const [newMedicineName, setNewMedicineName] = useState('');
  const [idOfMedicineDetails, setIdOfMedicineDetails] = useState('');
  const [showSpinner, setShowSpinner] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());
  const [showAll, setShowAll] = useState<boolean>(localStorage.getItem('showAll') === 'true');

  const [addMedicineDialogVisible, setAddMedicinceDialogVisible] = useState(false);
  const [showPermissionAlert, setShowPermissionAlert] = useState(false);

  const [overdueDosesGroups, setOverdueDosesGroups] = useState<OverdueDoseGroup[]>([]);

  const [errorMessage, setErrorMessage] = useState<string>('');

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


  const formatDate = (date: Date) => {
    let d = weekDays[date.getDay()];
    d = `${d}. ${date.getDate()}`;
    if (date.getDate() === (new Date()).getDate()) {
      d = "dziś";
    }
    return d + " o " + (moment(date).format("HH:mm"));
  }


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

      sum += med.doses.filter(d => (d.endDate === null || today <= d.endDate || '') && today >= d.nextDoseDate)
        .reduce((prevValue, dose) => {
          let noOfDays = countDays(today, dose.nextDoseDate);
          for (let i = noOfDays; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const hourAndMinute = dose.time.split(":");
            date.setHours(parseInt(hourAndMinute[0]), parseInt(hourAndMinute[1]), 0, 0);
            if (date > dose.nextDoseDate && date < today) {
              const totalDose = dose.amount ?? 0;
              return prevValue + totalDose;
            }
          }
          return prevValue;
        }, 0);
      med.count -= sum;
      const newDateTaken = today;
      med.doses.forEach(d => d.nextDoseDate = new Date(newDateTaken));

      newm.push(med);
    }

    newm.forEach(x => updateMedicine(x));

    setMedicines([...newm]);
    //    setNotTakenDoses(refreshOverdueDoses(newm));
    refreshOverdueDoses(newm);
    setShowSpinner(false);
  };


  const refreshOverdueDoses = useCallback((meds: IMedicine[]) => {


    // const today = new Date();

    findOverdueDoses().then(groups => {
      setOverdueDosesGroups(groups);
    });

    // const elements = meds.reduce((collection: DoseDetails[], x) => {
    //   let dosesArray: DoseDetails[] = [];

    //   const newDosesArray = x.doses.filter(d => (d.endDate === null || today <= d.endDate) && today >= d.nextDoseDate).flatMap(dose => {
    //     console.log(dose.time);

    //     let noOfDays = countDays(today, dose.nextDoseDate);
    //     if (noOfDays > 100) {
    //       noOfDays = 0;
    //     }

    //     // Create array of numbers in sequence starting from 0
    //     const days = [...Array.from(Array(noOfDays + 1).keys())];

    //     return days.reverse().reduce((foundDoses, dayNo) => {
    //       const date = new Date(today);
    //       date.setDate(date.getDate() - dayNo);

    //       const hourAndMinute = dose.time.split(":");
    //       date.setHours(parseInt(hourAndMinute[0]), parseInt(hourAndMinute[1]), 0, 0);
    //       if ((date > dose.nextDoseDate) && (date < today)) {
    //         foundDoses.push({ ...dose, date });
    //       }
    //       return foundDoses;
    //     }, new Array<IDoseWithDate>());
    //   }).map(dose => { return { doseAmount: dose.amount ?? 0, time: `${formatDate(dose.date)}, ${dose.time}`, dose } });
    //   dosesArray = dosesArray.concat(newDosesArray);
    //   return collection.concat(dosesArray.map(y => { y.medicine = x; return y }));
    // }, []);



    // return elements
    //   .sort((a, b) => { return a.time > b.time ? 1 : -1 });

    // // useCallback
  }, []);

  const handleMedicineClick = (medicineId: string) => {
    if (idOfMedicineDetails === medicineId) {
      setIdOfMedicineDetails('');
    } else {
      setIdOfMedicineDetails(medicineId);
    }
  }

  useEffect(() => {
    findOverdueDoses().then(groups => {
      setOverdueDosesGroups(groups);
    });
    fetchMedicines().then(meds => {
      setMedicines(meds);
      // const notTakenDoses = refreshOverdueDoses(meds)
      // setNotTakenDoses(notTakenDoses);
      // refreshOverdueDoses(meds);
    }).catch((error) => {
      if (error.code === "ERR_NETWORK") {
        setErrorMessage("Bład połączenia!")
      } else {
        setErrorMessage("Wystąpił nieznany błąd");
      }
      console.error(error);
      setTimeout(() => setErrorMessage(''), 3000);
    });

    const timer = setInterval(() => setLastCheckTime(new Date()), 60000);
    return () => {
      clearInterval(timer);
    }

  }, [refreshOverdueDoses, lastCheckTime]);

  // useEffect(() => {
  //   // if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  //   // dev code
  //   // } else {
  //   navigator.serviceWorker.ready.then((registration) => {
  //     registration.getNotifications().then((notifications) => {
  //       notifications.forEach(n => { console.log('closing notification'); n.close(); });
  //       if (overdueDosesGroups.length > 0) {
  //         registration.showNotification(`Weź leki`, {
  //           icon: './logo192maskable.png',
  //           body: overdueDosesGroups.flatMap(x => x.doses).map(x => x.amount + " x " + x.medicineName + " o " + x.time).join('\r'),
  //           // actions: [
  //           //   {
  //           //     action: 'all-taken',
  //           //     title: 'Oznacz jako wzięte'
  //           //   }
  //           // ],
  //           data: overdueDosesGroups
  //         });
  //       }
  //     });
  //   });
  //   // production code
  //   //}
  // }, [overdueDosesGroups]);

  useEffect(() => {
    // const newNotificationBody = overdueDosesGroups.flatMap(x => x.doses).map(x => x.amount + " x " + x.medicineName + " o " + x.time).join('\r\n');

    // navigator.serviceWorker.ready.then((registration) => {
    //   registration.getNotifications().then((notifications) => {
    //     notifications.forEach(n => { console.log('closing notification'); n.close(); });
    //   })
    // })

    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        const notification = new Notification('Weź leki', {
          icon: './logo192maskable.png',
          body: overdueDosesGroups.flatMap(x => x.doses).map(x => x.amount + " x " + x.medicineName + " o " + x.time).join('\r\n'),
          tag: 'take-medicine'
        });

        notification.addEventListener('click', () => {
          window.location.href = '/';
        })
      }
    });
  }, [overdueDosesGroups]);

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
    try {
      await deleteMedicine(medicine);
      const meds = medicines.filter(m => m.id !== medicine.id);
      setMedicines(meds);
      // const m = refreshOverdueDoses(meds);
      // setNotTakenDoses(m);
      refreshOverdueDoses(meds);
    }
    catch (e: any) {
      setErrorMessage("Błąd podczas usuwania leku");
      setTimeout(() => setErrorMessage(''), 3000);
    }
    finally {
      setShowSpinner(false);
    }
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
    // const m = refreshOverdueDoses(meds);
    // setNotTakenDoses(m);
    // setShowSpinner(false);
    refreshOverdueDoses(meds);
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

  const countAmountInCurrentPackage = (medicine: IMedicine | undefined) => {
    if (!medicine) {
      return '';
    }
    const lastPackageSize = medicine.purchases.at(-1)?.numberOfTablets;
    if (lastPackageSize) {
      let value = medicine.count % lastPackageSize
      if (value === 0) {
        if (medicine.count !== 0) {
          value = medicine.count;
        }
        else {
          return '';
        }
      }

      return `(${value})`;
    } else {
      return '';
    }
  }


  return (
    <>
      <div style={{ position: 'absolute', top: '0', left: '0', bottom: '0', right: '0', backgroundColor: '#ffffffcc', zIndex: '1000', display: 'flex', justifyContent: 'center', alignItems: 'start', paddingTop: '40vh' }} hidden={!showSpinner}  >
        <h3><Spinner animation="border" variant='primary' /> Ładowanie...</h3>
      </div>
      <Container className="sticky-top">
        <Row>
          <Col>
            <Alert onClose={() => setShowPermissionAlert(false)} variant='warning' dismissible hidden={!showPermissionAlert}>Brak uprawniń do wyświetlania powiadomień</Alert>
          </Col>
        </Row>
        <Card>
          <Card.Body>
            <Row>
              <Col>
                <strong><img src={logo} alt='webtabsy logo' style={{ height: '16px' }} className='me-3' />WEBTABSY</strong>
                {/* <Button onClick={async () => test()}>Test</Button> */}
              </Col>
              <Col xs="auto" className="text-end">
                <small className='text-secondary'>{lastCheckTime.toLocaleString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</small>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
      <Container className="position-relative pt-3">
        <div>{medicines.length > 0 || (<span>Wczytywanie danych...</span>)}</div>
        <Tab.Container
          defaultActiveKey="missingDoses"
        >
          <Row hidden={medicines.length === 0} style={{ paddingBottom: "60px" }}>
            <Col>
              <Tab.Content>
                <Tab.Pane eventKey="missingDoses" className='justify-content-center'>
                  <Row hidden={medicines.length === 0 || overdueDosesGroups.length !== 0} className="mt-5 text-center ">
                    <Col>
                      <h4>Gratulacje!</h4>
                      <h6>Wszystkie leki zostały wzięte</h6>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      {overdueDosesGroups.map(group =>
                        <div key={'overdue-group-' + group.date}>
                          <Row>
                            <Col xs="auto" className="d-flex align-items-center">
                              <strong className='text-secondary'><small>{formatDate(group.date)}</small></strong>
                            </Col>
                          </Row>
                          <Row>
                            <Col>
                              {group.doses.map(dose =>
                                <Card key={'overdue-dose-' + dose.id} className="my-2">
                                  <Card.Body>
                                    <Row className='d-flex align-items-center'>
                                      <Col xs='auto'>
                                        <Button variant='outline-secondary'
                                          size='sm'
                                          onClick={async () => {
                                            const meds = [...medicines];
                                            const medicine = meds.find(m => m.name === dose.medicineName);
                                            if (medicine) {
                                              const d2 = medicines.find(m => m.name === dose.medicineName)?.doses?.find(d => d.id === dose.id);
                                              if (d2 && d2.amount) {
                                                let newDate = d2.nextDoseDate;
                                                const timeParts = d2.time.split(':');
                                                newDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
                                                // TODO:
                                                // nie zawsze dodanie 1 do aktualnie ustawionej daty jest ok
                                                // tylko nie pamiętam dlaczego :/
                                                newDate.setDate(newDate.getDate() + (dose.numberOfDays ?? 1));
                                                d2.nextDoseDate = newDate;
                                                updateMedicine(medicine);
                                                //refreshOverdueDoses(meds);
                                                setMedicines(meds);
                                                const indexOfDose = group.doses.indexOf(dose);
                                                group.doses.splice(indexOfDose, 1);
                                                if (group.doses.length === 0) {
                                                  const indexOfGroup = overdueDosesGroups.indexOf(group);
                                                  overdueDosesGroups.splice(indexOfGroup, 1);
                                                }
                                              }
                                            }
                                          }}>
                                          <TfiClose /> <span className="d-none d-md-inline">Pomiń</span>
                                        </Button>
                                      </Col>
                                      <Col>
                                        <strong>{dose.amount}{' x '}{dose.medicineName} </strong>
                                        <small>
                                          <Badge bg="secondary" pill>
                                            {medicines.find(m => m.name === dose.medicineName)?.count}{' '}{countAmountInCurrentPackage(medicines.find(m => m.name === dose.medicineName))}
                                          </Badge>
                                        </small>
                                      </Col>
                                      <Col xs='auto'>
                                        <Button
                                          size='sm'
                                          disabled={medicines.find(m => m.name === dose.medicineName)?.count === 0 || dose.disabled}
                                          onClick={async () => {
                                            dose.disabled = true;
                                            const meds = [...medicines];
                                            const medicine = meds.find(m => m.name === dose.medicineName);
                                            if (medicine && medicine.count > 0) {
                                              const d2 = medicines.find(m => m.name === dose.medicineName)?.doses?.find(d => d.id === dose.id);
                                              if (d2 && d2.amount) {
                                                let newDate = d2.nextDoseDate;
                                                const timeParts = d2.time.split(':');
                                                newDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
                                                newDate.setDate(newDate.getDate() + (dose.numberOfDays ?? 1));
                                                d2.nextDoseDate = newDate;
                                                medicine.count -= d2.amount;
                                                updateMedicine(medicine);
                                                setMedicines(meds);
                                                // refreshOverdueDoses(meds);
                                                const indexOfDose = group.doses.indexOf(dose);
                                                group.doses.splice(indexOfDose, 1);
                                                if (group.doses.length === 0) {
                                                  const indexOfGroup = overdueDosesGroups.indexOf(group);
                                                  overdueDosesGroups.splice(indexOfGroup, 1);
                                                }
                                              }
                                            }
                                          }}>
                                          <TfiCheck /> <span className="d-none d-md-inline">Potwierdź</span>
                                        </Button>
                                      </Col>
                                    </Row>
                                  </Card.Body>
                                </Card>
                              )}
                            </Col>
                          </Row>
                        </div>
                      )}
                    </Col>
                  </Row>
                  <Row hidden={overdueDosesGroups.length === 0}>
                    <Col></Col>
                    <Col xs="auto" className="mt-2">
                      <Button onClick={async () => await handleTakeMedicines()} variant='link' disabled><TfiCheck /> Potwierdź wszystkie</Button>
                    </Col>
                  </Row>
                </Tab.Pane>
                <Tab.Pane eventKey="medicines">
                  <Row>
                    <Col>
                      {/* <strong>Lista leków</strong> */}
                      <Button variant='link' onClick={() => setAddMedicinceDialogVisible(true)} style={{ padding: '0px', border: '0px' }} className='mr-2'>Dodaj lek</Button>
                    </Col>
                    <Col xs="auto">
                      <Form.Switch
                        checked={!showAll}
                        label='Filtrowanie'
                        onChange={(e: { target: { checked: any; }; }) => { setShowAll(!e.target.checked); localStorage.setItem('showAll', (!e.target.checked).toString()); setIdOfMedicineDetails(''); }}
                      />
                    </Col>
                  </Row>
                  <dialog open={addMedicineDialogVisible}>
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
                  <Row>
                    <Col>{medicines
                      .sort((a, b) => (a.name > b.name ? 1 : -1))
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
                </Tab.Pane>
                <Tab.Pane eventKey="schedule">
                  <Schedule medicines={medicines} />
                </Tab.Pane>
              </Tab.Content>
            </Col>
          </Row>
          <Container className="fixed-bottom">
            <Card>
              <Card.Body className="p-2">
                <Nav variant="pills" className="nav-justified">
                  <Nav.Item>
                    <Nav.Link eventKey="missingDoses"><BsFillPersonCheckFill /> <span className="d-none d-md-inline">Status</span></Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="medicines"><BsCardList /> <span className="d-none d-md-inline">Lista leków</span></Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="schedule"><BsFillCalendarWeekFill /> <span className="d-none d-md-inline">Grafik</span></Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Body>
            </Card>
          </Container>
        </Tab.Container>
        {/* <Row hidden={medicines.length === 0}>
          <Col md='4'>
            <section className='my-3'>
              <Row>
                <Col>
                  <strong>Pominięte leki</strong>
                  <Card hidden={medicines.length === 0 || overdueDosesGroups.length !== 0} className='my-2'>
                    <Card.Body className="text-center">
                      <h4>Gratulacje!</h4>
                      <h6>Wszystkie leki zostały wzięte</h6>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <Row>
                <Col>
                  {overdueDosesGroups.map(group => <div>
                    <small>{formatDate(group.date)}</small>
                    <Card className='my-2' key={'overdue-group-' + group.date}>
                      <Card.Body>
                        {group.doses.map(dose => <div key={'overdue-dose-' + dose.id}>
                          <Row>
                            <Col xs='auto'>
                              <Button variant='link text-danger'
                                size='sm'
                                // disabled={x.medicine?.count === 0 || notTakenDoses.some(y => y.medicine?.id === x.medicine?.id && y.dose.date < x.dose.date)}
                                onClick={async () => {
                                  const meds = [...medicines];
                                  const medicine = meds.find(m => m.name === dose.medicineName);
                                  if (medicine) {
                                    const d2 = medicines.find(m => m.name === dose.medicineName)?.doses?.find(d => d.time === dose.time);
                                    if (d2 && d2.amount) {
                                      let newDate = d2.nextDoseDate;
                                      const timeParts = d2.time.split(':');
                                      newDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
                                      // TODO:
                                      // nie zawsze dodanie 1 do aktualnie ustawionej daty jest ok
                                      // tylko nie pamiętam dlaczego :/
                                      newDate.setDate(newDate.getDate() + 1);
                                      d2.nextDoseDate = newDate;
                                      await updateMedicine(medicine);
                                      setMedicines(meds);
                                      refreshOverdueDoses(meds);
                                    }
                                  }
                                }}>
                                <TfiClose />
                              </Button>
                            </Col>
                            <Col>
                              {dose.amount}{' x '}{dose.medicineName} <small>({medicines.find(m => m.name === dose.medicineName)?.count} tab.)</small>
                            </Col>
                            <Col xs='auto'>
                              <Button variant='link'
                                size='sm'
                                // disabled={x.medicine?.count === 0 || notTakenDoses.some(y => y.medicine?.id === x.medicine?.id && y.dose.date < x.dose.date)}
                                disabled={medicines.find(m => m.name === dose.medicineName)?.count === 0}
                                onClick={async () => {
                                  const meds = [...medicines];
                                  const medicine = meds.find(m => m.name === dose.medicineName);
                                  if (medicine && medicine.count > 0) {
                                    const d2 = medicines.find(m => m.name === dose.medicineName)?.doses?.find(d => d.time === dose.time);
                                    if (d2 && d2.amount) {
                                      let newDate = d2.nextDoseDate;
                                      const timeParts = d2.time.split(':');
                                      newDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
                                      newDate.setDate(newDate.getDate() + 1);
                                      d2.nextDoseDate = newDate;
                                      medicine.count -= d2.amount;
                                      await updateMedicine(medicine);
                                      setMedicines(meds);
                                      refreshOverdueDoses(meds);
                                    }
                                  }
                                }}>
                                <TfiCheck />
                              </Button>
                            </Col>
                          </Row>
                        </div>)}
                      </Card.Body>
                    </Card>
                  </div>
                  )}
                </Col>
              </Row>
              <Row hidden={overdueDosesGroups.length === 0}>
                <Col></Col>
                <Col xs="auto" className="mt-2">
                  <Button onClick={async () => await handleTakeMedicines()} variant='link' disabled><TfiCheck /> Potwierdź wszystkie</Button>
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
                </Col>
              </Row>
              <Row>
                <Col>{medicines
                  .sort((a, b) => (a.name > b.name ? 1 : -1))
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
                <Col>
                  <dialog open={addMedicineDialogVisible} style={{ zIndex: '1000', position: 'absolute', margin: 'auto', bottom: '0' }}>
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
                <Col className='text-end pr-2'>
                  <Button variant='link' onClick={() => setAddMedicinceDialogVisible(true)} style={{ padding: '0px', border: '0px' }} className='mr-2'>Dodaj lek</Button>
                </Col>
              </Row>
            </section>
          </Col>
          <Col md='3'>
            <section className='my-3'>
              <Schedule medicines={medicines} />
            </section>
          </Col> 
        </Row>*/}
      </Container >

      <Alert variant='danger' className='position-fixed ms-auto me-auto start-0 end-0 top-0' hidden={errorMessage?.length === 0}>
        {errorMessage}
      </Alert>
    </>
  );
}

export default App;
