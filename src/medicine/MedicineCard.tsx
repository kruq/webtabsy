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
import { buildUnscheduledDoseLogEntry, withSavedDose } from '../app/doseActions';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import Dose from '../models/Dose';
import IMedicine from '../models/IMedicine';
import IPurchase from '../models/IPurchase';
import { tryAddDoseLogEntry } from '../services/doseLog.service';
import { getDateText, getDaysText } from '../text.helpers';
import { formatDate } from '../utils/dateFormat';
import { AMOUNT_HINT, formatAmount, formatAmountForDisplay, parseAmount, subtractAmount } from '../utils/fraction';
import { countAmountInCurrentPackage, forecastStock, StockForecast } from '../utils/medicineMath';
import { medicineCardElementId } from '../utils/scrollToMedicine';
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
    /** Tabletki, które można jeszcze wykupić z ważnych recept. */
    tabletsOnPrescriptions: number;
}


const newDoseTemplate = (): Dose => ({
    id: Uuid(),
    time: '',
    amount: 1,
    numberOfDays: 1,
    nextDoseDate: new Date(),
    endDate: null,
});

/** Dni, poniżej których zamiast daty pokazujemy opis dnia ("jutro", "środa"). */
const DESCRIPTIVE_DAYS = 7;

/**
 * Dwie komórki siatki: data i liczba dni (na czerwono, gdy zostaje mniej niż LOW_STOCK_THRESHOLD dni).
 * Gdy zapas starcza na cały plan dawkowania (wszystkie dawki mają datę końca), zamiast dni: "cały plan".
 * Bez prognozy - dwie puste komórki, żeby siatka się nie przesunęła.
 */
function ForecastCells({ forecast, descriptive }: { forecast: StockForecast | undefined; descriptive: boolean }) {
    if (!forecast) return <><small /><small /></>;
    const date = descriptive && forecast.days < DESCRIPTIVE_DAYS ? getDateText(forecast.lastDay) : formatDate(forecast.lastDay);
    const className = !forecast.coversWholePlan && forecast.days < LOW_STOCK_THRESHOLD ? 'text-danger' : '';
    return (
        <>
            <small className={`text-end ${className}`}>{date}</small>
            <small className={`text-end ${className}`}>{forecast.coversWholePlan ? 'cały plan' : getDaysText(forecast.days)}</small>
        </>
    );
}

export default function MedicineCard(props: IMedicineProps) {
    const isOpen = props.id === props.idOfMedicineDetails;
    const lastPurchase: IPurchase | undefined = props.purchases?.[props.purchases.length - 1];

    const [name, setName] = useState(props.name);
    const [count, setCount] = useState<number | undefined>(props.count);
    const [countText, setCountText] = useState<string>(formatAmount(props.count));
    const [countValid, setCountValid] = useState<boolean>(true);
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
        setCountValid(true);
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
        setCountValid(value !== undefined);
        // Przy niepoprawnym wpisie zachowujemy ostatnią prawidłową wartość zamiast jej czyścić.
        if (value !== undefined) {
            setCount(value);
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

    const handleAsNeededChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        props.updateMedicine(props.id, { asNeeded: e.target.checked });
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
        await props.updateMedicine(props.id, { doses: withSavedDose(props.doses, dose) });
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
        const takenAt = new Date();
        await props.updateMedicine(props.id, { count: newValue });
        await tryAddDoseLogEntry(buildUnscheduledDoseLogEntry(props, amount, takenAt));
    };

    const forecast = forecastStock(props);
    // Ta sama symulacja, tylko z zapasem powiększonym o tabletki, które można jeszcze wykupić z recept.
    const forecastWithPrescriptions = props.tabletsOnPrescriptions > 0
        ? forecastStock({ ...props, count: props.count + props.tabletsOnPrescriptions })
        : undefined;

    /**
     * Kliknięcie w dowolne miejsce karty zwija/rozwija ją - z wyjątkiem elementów interaktywnych
     * i rozwiniętej części z ustawieniami (oznaczonej data-no-toggle), żeby edycja nie zwijała karty.
     */
    const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
        const target = e.target as HTMLElement;
        if (target.closest('button, a, input, select, textarea, label, dialog, [data-no-toggle]')) return;
        props.medicineClick(props.id);
    };
    const tabsInPackage = countAmountInCurrentPackage(props);

    return (
        <Card id={medicineCardElementId(props.id)} className="my-2 medicine-card" onClick={handleCardClick}>
            <Card.Body>
                <Row className="align-items-center">
                    <Col>
                        <h6 className="mb-0">{props.name}</h6>
                    </Col>
                    <Col xs="auto">
                        <Button variant="link" size="sm" onClick={openTakeDoseDialog} aria-label="Take a dose">Weź lek</Button>
                    </Col>
                </Row>
                {/* Dwie grupy: tylko posiadane tabletki oraz posiadane razem z tymi do wykupienia z ważnych recept. */}
                {/* Cały wiersz w kolorze akcentu; czerwony nadpisuje go tylko jako ostrzeżenie. */}
                <div className="medicine-stock text-accent">
                    <small>Posiadane</small>
                    <small>
                        {tabsInPackage !== undefined && (
                            <span title="Tabletki w aktualnym opakowaniu">({formatAmountForDisplay(tabsInPackage)}) </span>
                        )}
                        <span className={props.count < LOW_STOCK_THRESHOLD ? 'text-danger' : ''}>
                            {formatAmountForDisplay(props.count)}
                        </span>
                    </small>
                    <ForecastCells forecast={forecast} descriptive />
                    {props.tabletsOnPrescriptions > 0 && (
                        <>
                            <small>Z receptami</small>
                            <small>{formatAmountForDisplay(props.count + props.tabletsOnPrescriptions)}</small>
                            <ForecastCells forecast={forecastWithPrescriptions} descriptive={false} />
                        </>
                    )}
                </div>

                <TakeDoseDialog
                    visible={takeDoseDialogOpen}
                    medicineName={props.name}
                    maxAmount={count ?? 0}
                    onSubmit={handleTakeDose}
                    onCancel={() => setTakeDoseDialogOpen(false)}
                />

                {isOpen && (
                    <div data-no-toggle className="medicine-card-details">
                        <Row className="mt-3 mb-1">
                            <Col className="text-accent" xs="auto">Ustawienia</Col>
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
                            display={formatAmountForDisplay(count)}
                        >
                            <>
                                <Form.Control
                                    type="text"
                                    inputMode="text"
                                    value={countText}
                                    isInvalid={!countValid}
                                    onChange={handleCountChange}
                                />
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
                            <Row>
                                <Col>
                                    <FormCheck
                                        type="switch"
                                        id={`medicine-as-needed-${props.id}`}
                                        label="Lek doraźny"
                                        checked={Boolean(props.asNeeded)}
                                        onChange={handleAsNeededChange}
                                    />
                                </Col>
                            </Row>
                        </Form.Group>

                        <Row className="mt-4">
                            <Col className="text-accent" xs="auto">Dawkowanie</Col>
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
                    </div>
                )}
            </Card.Body>
            {isOpen && (
                <Card.Footer data-no-toggle className="medicine-card-details">
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
