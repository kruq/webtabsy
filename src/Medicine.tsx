import React, { useState } from 'react';
import './Medicine.css';
import IMedicine from './models/IMedicine';
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

    const [medicine, setMedicine] = useState(props.medicine);


    const handleMedicineTitleClick = () => {
        props.medicineClick(medicine.id);
    }

    const handleMedicineCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const m: IMedicine = { ...medicine };
        m.count = parseFloat(event.target.value);
        setMedicine(m);
    }

    const handleMedicineDoseChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const m: IMedicine = { ...medicine };
        m.dose = parseFloat(event.target.value);
        setMedicine(m);
    }

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


    return (
        <Card className="my-2">
            <Card.Body>
                <Card.Title>
                    <Row>
                        <Col onClick={() => handleMedicineTitleClick()} className="medicine-title"><span>{medicine.name}</span> <Badge bg="primary">{medicine.count} tab.</Badge></Col>
                        <Col xs="auto"><Button onClick={handleMissedDose} variant="warning" size="sm">Pominięto</Button></Col>
                    </Row>
                </Card.Title>
                <Form hidden={medicine.id !== props.idOfMedicineDetails}>
                    <Row>
                        <Col></Col>
                        <Col xs="auto">
                            <Form.Group>
                                <Form.Label>Ilość tabletek</Form.Label>
                                <Form.Control type="number" value={medicine.count} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMedicineCountChange(e)} ></Form.Control>
                            </Form.Group>
                        </Col>
                        <Col xs="auto">
                            <Form.Group>
                                <Form.Label>Dzienna dawka</Form.Label>
                                <Form.Control type="number" value={medicine.dose} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMedicineDoseChange(e)} ></Form.Control>
                            </Form.Group>
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