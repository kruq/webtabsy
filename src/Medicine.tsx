import React, { useState } from 'react';
import './Medicine.css';
import IMedicine from './models/IMedicine';
import IDose from './models/IDose';
import { deleteMedicine, updateMedicine } from './services/medicine.service';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';


interface IMedicineProps {
    medicine: IMedicine,
    idOfMedicineDetails: string;
    medicineClick: (medicineId: string) => void
}

export default function Medicine(props: IMedicineProps) {
    const defaultDose: IDose = { time: "00:00", amount: 0 }

    const [medicine, setMedicine] = useState(props.medicine);
    const [newDose, setNewDose] = useState<IDose>(defaultDose);


    const handleMedicineTitleClick = () => {
        props.medicineClick(medicine.id);
    }

    const handleMedicineCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const m: IMedicine = { ...medicine };
        m.count = parseFloat(event.target.value);
        setMedicine(m);
    }

    // const handleMedicineDoseChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     const m: IMedicine = { ...medicine };
    //     m.dose = parseFloat(event.target.value);
    //     setMedicine(m);
    // }

    const handleMedicineDeleteClick = () => {
        deleteMedicine(medicine);
    }

    const handleMedicineSave = () => {
        updateMedicine(medicine);
    }

    const handleMissedDose = () => {
        const m: IMedicine = { ...medicine };
        m.count++;
        setMedicine(m);
        updateMedicine(m);
    }

    const handleAddDose = async () => {
        const m = { ...medicine };
        if (!m.doses) {
            m.doses = [];
        }
        if (!newDose.amount) {
            alert("Nie można dodać dawki z pustą wartością ilości");
            return;
        }
        m.doses.push(newDose);
        await updateMedicine(m);
        setMedicine(m);
        setNewDose(defaultDose);
    }

    const handleRemoveDose = async (dose: IDose) => {
        const m = { ...medicine };
        const index = m.doses.indexOf(dose);
        if (index === -1) {
            return;
        }
        m.doses.splice(index, 1);
        await updateMedicine(m);
        setMedicine(m);
    }

    const handleDoseTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const time = event.target.value;
        const dose = { ...newDose, time };
        setNewDose(dose);
    }

    const handleDoseAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let amount: number | undefined = parseFloat(event.target.value);
        if (isNaN(amount)) {
            amount = undefined;
        }
        const dose = { ...newDose, amount };
        setNewDose(dose);
    }

    return (
        <Card className="my-2">
            <Card.Header>
                <Row>
                    <Col onClick={() => handleMedicineTitleClick()} className="medicine-title"><span>{medicine.name}</span> <Badge bg="primary">{medicine.count} tab.</Badge></Col>
                    <Col xs="auto"><Button onClick={handleMissedDose} variant="warning" size="sm">Pominięto</Button></Col>
                </Row>
            </Card.Header>
            <Card.Body>
                <Card.Title>
                </Card.Title>
                <Form hidden={medicine.id !== props.idOfMedicineDetails}>
                    <Row>
                        <Col xs="auto">
                            <Form.Group>
                                <Form.Label>Aktualna ilość tabletek</Form.Label>
                                <Form.Control type="number" value={medicine.count} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMedicineCountChange(e)} ></Form.Control>
                            </Form.Group>
                        </Col>
                        {/* <Col xs="auto">
                            <Form.Group>
                                <Form.Label>Dzienna dawka</Form.Label>
                                <Form.Control type="number" value={medicine.dose} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMedicineDoseChange(e)} ></Form.Control>
                            </Form.Group>
                        </Col> */}
                    </Row>
                    <Row>
                        <Col><strong>Dawkowanie</strong></Col>
                    </Row>
                    <Row>
                        <Col xs="auto">
                            <ul>
                                {medicine.doses?.map(x => <li key={x.time}><strong>{x.time}</strong>: {x.amount} tab. <Button onClick={() => handleRemoveDose(x)} size="sm" variant="outline-danger" className="mt-1">Usuń</Button></li>)}
                            </ul>
                            <strong>Nowa dawka</strong>
                        </Col>
                    </Row>
                    <Row>
                        <Col>

                            <Form.Label>Godzina:</Form.Label>
                        </Col>
                        <Col>
                            <Form.Control type="text" value={newDose?.time} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDoseTimeChange(e)}></Form.Control>
                        </Col>
                        <Col>
                            <Form.Label>Ilość tabletek:</Form.Label>
                        </Col>
                        <Col>
                            <Form.Control type="number" value={newDose?.amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDoseAmountChange(e)}></Form.Control>
                        </Col>
                        <Col>
                            <Button onClick={handleAddDose} variant="primary" className="my-2">Dodaj dawkę</Button>

                        </Col>
                    </Row>
                    <Row>
                        <Col></Col>
                        <Col xs="auto">
                            <Button onClick={handleMedicineSave} variant="primary" className="my-2">Zapisz</Button>
                        </Col>
                    </Row>
                </Form>

            </Card.Body>
            <Card.Footer hidden={medicine.id !== props.idOfMedicineDetails}>
                <Row>
                    <Col></Col>
                    <Col xs="auto"><Button onClick={handleMedicineDeleteClick} variant="outline-danger" size="sm">Usuń lek</Button></Col>
                </Row>
            </Card.Footer>
        </Card>
    );
}