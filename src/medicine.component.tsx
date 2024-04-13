import React, { useEffect, useState, MouseEvent } from 'react';
import './Medicine.css';
import IMedicine from './models/IMedicine';
import Dose from './models/Dose';
import Button from 'react-bootstrap/Button';
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
import { TfiPencil, TfiCheck } from 'react-icons/tfi';
import { getDaysText } from './text.helpers';



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

    const defaultDose: Dose = { id: Uuid(), time: "", amount: 1, numberOfDays: 1, nextDoseDate: new Date(), endDate: null }
    const defaultPurchase: INewPurchase = {
        numberOfPackages: 1,
        numberOfTabletsInPackage: lastPurchase?.numberOfTablets,
        pricePerPackage: lastPurchase?.price
    }

    const [name, setName] = useState(props.name);
    const [count, setCount] = useState<number | undefined>(props.count);
    const [description, setDescription] = useState(props.description);
    const [fnDebounce, setFnDebounce] = useState<NodeJS.Timer>();
    const [isVisible, setIsVisible] = useState(props.isVisible);

    const [newDose, setNewDose] = useState<Dose>(defaultDose);
    const [newDoseValid, setNewDoseValid] = useState<boolean>(true);
    const [newPurchase, setNewPurchase] = useState<INewPurchase>(defaultPurchase);

    const [addDoseDialogVisible, setAddDoseDialogVisible] = useState(false);
    const [addPurchaseDialogVisible, setAddPurchaseDialogVisible] = useState(false);

    const [editMedicineName, setEditMedicineName] = useState(false);
    const [editNumberOfTabletes, setEditNumberOfTabletes] = useState(false);
    const [editDescription, setEditDescription] = useState(false);

    const purchasesWithPrice = props.purchases.filter(x => x.price !== null);

    const handleMedicineTitleClick = () => {
        props.medicineClick(props.id);
    }

    const handleMedicineNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        clearTimeout(fnDebounce);
        setFnDebounce(setTimeout(() => {
            props.updateMedicine(props.id, { name: newValue });
            setEditMedicineName(false);
        }, 2000));
        setName(newValue);
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
            setNewDose(defaultDose);
            setAddDoseDialogVisible(false);
            return;
        }
        let value = newDose;
        if (value.nextDoseDate < new Date()) {
            value.nextDoseDate = new Date();
        }
        doses.push(value);
        doses = doses.map(x => {
            x.id = !x.id ? Uuid() : x.id;
            x.time = x.time.length === 4 ? '0' + x.time : x.time;
            x.nextDoseDate = (() => {
                let date = new Date(x.nextDoseDate.toString());
                const timeParts = x.time.split(':');
                date.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
                // TODO: przemyśleć jak jest lepiej
                // if (date < new Date()) {
                //     date.setDate(date.getDate() + 1);
                // }
                return date;
            })();
            return x;
        }).sort((a, b) => a.time > b.time ? 1 : -1);
        await props.updateMedicine(props.id, { doses });
        setNewDose(defaultDose);
        setAddDoseDialogVisible(false);
    }

    const handleRemoveDose = async (dose: Dose) => {
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
        if (event.target.value === undefined) {
            return;
        }
        let amount: number = parseFloat(event.target.value);
        if (isNaN(amount)) {
            return;
        }
        const dose = { ...newDose, amount };
        setNewDose(dose);
    }


    const handleDoseNumberOfDaysChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.value === undefined) {
            return;
        }
        let numberOfDays: number = parseFloat(event.target.value);
        if (isNaN(numberOfDays)) {
            return;
        }
        const dose = { ...newDose, numberOfDays };
        setNewDose(dose);
    }

    const handleNextDosegDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const dateNumber: number = Date.parse(event.target.value);
        if (!isNaN(dateNumber)) {
            let value: Date = new Date(dateNumber);
            value.setHours(0, 0, 0, 0);
            const dose = { ...newDose, nextDoseDate: value };
            setNewDose(dose);
        }
    }

    const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // if (event.target.value === undefined) {
        //     const dose = { ...newDose, endDate: null };
        //     setNewDose(dose);
        // }

        const dateNumber: number = Date.parse(event.target.value);
        let value: Date | null = null;
        if (!isNaN(dateNumber)) {
            value = new Date(dateNumber);
            value.setHours(23, 59, 59, 100);
        }
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

    const takeOneHandler = async (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!count) {
            return;
        }
        const newValue = count - 1;
        await props.updateMedicine(props.id, { count: newValue });
        setCount(newValue);
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
        setCount(props.count);
        //setDescription(props.description);
        // setIsVisible(props.isVisible);
    }, [props.count, props.description]);

    const countAmountInCurrentPackage = () => {
        const lastPackageSize = props.purchases.at(-1)?.numberOfTablets;
        if (lastPackageSize) {
            let value = props.count % lastPackageSize
            if (value === 0) {
                if (props.count !== 0) {
                    value = props.count;
                }
                else {
                    return '';
                }
            }

            return `( ${value} tab. w akt. opak. )`;
        } else {
            return '';
        }
    }

    return (
        <Card className="my-2">
            <Card.Body>
                <Row>
                    <Col onClick={() => handleMedicineTitleClick()} className="medicine-title">
                        <small className={`text-${props.count < 8 ? "danger" : "success"}`}>{props.count} tab.</small>
                        <small> {countAmountInCurrentPackage()}</small>
                        {/* <Badge bg="secondar(y" style={{ width: '70px' }} className="d-none d-md-inline" >{props.count} tab.</Badge> */}
                    </Col>
                    <Col xs="auto">
                        <small className={`text-${countNumberOfDays() < 8 ? "danger" : "success"}`}>{countNumberOfDays()} dni</small>
                        {/* <Badge bg={countNumberOfDays() < 8 ? "danger" : "primary"} style={{ width: '70px' }} className="d-none d-md-inline" hidden={countNumberOfDays() === 0}> {countNumberOfDays()} dni</Badge><> </> */}
                    </Col>
                </Row>
                <Row className='mt-2'>
                    <Col>
                        <h6>{props.name}</h6>
                    </Col>
                    <Col xs="auto">
                        <Button variant='link' size='sm' onClick={async (e) => await takeOneHandler(e)} aria-label='Take one pill'>Weź lek</Button>
                    </Col>
                </Row>
                <div hidden={props.id !== props.idOfMedicineDetails}>
                    <Row className="mt-4 mb-3">
                        <Col className='text-primary' xs='auto'>
                            Ustawienia
                        </Col>
                    </Row>
                    <Form.Group>
                        <Row>
                            <Col>
                                <Form.Label><small>Nazwa leku:</small></Form.Label>
                            </Col>
                            <Col xs="auto">
                                <Button onClick={() => setEditMedicineName(true)} variant='link' hidden={editMedicineName}><TfiPencil /></Button>
                                <Button onClick={() => setEditMedicineName(false)} variant='link' hidden={!editMedicineName}><TfiCheck /></Button>
                            </Col>
                        </Row>
                        <Row>
                            <Col hidden={editMedicineName}>
                                {name}
                            </Col>
                            <Col>
                                <Form.Group hidden={!editMedicineName}>
                                    <Form.Control type="text" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMedicineNameChange(e)} ></Form.Control>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form.Group>
                    <Form.Group>
                        <Row>
                            <Col>
                                <Form.Label><small>Ilość tabletek:</small></Form.Label>
                            </Col>
                            <Col xs="auto">
                                <Button onClick={() => setEditNumberOfTabletes(true)} variant='link' hidden={editNumberOfTabletes}><TfiPencil /></Button>
                                <Button onClick={() => setEditNumberOfTabletes(false)} variant='link' hidden={!editNumberOfTabletes}><TfiCheck /></Button>
                            </Col>
                        </Row>
                        <Row>
                            <Col hidden={editNumberOfTabletes}>
                                {count}
                            </Col>
                            <Col hidden={!editNumberOfTabletes}>
                                <Form.Control type="number" value={count?.toString()} hidden={!editNumberOfTabletes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMedicineCountChange(e)} ></Form.Control>
                            </Col>
                        </Row>
                    </Form.Group>
                    <Form.Group>
                        <Row>
                            <Col>
                                <Form.Label><small>Opis:</small></Form.Label>
                            </Col>
                            <Col xs='auto'>
                                <Button onClick={() => setEditDescription(true)} variant='link' hidden={editDescription}><TfiPencil /></Button>
                                <Button onClick={() => setEditDescription(false)} variant='link' hidden={!editDescription}><TfiCheck /></Button>
                            </Col>
                        </Row>
                        <Row>
                            <Col hidden={editDescription}>
                                {description}
                            </Col>
                            <Col hidden={!editDescription}>
                                <Form.Control type="text" value={description} placeholder='Opis' onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMedicineDescriptionChange(e)}></Form.Control>
                            </Col>
                        </Row>
                    </Form.Group>
                    <Row className="mt-4">
                        <Col className='text-primary' xs='auto'>
                            Dawkowanie
                        </Col>
                        <Col className='text-end'>
                            <Button onClick={() => { setAddDoseDialogVisible(true); setAddPurchaseDialogVisible(false); }} variant='link'>Dodaj</Button>
                        </Col>
                    </Row>
                    <dialog open={addDoseDialogVisible}>
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
                                <FormGroup as={Col}>
                                    <Form.Label>Co ile dni:</Form.Label>
                                    <Form.Control type='number' value={newDose?.numberOfDays} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDoseNumberOfDaysChange(e)} />
                                </FormGroup>
                            </Row>
                            <Row>
                                <FormGroup as={Col}>
                                    <Form.Label>Od kiedy:</Form.Label>
                                    <Form.Control type="date" value={formatDate(newDose.nextDoseDate)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNextDosegDateChange(e)}></Form.Control>
                                </FormGroup>
                                <FormGroup as={Col}>
                                    <Form.Label>Do kiedy:</Form.Label>
                                    <Form.Control type="date" value={formatDate(newDose?.endDate)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEndDateChange(e)}></Form.Control>
                                </FormGroup>
                            </Row>
                            {/* TODO: Dodać obsługe dni tygodnia */}
                            {/* <Row>
                                <FormGroup as={Col}>
                                    <Form.Label>Dni tygodnia:</Form.Label>
                                    <InputGroup>
                                        <Form.Check type='checkbox' label='Pn.' className='me-2' checked/>
                                        <Form.Check type='checkbox' label='Wt.' className='me-2' checked/>
                                        <Form.Check type='checkbox' label='Śr.' className='me-2' checked/>
                                        <Form.Check type='checkbox' label='Cz.' className='me-2' checked/>
                                        <Form.Check type='checkbox' label='Pt.' className='me-2' checked/>
                                        <Form.Check type='checkbox' label='Sb.' className='me-2' checked/>
                                        <Form.Check type='checkbox' label='Nd.' className='me-2' checked/>
                                    </InputGroup>
                                </FormGroup>
                            </Row> */}
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
                                        <>
                                            <tr key={'medicine-dose-' + dose.id}>
                                                <td width="auto">{dose.time}</td>
                                                <td width="auto" className='text-end'>{dose.amount} tab.</td>
                                                <td width="20%">{getDaysText(dose.numberOfDays ?? 1)}</td>
                                                <td style={{ textAlign: 'right', paddingRight: '5px' }}>
                                                    {dose.nextDoseDate.toLocaleDateString('pl-PL', { year: '2-digit', month: '2-digit', day: 'numeric' })}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    {(dose?.endDate !== null ? dose.endDate.toLocaleDateString('pl-PL', { year: '2-digit', month: '2-digit', day: 'numeric' }) : <i className='text-secondary'>-</i>)}
                                                </td>
                                                <td className='text-end'>
                                                    <Button onClick={() => handleRemoveDose(dose)} variant="link" className='text-danger'>Usuń</Button>
                                                </td>
                                            </tr>
                                        </>
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
                    <dialog open={addPurchaseDialogVisible}>
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
                                                {x.date.toLocaleDateString('pl')}
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
                                Math.round(purchasesWithPrice.reduce((x, y) => x + (y.price ?? 0), 0) * 100 / purchasesWithPrice?.length) / 100
                            }{' zł'}
                        </Col>
                    </Row>
                </div>
            </Card.Body >
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
