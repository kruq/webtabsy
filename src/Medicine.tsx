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
import { CheckLg, Pencil } from 'react-bootstrap-icons';


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

    const defaultDose: IDose = { id: Uuid(), time: "12:00", amount: 1, takingDate: new Date(), endDate: null }
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
    const [newDoseValid, setNewDoseValid] = useState<boolean>(true);
    const [newPurchase, setNewPurchase] = useState<INewPurchase>(defaultPurchase);

    const [addDoseDialogVisible, setAddDoseDialogVisible] = useState(false);
    const [addPurchaseDialogVisible, setAddPurchaseDialogVisible] = useState(false);

    const [editNumberOfTabletes, setEditNumberOfTabletes] = useState(false);
    const [editDescription, setEditDescription] = useState(false);

    const purchasesWithPrice = props.purchases.filter(x => x.price !== null);

    const handleMedicineTitleClick = () => {
        props.medicineClick(props.id);
    }

    const handleMedicineCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let newValue: number | undefined = parseFloat(event.target.value);
        if (isNaN(newValue)) {
            newValue = undefined;
        }
        clearTimeout(fnDebounce);
        if (newValue || newValue === 0) {
            setFnDebounce(setTimeout(() => {
                props.updateMedicine(props.id, { count: newValue });
                setEditNumberOfTabletes(false);
            }, 2000));
        }
        setCount(newValue);
    }

    const handleMedicineDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        clearTimeout(fnDebounce);
        setFnDebounce(setTimeout(() => {
            props.updateMedicine(props.id, { description: newValue });
            setEditDescription(false);
        }, 2000));
        setDescription(newValue);
    }

    const handleMedicineVisibilityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        setIsVisible(isChecked);
        props.updateMedicine(props.id, { isVisible: isChecked })
    }

    const handleRemoveMedicine = () => {
        if (window.confirm('Czy chcesz usunąć lek?')) {
            props.deleteMedicine(props.id);
        }
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
        let value = newDose;
        if (value.takingDate < new Date()) {
            value.takingDate = new Date();
        }
        doses.push(value);
        doses = doses.map(x => {
            x.id = !x.id ? Uuid() : x.id;
            x.time = x.time.length === 4 ? '0' + x.time : x.time;
            return x;
        }).sort((a, b) => a.time > b.time ? 1 : -1);
        await props.updateMedicine(props.id, { doses });
        setNewDose(defaultDose);
        setAddDoseDialogVisible(false);
    }

    const handleRemoveDose = async (dose: IDose) => {
        if (!window.confirm('Czy chcesz usunąć dawkę?')) {
            return;
        }
        const index = props.doses.indexOf(dose);
        if (index === -1) {
            return;
        }
        const doses = props.doses.filter(d => d !== dose);
        await props.updateMedicine(props.id, { doses });
    }

    const handleDoseTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const time = event.target.value;
        const regex = /^\d?:?\d:?\d\d$/;
        const position = time.replaceAll(':', '').length - 2;
        setNewDoseValid(time.match(regex) != null);

        const newTime = (
            time.match(regex) === null ?
                time :
                [time.replaceAll(':', '').slice(0, position), ':', time.replaceAll(':', '').slice(position)].join('')
        )

        const dose = {
            ...newDose,
            time: newTime
        }
        setNewDose(dose);
    };

    const handleDoseAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let amount: number | undefined = parseFloat(event.target.value);
        if (isNaN(amount)) {
            amount = undefined;
        }
        const dose = { ...newDose, amount };
        setNewDose(dose);
    }

    const handleTakingDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.value === undefined) {
            const dose = { ...newDose, takingDate: new Date() };
            setNewDose(dose);
        }

        let value: Date | undefined = new Date(event.target.value);
        value.setHours(0, 0, 0, 0);
        const dose = { ...newDose, takingDate: value };
        setNewDose(dose);
    }

    const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.value === undefined) {
            const dose = { ...newDose, endDate: null };
            setNewDose(dose);
        }

        let value: Date | undefined = new Date(event.target.value);
        value.setHours(23, 59, 59, 100);
        const dose = { ...newDose, endDate: value };
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
        if (newPurchase.pricePerPackage !== undefined && newPurchase.pricePerPackage <= 0) {
            alert("Nieprawidłowa cena");
            return;
        }
        if (!newPurchase.pricePerPackage && !window.confirm('Czy na pewno nie chcesz podać ceny?')) {
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
        if (!window.confirm('Czy chcesz usunąć dawkę?')) {
            return;
        }
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
        if (!sumDaily) { return 0 }
        return Math.floor(count / sumDaily);
    }

    const formatDate = (date: Date | null): string | undefined => {
        if (date === undefined || date === null) {
            return undefined;
        }

        const day = date.getDate().toString().length === 1 ? '0' + date.getDate().toString() : date.getDate().toString();
        const month = (date.getMonth() + 1).toString().length === 1 ? '0' + (date.getMonth() + 1).toString() : (date.getMonth() + 1).toString();


        const result = `${date.getFullYear()}-${month}-${day}`;
        return result;
    }

    useEffect(() => {
        //setCount(props.count);
        //setDescription(props.description);
        // setIsVisible(props.isVisible);
    }, [props.count, props.description]);

    return (
        <Card className="my-2">
            <Card.Body>
                <Row>
                    <Col onClick={() => handleMedicineTitleClick()} className="medicine-title">
                        <Badge bg={countNumberOfDays() < 8 ? "danger" : "primary"} style={{ width: '70px' }} className="me-2" hidden={countNumberOfDays() === 0}> {countNumberOfDays()} dni</Badge><> </>
                        <span>{props.name}</span>
                    </Col>
                    <Col xs="auto">
                        <Badge bg="secondary" style={{ width: '70px' }}>{props.count} tab.</Badge>
                    </Col>
                </Row>
                <div hidden={props.id !== props.idOfMedicineDetails}>
                    <Row className="mt-4 mb-3">
                        <Col className='text-primary' xs='auto'>
                            Ustawienia
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <Form.Group>
                                <Row>
                                    <Col xs='auto'>
                                        <p><Form.Label>Ilość tabletek:</Form.Label></p>
                                    </Col>
                                    <Col hidden={editNumberOfTabletes}>
                                        {count}
                                    </Col>
                                    <Col hidden={!editNumberOfTabletes}>
                                        <Form.Control type="number" value={count?.toString()} hidden={!editNumberOfTabletes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMedicineCountChange(e)} ></Form.Control>
                                    </Col>
                                    <Col xs="auto">
                                        <Button onClick={() => setEditNumberOfTabletes(true)} variant='link' hidden={editNumberOfTabletes}><Pencil /></Button>
                                        <Button onClick={() => setEditNumberOfTabletes(false)} variant='link' hidden={!editNumberOfTabletes}><CheckLg /></Button>
                                    </Col>
                                </Row>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <Form>
                                <Row>
                                    <Col>
                                        <p><Form.Label>Opis:</Form.Label></p>
                                    </Col>
                                    <Col xs='auto' hidden={editDescription}>
                                        <Button onClick={() => setEditDescription(true)} variant='link'><Pencil /></Button>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col hidden={editDescription}>
                                        {description.split('\n').map((x, index) => <span key={'medicine-' + props.id + 'description-' + index}>{x}<br /></span>)}{' '}
                                    </Col>
                                </Row>
                                <Row>
                                    <Col>
                                        <Form.Control as="textarea" value={description} hidden={!editDescription} placeholder='Opis' onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMedicineDescriptionChange(e)}></Form.Control>
                                    </Col>
                                    <Col xs='auto'>
                                        <Button hidden={!editDescription} onClick={() => setEditDescription(false)} variant='link'><CheckLg /></Button>
                                    </Col>
                                </Row>
                            </Form>
                        </Col>
                    </Row>
                    <Row className="mt-4">
                        <Col className='text-primary' xs='auto'>
                            Dawkowanie
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
                            <Row>
                                <FormGroup as={Col}>
                                    <Form.Label>Od kiedy:</Form.Label>
                                    <Form.Control type="date" value={formatDate(newDose.takingDate)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTakingDateChange(e)}></Form.Control>
                                </FormGroup>
                                <FormGroup as={Col}>
                                    <Form.Label>Do kiedy:</Form.Label>
                                    <Form.Control type="date" value={formatDate(newDose?.endDate)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEndDateChange(e)}></Form.Control>
                                </FormGroup>
                            </Row>
                            <Row className='text-end'>
                                <Col>
                                    <Button onClick={handleAddDose} variant="primary" type="submit" className='mt-3' disabled={!newDoseValid}>Dodaj dawkę</Button>
                                    <Button className='mt-3 ms-2' variant='secondary' onClick={() => setAddDoseDialogVisible(false)}>Anuluj</Button>
                                </Col>
                            </Row>
                        </Form>
                    </dialog>
                    <Row>
                        <Col>
                            <Table size='sm'>
                                <tbody>
                                    {props.doses?.map(dose =>
                                        <tr key={'medicine-dose-' + dose.id}>
                                            <td width="20%">{dose.time}</td>
                                            <td width="20%">{dose.amount} tab.</td>
                                            <td>
                                                {new Date(dose.takingDate.toString()).toLocaleDateString('pl-PL')} 
                                                {/* new Date(dose.takingDate.toString()).toLocaleTimeString('pl-PL') */ }
                                            </td>
                                            <td>
                                                {(dose?.endDate !== null ? new Date(dose.endDate).toLocaleDateString('pl') : <i className='text-secondary'>bez końca</i>)}
                                            </td>
                                            <td className='text-end'>
                                                <Button onClick={() => handleRemoveDose(dose)} variant="link" className='text-danger'>Usuń</Button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Col>
                    </Row>

                    <Row className="mt-4">
                        <Col className='text-primary' xs='auto'>Historia zakupów</Col>
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
                                    <Button className='mt-3 ms-2' variant='secondary' onClick={() => setAddPurchaseDialogVisible(false)}>Anuluj</Button>
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
                                        <tr key={'medicine-purchase-' + x.id}>
                                            <td width="20%">
                                                {x.numberOfTablets}{' tab.'}
                                            </td>
                                            <td width="20%">
                                                <span hidden={x.price === undefined}>{x.price}{' zł'}</span>
                                                <span hidden={x.price !== undefined}>-</span>
                                            </td>
                                            <td>
                                                {new Date(x.date.toString()).toLocaleDateString('pl')}
                                            </td>
                                            <td className='text-end'>
                                                <Button onClick={() => handleRemovePurchase(x)} variant="link" className='text-danger my-0'>Usuń</Button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                            <i>Średnia cena: </i>
                            {
                                purchasesWithPrice.reduce((x, y) => x + (y.price ?? 0), 0) / purchasesWithPrice?.length
                            }{' zł'}
                        </Col>
                    </Row>
                </div>
            </Card.Body>
            <Card.Footer hidden={props.id !== props.idOfMedicineDetails}>
                <Row>
                    <Col></Col>
                    <Col xs="auto">
                        <FormCheck
                            // className='mt-1'
                            // style={{fontSize:'medium'}}
                            type="switch"
                            id="medicine-visibility"
                            label="Widoczny"
                            checked={isVisible}
                            onChange={(e) => handleMedicineVisibilityChange(e)}
                        />
                    </Col>
                    <Col xs="auto"><Button onClick={handleRemoveMedicine} variant="outline-danger" size="sm">Usuń lek</Button></Col>
                </Row>
            </Card.Footer>
        </Card >
    );
}