import React, { useEffect, useState } from 'react';
import '../Medicine.css';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Collapse from 'react-bootstrap/Collapse';
import Form from 'react-bootstrap/Form';
import FormCheck from 'react-bootstrap/FormCheck';
import Row from 'react-bootstrap/Row';
import { v4 as Uuid } from 'uuid';
import { DEBOUNCE_TIMEOUT_MS, LOW_STOCK_THRESHOLD } from '../constants';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import Dose from '../models/Dose';
import IMedicine from '../models/IMedicine';
import IPurchase from '../models/IPurchase';
import { getDateText } from '../text.helpers';
import { AMOUNT_HINT, formatAmount, parseAmount, subtractAmount } from '../utils/fraction';
import { countAmountInCurrentPackage, countDaysOfStock } from '../utils/medicineMath';
import DoseDialog from './DoseDialog';
import DoseList from './DoseList';
import EditableField from './EditableField';
import PurchaseDialog, { NewPurchase } from './PurchaseDialog';
import PurchaseList from './PurchaseList';
import TakeDoseDialog from './TakeDoseDialog';

export interface IMedicineProps extends IMedicine {
    idOfMedicineDetails: string;
    medicineClick: (medicineId: string) => void;
    updateMedicine: (id: string, params: Partial<IMedicine>) => Promise<void>;
    deleteMedicine: (id: string) => Promise<void>;
}

const newDoseTemplate = (): Dose => ({
    id: Uuid(),
    time: '',
    amount: 1,
    numberOfDays: 1,
    nextDoseDate: new Date(),
    endDate: null,
});

export default function MedicineCard(props: IMedicineProps) {
    const isOpen = props.id === props.idOfMedicineDetails;
    const lastPurchase: IPurchase | undefined = props.purchases?.[props.purchases.length - 1];

    const [name, setName] = useState(props.name);
    const [count, setCount] = useState<number | undefined>(props.count);
    const [countText, setCountText] = useState<string>(formatAmount(props.count));
    const [meal, setMeal] = useState(props.meal);
    const [description, setDescription] = useState(props.description);

    const [editingName, setEditingName] = useState(false);
    const [editingCount, setEditingCount] = useState(false);
    const [editingMeal, setEditingMeal] = useState(false);
    const [editingDescription, setEditingDescription] = useState(false);

    const [doseDialogOpen, setDoseDialogOpen] = useState(false);
    const [doseUnderEdit, setDoseUnderEdit] = useState<Dose>(newDoseTemplate());
    const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
    const [takeDoseDialogOpen, setTakeDoseDialogOpen] = useState(false);
    const [purchasesExpanded, setPurchasesExpanded] = useState(false);

    useEffect(() => {
        setCount(props.count);
        setCountText(formatAmount(props.count));
    }, [props.count]);
    useEffect(() => { setName(props.name); }, [props.name]);
    useEffect(() => { setMeal(props.meal); }, [props.meal]);
    useEffect(() => { setDescription(props.description); }, [props.description]);

    const debouncedUpdate = useDebouncedCallback(
        (params: Partial<IMedicine>, onComplete?: () => void) => {
            props.updateMedicine(props.id, params);
            onComplete?.();
        },
        DEBOUNCE_TIMEOUT_MS,
    );

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setName(value);
        debouncedUpdate({ name: value }, () => setEditingName(false));
    };

    const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        setCountText(raw);
        const value = parseAmount(raw);
        setCount(value);
        if (value !== undefined) {
            debouncedUpdate({ count: value }, () => setEditingCount(false));
        }
    };

    const handleMealChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setMeal(value);
        debouncedUpdate({ meal: value }, () => setEditingMeal(false));
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setDescription(value);
        debouncedUpdate({ description: value }, () => setEditingDescription(false));
    };

    const handleVisibilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        props.updateMedicine(props.id, { isVisible: e.target.checked });
    };

    const handleHideWhenEmptyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        props.updateMedicine(props.id, { hideWhenEmpty: e.target.checked });
    };

    const handleRemoveMedicine = () => {
        if (window.confirm('Czy chcesz usunąć lek?')) {
            props.deleteMedicine(props.id);
        }
    };

    const openDoseDialogForNew = () => {
        setDoseUnderEdit(newDoseTemplate());
        setPurchaseDialogOpen(false);
        setTakeDoseDialogOpen(false);
        setDoseDialogOpen(true);
    };

    const openDoseDialogForEdit = (dose: Dose) => {
        setDoseUnderEdit(dose);
        setPurchaseDialogOpen(false);
        setTakeDoseDialogOpen(false);
        setDoseDialogOpen(true);
    };

    const handleSaveDose = async (dose: Dose) => {
        const others = props.doses.filter(d => d.id !== dose.id);
        const doses = [...others, dose].sort((a, b) => (a.time > b.time ? 1 : -1));
        await props.updateMedicine(props.id, { doses });
        setDoseDialogOpen(false);
    };

    const handleRemoveDose = async (dose: Dose) => {
        if (!window.confirm('Czy chcesz usunąć dawkę?')) return;
        const doses = props.doses.filter(d => d !== dose);
        await props.updateMedicine(props.id, { doses });
    };

    const handleAddPurchase = async (purchase: NewPurchase) => {
        let newDoses = props.doses;
        if ((!count || count === 0) && window.confirm('Czy chcesz zresetować następny dzień dawkowania?')) {
            newDoses = props.doses.map(d => ({ ...d, nextDoseDate: new Date() }));
        }
        const newPurchases: IPurchase[] = [...(props.purchases ?? [])];
        let newCount = count ?? 0;
        for (let i = 0; i < (purchase.numberOfPackages ?? 0); i++) {
            newPurchases.push({
                id: Uuid(),
                date: new Date(),
                numberOfTablets: purchase.numberOfTabletsInPackage as number,
                price: purchase.pricePerPackage,
            });
            newCount += purchase.numberOfTabletsInPackage as number;
        }
        setCount(newCount);
        setCountText(formatAmount(newCount));
        await props.updateMedicine(props.id, { purchases: newPurchases, count: newCount, doses: newDoses });
        setPurchaseDialogOpen(false);
    };

    const handleRemovePurchase = async (purchase: IPurchase) => {
        if (!window.confirm('Czy chcesz usunąć dawkę?')) return;
        alert('Usunięcie zakupu nie modyfikuje ilości tabletek. Trzeba zrobić to ręcznie.');
        const purchases = props.purchases.filter(p => p !== purchase);
        await props.updateMedicine(props.id, { purchases });
    };

    const openTakeDoseDialog = () => {
        setDoseDialogOpen(false);
        setPurchaseDialogOpen(false);
        setTakeDoseDialogOpen(true);
    };

    const handleTakeDose = async (amount: number) => {
        if (!count) return;
        const newValue = subtractAmount(count, amount);
        setCount(newValue);
        setCountText(formatAmount(newValue));
        setTakeDoseDialogOpen(false);
        await props.updateMedicine(props.id, { count: newValue });
    };

    const daysOfStock = countDaysOfStock(props);
    const tabsInPackage = countAmountInCurrentPackage(props);
    const lastDayLabel = (() => {
        const date = new Date();
        date.setDate(date.getDate() + daysOfStock);
        return daysOfStock < 7 ? getDateText(date) : date.toLocaleDateString('pl-PL');
    })();

    return (
        <Card className="my-2">
            <Card.Body>
                <Row>
                    <Col onClick={() => props.medicineClick(props.id)} className="medicine-title">
                        <small className={`text-${props.count < LOW_STOCK_THRESHOLD ? 'danger' : 'success'}`}>{formatAmount(props.count)} tab.</small>
                        {tabsInPackage !== undefined && (
                            <small> ( {formatAmount(tabsInPackage)} tab. w akt. opak. )</small>
                        )}
                    </Col>
                    <Col xs="auto" hidden={daysOfStock < 0}>
                        {props.count > 0 && (
                            <small className={`text-${daysOfStock < LOW_STOCK_THRESHOLD ? 'danger' : 'success'}`}>
                                {lastDayLabel} ({daysOfStock} dni)
                            </small>
                        )}
                    </Col>
                </Row>
                <Row className="mt-2">
                    <Col>
                        <h6>{props.name}</h6>
                    </Col>
                    <Col xs="auto">
                        <Button variant="link" size="sm" onClick={openTakeDoseDialog} aria-label="Take a dose">Weź lek</Button>
                    </Col>
                </Row>

                <TakeDoseDialog
                    visible={takeDoseDialogOpen}
                    medicineName={props.name}
                    maxAmount={count ?? 0}
                    onSubmit={handleTakeDose}
                    onCancel={() => setTakeDoseDialogOpen(false)}
                />

                {isOpen && (
                    <>
                        <Row className="mt-3 mb-1">
                            <Col className="text-primary" xs="auto">Ustawienia</Col>
                        </Row>

                        <EditableField
                            label="Nazwa leku"
                            isEditing={editingName}
                            onStartEdit={() => setEditingName(true)}
                            onStopEdit={() => setEditingName(false)}
                            display={name}
                        >
                            <Form.Control type="text" value={name} onChange={handleNameChange} />
                        </EditableField>

                        <EditableField
                            label="Ilość tabletek"
                            isEditing={editingCount}
                            onStartEdit={() => setEditingCount(true)}
                            onStopEdit={() => setEditingCount(false)}
                            display={formatAmount(count)}
                        >
                            <>
                                <Form.Control type="text" inputMode="text" value={countText} onChange={handleCountChange} />
                                <Form.Text className="text-secondary">{AMOUNT_HINT}</Form.Text>
                            </>
                        </EditableField>

                        <EditableField
                            label="Przyjmowanie z posiłkiem"
                            isEditing={editingMeal}
                            onStartEdit={() => setEditingMeal(true)}
                            onStopEdit={() => setEditingMeal(false)}
                            display={meal ? meal : <span className="text-secondary">Brak informacji</span>}
                        >
                            <Form.Control type="text" value={meal} placeholder="Przyjmowanie z posiłkiem" onChange={handleMealChange} />
                        </EditableField>

                        <EditableField
                            label="Opis"
                            isEditing={editingDescription}
                            onStartEdit={() => setEditingDescription(true)}
                            onStopEdit={() => setEditingDescription(false)}
                            display={description}
                        >
                            <Form.Control type="text" value={description} placeholder="Opis" onChange={handleDescriptionChange} />
                        </EditableField>

                        <Form.Group className="mb-3">
                            <Row>
                                <Col>
                                    <FormCheck
                                        type="switch"
                                        id={`dose-hidden-when-empty-${props.id}`}
                                        label="Ukryj jeśli brakuje leku"
                                        checked={props.hideWhenEmpty}
                                        onChange={handleHideWhenEmptyChange}
                                    />
                                </Col>
                            </Row>
                        </Form.Group>

                        <Row className="mt-4">
                            <Col className="text-primary" xs="auto">Dawkowanie</Col>
                            <Col className="text-end">
                                <Button onClick={openDoseDialogForNew} variant="link">Dodaj</Button>
                            </Col>
                        </Row>

                        <DoseDialog
                            visible={doseDialogOpen}
                            initialDose={doseUnderEdit}
                            isEdit={Boolean(props.doses.find(d => d.id === doseUnderEdit.id))}
                            onSave={handleSaveDose}
                            onCancel={() => setDoseDialogOpen(false)}
                        />

                        <Row>
                            <Col>
                                <DoseList
                                    doses={props.doses ?? []}
                                    onEdit={openDoseDialogForEdit}
                                    onRemove={handleRemoveDose}
                                />
                            </Col>
                        </Row>

                        <Row className="mt-4">
                            <Col
                                className="text-primary"
                                xs="auto"
                                onClick={() => setPurchasesExpanded(!purchasesExpanded)}
                                style={{ cursor: 'pointer' }}
                            >
                                Historia zakupów {purchasesExpanded ? '▲' : '▼'}
                            </Col>
                            <Col className="text-end">
                                <Button
                                    onClick={() => { setPurchaseDialogOpen(true); setDoseDialogOpen(false); }}
                                    variant="link"
                                >
                                    Dodaj
                                </Button>
                            </Col>
                        </Row>

                        <PurchaseDialog
                            visible={purchaseDialogOpen}
                            lastPurchase={lastPurchase}
                            onSubmit={handleAddPurchase}
                            onCancel={() => setPurchaseDialogOpen(false)}
                        />

                        <Collapse in={purchasesExpanded}>
                            <div>
                                <PurchaseList purchases={props.purchases ?? []} onRemove={handleRemovePurchase} />
                            </div>
                        </Collapse>
                    </>
                )}
            </Card.Body>
            {isOpen && (
                <Card.Footer>
                    <Row>
                        <Col></Col>
                        <Col xs="auto">
                            <FormCheck
                                type="switch"
                                id={`medicine-visibility-${props.id}`}
                                label="Widoczny"
                                checked={props.isVisible}
                                onChange={handleVisibilityChange}
                            />
                        </Col>
                        <Col xs="auto">
                            <Button onClick={handleRemoveMedicine} variant="outline-danger" size="sm">Usuń lek</Button>
                        </Col>
                    </Row>
                </Card.Footer>
            )}
        </Card>
    );
}
