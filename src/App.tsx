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
import { InputGroup, Nav } from 'react-bootstrap';
import { BsCardList, BsFillPersonCheckFill, BsFillCalendarWeekFill } from 'react-icons/bs'
import { weekDays } from './text.helpers';

function App() {

  const version = 1.9;
  const SYNC_INTERVAL_IN_SECONDS = 60;

  const [medicines, setMedicines] = useState<IMedicine[]>([]);
  const [newMedicineName, setNewMedicineName] = useState('');
  const [idOfMedicineDetails, setIdOfMedicineDetails] = useState('');
  const [showSpinner, setShowSpinner] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());
  const [showAll, setShowAll] = useState<boolean>(localStorage.getItem('showAll') === 'true');

  const [syncTimestamp, setSyncTimestamp] = useState(SYNC_INTERVAL_IN_SECONDS);

  const [addMedicineDialogVisible, setAddMedicinceDialogVisible] = useState(false);
  const [showPermissionAlert, setShowPermissionAlert] = useState(false);

  const [overdueDosesGroups, setOverdueDosesGroups] = useState<OverdueDoseGroup[]>([]);

  const [errorMessage, setErrorMessage] = useState<string>('');

  const [medicineNameFilter, setMedicineNameFilter] = useState<string>('');

  document.addEventListener('scroll', (event) => {
    console.log(window.scrollY);
  });

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
    refreshOverdueDoses(newm);
    setShowSpinner(false);
  };


  const refreshOverdueDoses = useCallback((meds: IMedicine[]) => {
    findOverdueDoses().then(groups => {
      setOverdueDosesGroups(groups);
    });
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
    }).catch((error) => {
      if (error.code === "ERR_NETWORK") {
        setErrorMessage("Bład połączenia!")
      } else {
        setErrorMessage("Wystąpił nieznany błąd");
      }
      console.error(error);
      setTimeout(() => setErrorMessage(''), 3000);
    });

  }, [refreshOverdueDoses, lastCheckTime]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSyncTimestamp(prev => prev - 1)
      if (syncTimestamp <= 1) {
        setSyncTimestamp(SYNC_INTERVAL_IN_SECONDS);
        setLastCheckTime(new Date());
      }
    }, 1000);
    return () => {
      clearInterval(timer);
    }
  }, [syncTimestamp]);

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
      purchases: [],
      hideWhenEmpty: false
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
    refreshOverdueDoses(meds);
  }

  const countAmountInCurrentPackage = (medicine: IMedicine | undefined) => {
    if (!medicine) {
      return '';
    }
    const lastPackageSize = medicine.purchases.at(-1)?.numberOfTablets;
    if (lastPackageSize) {
      let value = medicine.count % lastPackageSize
      if (value === 0) {
        if (medicine.count !== 0) {
          value = lastPackageSize;
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
      <div style={{ position: 'absolute', top: '0', left: '0', bottom: '0', right: '0', backgroundColor: '#fafafc', zIndex: '1000', display: 'flex', justifyContent: 'center', alignItems: 'start', paddingTop: '40vh' }} hidden={!showSpinner}  >
        <h3><Spinner animation="border" variant='primary' /> Ładowanie...</h3>
      </div>
      <Container className="sticky-top p-3" style={{ backgroundColor: '#fafafc' }}>
        <Row >
          <Col>
            <Alert onClose={() => setShowPermissionAlert(false)} variant='warning' dismissible hidden={!showPermissionAlert}>Brak uprawnień do wyświetlania powiadomień</Alert>
          </Col>
        </Row>
        <Row>
          <Col>
            <strong><img src={logo} alt='webtabsy logo' style={{ height: '16px' }} className='me-3' />WEBTABSY</strong>
            {/* <Button onClick={async () => test()}>Test</Button> */}
          </Col>
          <Col xs="auto" className="text-end text-secondary" style={{ fontSize: '0.6rem' }}>
            {syncTimestamp < 1000 ? "Synch. za : " + syncTimestamp/*.toLocaleString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })*/ + " sek., " : ""}
            {"v. " + version}
          </Col>
        </Row>
      </Container>
      <Container className="position-relative pt-3">
        <div>{medicines.length > 0 || (<span>Synchronizacja danych...</span>)}</div>
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
                                <Card key={'overdue-dose-' + dose.id} className="my-2" style={{ backgroundColor: dose.todaysDate > new Date() ? '#eceff1' : 'white' }}>
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
                                                newDate.setDate(newDate.getDate() + (dose.numberOfDays ?? 1));
                                                d2.nextDoseDate = newDate;
                                                updateMedicine(medicine);
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
                                        <small style={{ verticalAlign: 'top', marginLeft: '5px' }}>
                                          <Badge bg={(medicines?.find(m => m.name === dose.medicineName)?.count || 0) < dose.amount ? "danger" : "secondary"} pill>
                                            {medicines.find(m => m.name === dose.medicineName)?.count}{' '}{countAmountInCurrentPackage(medicines.find(m => m.name === dose.medicineName))}
                                          </Badge>
                                        </small>
                                      </Col>
                                      <Col xs='auto'>
                                        <Button
                                          size='sm'
                                          disabled={(medicines?.find(m => m.name === dose.medicineName)?.count || 0) < dose.amount || dose.disabled}
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
                  <Row className="sticky-top bg-light pt-3 pb-4" style={{top: '45px'}}>
                    <Col xs="auto">
                      {/* <strong>Lista leków</strong> */}
                      <Button variant='primary' onClick={() => setAddMedicinceDialogVisible(true)} className='mr-2'>Dodaj lek</Button>
                    </Col>
                    <Col>
                      <InputGroup>
                        <InputGroup.Text className="d-none d-md-block">Szukaj:</InputGroup.Text>
                        <Form.Control size="sm" type="text" placeholder='Nazwa leku' onChange={(e) => setMedicineNameFilter(e.target.value)} value={medicineNameFilter} />
                        <Button variant="outline-secondary" onClick={() => setMedicineNameFilter('')}>X</Button>
                      </InputGroup>
                    </Col>
                    <Col xs="auto" className="pt-2">
                      <Form.Switch
                        checked={!showAll}
                        label={showAll ? 'wszystkie' : 'aktywne'}
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
                      .filter(m => (showAll || m.isVisible || m.id === idOfMedicineDetails || medicineNameFilter) && m.name.toLowerCase().includes(medicineNameFilter.toLowerCase()))
                      .sort((a, b) => (a.name > b.name ? 1 : -1))
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
          <Container className="fixed-bottom p-3" style={{ backgroundColor: '#fafafc' }}>
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
          </Container>
        </Tab.Container>
      </Container >

      <Alert variant='danger' className='position-fixed ms-auto me-auto start-0 end-0 top-0' hidden={errorMessage?.length === 0}>
        {errorMessage}
      </Alert>
    </>
  );
}

export default App;
