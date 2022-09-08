import React, { useEffect, useState, MouseEvent } from 'react';
import './Medicine.css';
import IMedicine from './models/IMedicine';
import IDose from './models/IDose';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';


interface IMedicineProps extends IMedicine {
    idOfMedicineDetails: string;
    medicineClick: (medicineId: string) => void,
    updateMedicine: (id: string, params: any) => Promise<void>,
    deleteMedicine: (id: string) => Promise<void>,
}

export default function Medicine(props: IMedicineProps) {
    const defaultDose: IDose = { time: "00:00", amount: 0, takingDate: new Date() }

    const [count, setCount] = useState(props.count);
    const [newDose, setNewDose] = useState<IDose>(defaultDose);
    const [fnDebounce, setFnDebounce] = useState<NodeJS.Timer>();


    const handleMedicineTitleClick = () => {
        props.medicineClick(props.id);
    }

    const handleMedicineCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(event.target.value);
        clearTimeout(fnDebounce);
        setFnDebounce(setTimeout(() => props.updateMedicine(props.id, { count: newValue }), 1000));
        setCount(newValue);
    }

    const handleMedicineDeleteClick = () => {
        props.deleteMedicine(props.id);
    }

    const handleAddDose = async (e: MouseEvent) => {
        e.preventDefault();
        let { doses } = { ...props };
        if (!doses) {
            doses = [];
        }
        if (!newDose.amount) {
            alert("Nie można dodać dawki z pustą wartością ilości");
            return;
        }
        doses.push(newDose);
        await props.updateMedicine(props.id, { doses });
        // setCount(m);
        setNewDose(defaultDose);
    }

    const handleRemoveDose = async (dose: IDose) => {
        const index = props.doses.indexOf(dose);
        if (index === -1) {
            return;
        }
        const doses = props.doses.filter(d => d !== dose);
        await props.updateMedicine(props.id, { doses });
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

    const countNumberOfDays = () => {
        const { doses } = { ...props };
        const sumDaily = doses.reduce((prev, current) => prev += current?.amount ?? 0, 0);
        if (!sumDaily) { return 0; }
        return Math.floor(props.count / sumDaily);
    }

    useEffect(() => {
        // console.log("Render Medicine " + props.count);
        setCount(props.count);
    }, [props.count]);

    return (
        <Card className="my-2">
            <Card.Header>
                <Row>
                    <Col onClick={() => handleMedicineTitleClick()} className="medicine-title">
                        <Badge bg="secondary" style={{width: '60px'}}>{props.count} tab.</Badge><> </>
                        <Badge bg="primary" style={{width: '60px'}}> {countNumberOfDays()} dni</Badge> <> </>
                        <span>{props.name}</span>
                    </Col>
                </Row>
            </Card.Header>
            <Card.Body hidden={props.id !== props.idOfMedicineDetails}>
                <Card.Title>
                </Card.Title>
                <Form>
                    <Row>
                        <Col xs="auto">
                            <Form.Group>
                                <Form.Label>Aktualna ilość tabletek:</Form.Label>
                                <Form.Control type="number" value={count.toString()} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMedicineCountChange(e)} ></Form.Control>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mt-3">
                        <Col><strong>Dawkowanie</strong></Col>
                    </Row>
                    <Row>
                        <Col xs="auto">
                            <ul>
                                {props.doses?.map(dose =>
                                    <li key={dose.time}>
                                        <strong>{dose.time}</strong>: {dose.amount} tab.
                                        <Button onClick={() => handleRemoveDose(dose)} size="sm" variant="outline-danger" className="mt-1">Usuń</Button>
                                        <> </>
                                        <span>
                                            Wzięte: {new Date(dose.takingDate.toString()).toLocaleDateString('pl-PL')} {new Date(dose.takingDate.toString()).toLocaleTimeString('pl-PL')}
                                        </span>
                                    </li>
                                )}
                            </ul>
                            <strong>Nowa dawka</strong>
                        </Col>
                    </Row>
                    <Row className="mt-2">
                        <Col xs="auto">

                            <Form.Label>Godzina:</Form.Label>
                        </Col>
                        <Col xs="auto">
                            <Form.Control type="text" value={newDose?.time} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDoseTimeChange(e)}></Form.Control>
                        </Col>
                        <Col xs="auto">
                            <Form.Label>Ilość tabletek:</Form.Label>
                        </Col>
                        <Col xs="auto">
                            <Form.Control type="number" value={newDose?.amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDoseAmountChange(e)}></Form.Control>
                        </Col>
                        <Col xs="auto">
                            <Button onClick={handleAddDose} variant="primary" type="submit">Dodaj dawkę</Button>
                        </Col>
                    </Row>
                </Form>

            </Card.Body>
            <Card.Footer hidden={props.id !== props.idOfMedicineDetails}>
                <Row>
                    <Col></Col>
                    <Col xs="auto"><Button onClick={handleMedicineDeleteClick} variant="outline-danger" size="sm">Usuń lek</Button></Col>
                </Row>
            </Card.Footer>
        </Card>
    );
}