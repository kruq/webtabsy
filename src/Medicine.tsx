import React, { useEffect, useState, MouseEvent } from 'react';
import './Medicine.css';
import IMedicine from './models/IMedicine';
import IDose from './models/IDose';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';
import FormCheck from 'react-bootstrap/FormCheck';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import InputGroup from 'react-bootstrap/InputGroup';
import Table from 'react-bootstrap/Table';
import FormGroup from 'react-bootstrap/FormGroup';
import IPurchase from './models/IPurchase';
import { v4 as Uuid } from 'uuid';


interface IMedicineProps extends IMedicine {
    idOfMedicineDetails: string;
    medicineClick: (medicineId: string) => void,
    updateMedicine: (id: string, params: any) => Promise<void>,
    deleteMedicine: (id: string) => Promise<void>,
}

interface INewPurchase {
    numberOfPackages: number | undefined;
    numberOfTabletsInPackage: number | undefined;
    pricePerPackage: number | undefined;
}

export default function Medicine(props: IMedicineProps) {
    const lastPurchase: IPurchase | undefined = props.purchases?.[(props.purchases?.length ?? 0) - 1];

    const defaultDose: IDose = { id: Uuid(), time: "12:00", amount: 1, takingDate: new Date() }
    const defaultPurchase: INewPurchase = {
        numberOfPackages: 1,
        numberOfTabletsInPackage: lastPurchase?.numberOfTablets,
        pricePerPackage: lastPurchase?.price
    }

    const [count, setCount] = useState<number | undefined>(props.count);
    const [description, setDescription] = useState(props.description);
    const [fnDebounce, setFnDebounce] = useState<NodeJS.Timer>();
    const [isVisible, setIsVisible] = useState(props.isVisible);

    const [newDose, setNewDose] = useState<IDose>(defaultDose);
    const [newPurchase, setNewPurchase] = useState<INewPurchase>(defaultPurchase);

    const [addDoseDialogVisible, setAddDoseDialogVisible] = useState(false);
    const [addPurchaseDialogVisible, setAddPurchaseDialogVisible] = useState(false);

    const handleMedicineTitleClick = () => {
        props.medicineClick(props.id);
    }

    const handleMedicineCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let newValue: number | undefined = parseFloat(event.target.value);
        if (isNaN(newValue)) {
            newValue = undefined;
        }
        clearTimeout(fnDebounce);
        if (newValue) {
            setFnDebounce(setTimeout(() => props.updateMedicine(props.id, { count: newValue }), 1000));
        }
        setCount(newValue);
    }

    const handleMedicineDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        clearTimeout(fnDebounce);
        setFnDebounce(setTimeout(() => props.updateMedicine(props.id, { description: newValue }), 1000));
        setDescription(newValue);
    }

    const handleMedicineVisibilityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        setIsVisible(isChecked);
        props.updateMedicine(props.id, { isVisible: isChecked })
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
        doses.forEach(x => x.id = Uuid())
        doses.push(newDose);
        await props.updateMedicine(props.id, { doses });
        // setCount(m);
        setNewDose(defaultDose);
        setAddDoseDialogVisible(false);
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

    const handlePurchasePackageAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let amount: number | undefined = parseFloat(event.target.value);
        if (isNaN(amount)) {
            amount = undefined
        }
        const purchase = { ...newPurchase, numberOfPackages: amount };
        setNewPurchase(purchase);
    }

    const handlePurchaseTabletsAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let amount: number | undefined = parseFloat(event.target.value);
        if (isNaN(amount)) {
            amount = undefined
        }
        const purchase = { ...newPurchase, numberOfTabletsInPackage: amount };
        setNewPurchase(purchase);
    }

    const handlePurchasePackagePriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let amount: number | undefined = parseFloat(event.target.value);
        if (isNaN(amount)) {
            amount = undefined
        }
        const purchase = { ...newPurchase, pricePerPackage: amount };
        setNewPurchase(purchase);
    }

    const handleAddPurchase = async (e: MouseEvent) => {
        e.preventDefault();
        if (!newPurchase.numberOfPackages || newPurchase.numberOfPackages <= 0) {
            alert("Nieprawidłowa ilość opakowań");
            return;
        }
        if (!newPurchase.numberOfTabletsInPackage || newPurchase.numberOfTabletsInPackage <= 0) {
            alert("Nieprawidłowa ilość tabletek w opakowaniu");
            return;
        }
        if (!newPurchase.pricePerPackage || newPurchase.pricePerPackage <= 0) {
            alert("Nieprawidłowa cena");
            return;
        }
        let { purchases } = props;
        if (!purchases) {
            purchases = []
        }
        let c = count ?? 0;
        for (let i = 0; i < newPurchase.numberOfPackages; i++) {
            purchases.push({ id: Uuid(), date: new Date(), numberOfTablets: newPurchase.numberOfTabletsInPackage, price: newPurchase.pricePerPackage })
            c += newPurchase.numberOfTabletsInPackage;
        }
        setCount(c)
        await props.updateMedicine(props.id, { purchases, count: c });
        setNewPurchase(defaultPurchase);
        setAddPurchaseDialogVisible(false);
    }

    const handleRemovePurchase = async (purchase: IPurchase) => {
        const index = props.purchases.indexOf(purchase);
        if (index === -1) {
            return;
        }
        alert("Usunięcie zakupu nie modyfikuje ilości tabletek. Trzeba zrobić to ręcznie.");
        const purchases = props.purchases.filter(d => d !== purchase);
        await props.updateMedicine(props.id, { purchases });
    }

    const countNumberOfDays = () => {
        if (!count) {
            return 0;
        }
        const { doses } = { ...props };
        const sumDaily = doses.reduce((prev, current) => prev += current?.amount ?? 0, 0);
        if (!sumDaily) { return Number.POSITIVE_INFINITY; }
        return Math.floor(count / sumDaily);
    }

    useEffect(() => {
        //setCount(props.count);
        //setDescription(props.description);
        // setIsVisible(props.isVisible);
    }, [props.count, props.description]);

    return (
        <Card className="my-2">
            <Card.Body>
                <Card.Title>
                    <Row>
                        <Col onClick={() => handleMedicineTitleClick()} className="medicine-title">
                            <Badge bg={countNumberOfDays() < 8 ? "danger" : "primary"} style={{ width: '80px' }} className="me-2" hidden={countNumberOfDays() === Number.POSITIVE_INFINITY}> {countNumberOfDays()} dni</Badge><> </>
                            <span>{props.name}</span>
                        </Col>
                        <Col xs="auto">
                            <Badge bg="secondary" style={{ width: '90px' }}>{props.count} tab.</Badge>
                        </Col>
                    </Row>
                </Card.Title>
                <div hidden={props.id !== props.idOfMedicineDetails}>
                    <Row>
                        <Col>
                        </Col>
                        <Col xs="auto">
                            <FormCheck
                                // className='mt-1'
                                // style={{fontSize:'medium'}}
                                type="switch"
                                id="medicine-visibility"
                                label=""
                                checked={isVisible}
                                onChange={(e) => handleMedicineVisibilityChange(e)}
                            />
                        </Col>
                    </Row>
                    <Row>
                        <Col sm="auto">
                            <Form.Group>
                                <Form.Label>Aktualna ilość tabletek:</Form.Label>
                                <Form.Control type="number" value={count?.toString()} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMedicineCountChange(e)} ></Form.Control>
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form>
                                <Form.Label>Opis:</Form.Label>
                                <Form.Control type="input" value={description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMedicineDescriptionChange(e)}></Form.Control>
                            </Form>
                        </Col>
                    </Row>
                    <Row className="mt-4">
                        <Col className='text-primary' xs='auto'>
                            <h5>Dawkowanie</h5>
                        </Col>
                        <Col className='text-end'>
                            <Button onClick={() => { setAddDoseDialogVisible(true); setAddPurchaseDialogVisible(false); }} variant='link'>Dodaj</Button>
                        </Col>
                    </Row>
                    <dialog open={addDoseDialogVisible} style={{ zIndex: '1000' }}>
                        <Row>
                            <Col>
                                <strong>Nowa dawka</strong>
                            </Col>
                        </Row>
                        <Form>
                            <Row className="mt-2">
                                <FormGroup as={Col}>
                                    <Form.Label>Godzina:</Form.Label>
                                    <Form.Control type="text" value={newDose?.time} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDoseTimeChange(e)}></Form.Control>
                                </FormGroup>
                                <FormGroup as={Col}>
                                    <Form.Label>Ilość tabletek:</Form.Label>
                                    <Form.Control type="number" value={newDose?.amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDoseAmountChange(e)}></Form.Control>
                                </FormGroup>
                            </Row>
                            <Row className='text-end'>
                                <Col>
                                    <Button onClick={handleAddDose} variant="primary" type="submit" className='mt-3'>Dodaj dawkę</Button>
                                    <Button className='mt-3 ms-2' variant='secondary' onClick={() => setAddDoseDialogVisible(false)}>Cancel</Button>
                                </Col>
                            </Row>
                        </Form>
                    </dialog>
                    <Row className="mt-2">
                        <Col>
                            <Table size='sm'>
                                <tbody>
                                    {props.doses?.map(dose =>
                                        <tr key={dose.id}>
                                            <td width="20%">{dose.time}</td>
                                            <td width="20%">{dose.amount} tab.</td>
                                            <td>
                                                {new Date(dose.takingDate.toString()).toLocaleDateString('pl-PL')} {new Date(dose.takingDate.toString()).toLocaleTimeString('pl-PL')}
                                            </td>
                                            <td className='text-end'>
                                                <Button onClick={() => handleRemoveDose(dose)} size="sm" variant="link" className='text-danger'>Usuń</Button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Col>
                    </Row>

                    <Row className="mt-4">
                        <Col className='text-primary' xs='auto'><h5>Historia zakupów</h5></Col>
                        <Col className='text-end'>
                            <Button onClick={() => { setAddPurchaseDialogVisible(true); setAddDoseDialogVisible(false); }} variant='link'>Dodaj</Button>
                        </Col>
                    </Row>
                    <dialog open={addPurchaseDialogVisible} style={{ zIndex: '1000' }}>
                        <Row className='mt-2'>
                            <Col><strong>Zakupy leków</strong></Col>
                        </Row>
                        <Form>
                            <Row className="mt-2">
                                <FormGroup as={Col}>
                                    <Form.Label>Ilość opakowań:</Form.Label>
                                    <Form.Control type="number" value={newPurchase?.numberOfPackages ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePurchasePackageAmountChange(e)}></Form.Control>
                                </FormGroup>
                                <FormGroup as={Col}>
                                    <Form.Label>Ilość tab. w opakowaniu:</Form.Label>
                                    <Form.Control type="number" value={newPurchase?.numberOfTabletsInPackage ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePurchaseTabletsAmountChange(e)}></Form.Control>
                                </FormGroup>
                                <FormGroup as={Col}>
                                    <Form.Label>Cena za opakowanie:</Form.Label>
                                    <InputGroup>
                                        <Form.Control type='number' value={newPurchase?.pricePerPackage ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePurchasePackagePriceChange(e)}></Form.Control>
                                        <InputGroup.Text>zł</InputGroup.Text>
                                    </InputGroup>
                                </FormGroup>
                            </Row>
                            <Row>
                                <Col className='text-end'>
                                    <Button onClick={handleAddPurchase} variant="primary" type="submit" className='mt-3'>Dodaj zakupione leki</Button>
                                    <Button className='mt-3 ms-2' variant='secondary' onClick={() => setAddPurchaseDialogVisible(false)}>Cancel</Button>
                                </Col>
                            </Row>
                        </Form>
                    </dialog>
                    <Row hidden={!props.purchases || props.purchases?.length === 0}>
                        <Col>
                            <Table size='sm'>
                                {/* <thead>
                                    <tr>
                                        <td>Ilość tabletek</td>
                                        <td>Cena</td>
                                        <td>Data zakupu</td>
                                        <td></td>
                                    </tr>
                                </thead> */}
                                <tbody>
                                    {props.purchases?.map(x =>
                                        <tr key={x.id}>
                                            <td width="20%">
                                                {x.numberOfTablets}{' tab.'}
                                            </td>
                                            <td width="20%">
                                                {x.price}{' zł'}
                                            </td>
                                            <td>
                                                {new Date(x.date.toString()).toLocaleDateString('pl')}
                                            </td>
                                            <td className='text-end'>
                                                <Button onClick={() => handleRemovePurchase(x)} size="sm" variant="link" className='text-danger'>Usuń</Button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td className='text-end'><i>Średnia cena:</i></td>
                                        <td>{props.purchases?.reduce((x, y) => x + y.price, 0) / props.purchases.length}{' zł'}</td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </Table>
                        </Col>
                    </Row>
                </div>
            </Card.Body>
            <Card.Footer hidden={props.id !== props.idOfMedicineDetails}>
                <Row>
                    <Col></Col>
                    <Col xs="auto"><Button onClick={handleMedicineDeleteClick} variant="outline-danger" size="sm">Usuń lek</Button></Col>
                </Row>
            </Card.Footer>
        </Card >
    );
}