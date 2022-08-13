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
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';


function App() {

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
    //console.log(date1.toISOString(), date2, date11, date22, noOfDays);
    return noOfDays;
  }

  const handleTakeMedicines = async () => {
    setShowSpinner(true);
    setMedicines([]);
    const today = new Date();
    const m: IMedicine[] = [...medicines];
    const newm: IMedicine[] = [] ;
 //   m.forEach(async x => {
    for (let j = 0; j < m.length; j++) {
      const x = m[j];
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
      newm.push(x);
      // await updateMedicine(x);
 //   });
    } 
    setMedicines(newm);
    newm.forEach(x => await updateMedicine(x)) ;
    setShowSpinner(false);
/*
    fetchMedicines().then((newMeds) => {
      //alert(newMeds.length);
      alert(newMeds[0].count);
      setMedicines([...newMeds]);
      //alert(medicines[0].count);
      setShowSpinner(false);
    });
*/
  };

  type DoseDetails = { medicineName: string, dose: string, time: string }

  const getNotTakenDoses = useCallback(() => {

    const weekDays = [
      'Pn',
      'Wt',
      'Śr',
      'Czw',
      'Pt',
      'Sb',
      'Nd'
    ]

    const formatDate = (date: Date) => {
      let d = weekDays[date.getDay() - 1];
      d = `${d}. ${date.getDate()}`;
      if (date.getDate() === (new Date()).getDate()) {
        d = "dziś";
      }
      return d;
    }

    console.log('getNotTakenDoses');
    const today = new Date();
    console.log("medicines: " + medicines.length)
    const elements = medicines.reduce((collection: DoseDetails[], x) => {
      let noOfDays = countDays(today, new Date(x.lastDateTaken));
      console.log(`noOfDays = ${noOfDays}`)
      let items: DoseDetails[] = [];
      for (let i = noOfDays; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const newArray = x.doses.filter(dose => {
          const hourAndMinute = dose.time.split(":");
          date.setHours(parseInt(hourAndMinute[0]), parseInt(hourAndMinute[1]), 0, 0);
          const result = ((date > new Date(x.lastDateTaken.toString())) && (date < today))
          return result;
          // }).map(dose => `${dose.amount} tab. [${formatDate(date)}, godz ${dose.time}]`);
        }).map(dose => { return { medicineName: '', dose: `${dose.amount} tab. `, time: `${formatDate(date)}, godz ${dose.time}` } });
        items = items.concat(newArray);
      }
      return collection.concat(items.map(y => { y.medicineName = x.name; return y }));
    }, []);
    console.log(elements);
    return elements
      .sort((a, b) => { return a.time > b.time ? 1 : -1 })
      .map(x => <ListGroup.Item key={x.medicineName + x.time}><Row><Col xs="3" sm="2" lg="1" className="text-end">{x.dose}</Col><Col>{x.medicineName} </Col><Col xs="auto"><small>{x.time}</small></Col></Row></ListGroup.Item>);
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


  const handleRefresh = useCallback(() => {
    console.log('checking time');
    const elements = getNotTakenDoses();
    console.log(`${elements.length} found`);
    if (elements.length > 0) {
      new Notification('Webtabsy', { body: "Czas wziąć leki" });
    }
  }, [getNotTakenDoses]);

  useEffect(() => {
    let timer: NodeJS.Timer;
    Notification.requestPermission().then((result) => console.log(result));
    fetchMedicines().then(x => {
      setMedicines(x);
      timer = setInterval(() => handleRefresh(), 10 * 1000);
    });
    return () => clearInterval(timer);
  }, [handleRefresh] );

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
      case -1: return `jutro ????`
      case 0: return `dzisiaj o ${h}:${m}`
      case 1: return `wczoraj o ${h}:${m}`
      default: return diff + ` dni temu - ${date.toLocaleDateString('pl-PL')} o ${h}:${m}`;
    }
  }, [medicines]);

  return (
    <Container className="my-2">
      <header className='mb-2'>
        <Row>
          <Col className="display-6">Webtabsy
            <Spinner animation="border" variant="primary" hidden={!showSpinner} />
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
            {getNotTakenDoses()}
          </ListGroup>
        </Card>
      </section>
      <section>
        <Row>
          <Col xs="auto"><Button onClick={async () => {await handleTakeMedicines()}} >Weź leki</Button></Col>
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
