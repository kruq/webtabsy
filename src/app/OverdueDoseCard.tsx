import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Card from 'react-bootstrap/Card';
import Dropdown from 'react-bootstrap/Dropdown';
import { BsQuestionCircle } from 'react-icons/bs';
import TakeDoseDialog from '../medicine/TakeDoseDialog';
import IMedicine from '../models/IMedicine';
import OverdueDose from '../models/OverdueDoses';
import { formatAmountForDisplay } from '../utils/fraction';
import { countAmountInCurrentPackage, stockLevel, StockLevel } from '../utils/medicineMath';
import MedicineInfoDialog from './MedicineInfoDialog';
import { useUnits } from './UnitsContext';
import { amountWithUnit, nameWithAmount } from '../utils/units';

interface OverdueDoseCardProps {
    dose: OverdueDose;
    medicines: IMedicine[];
    onSkip: () => void;
    /** amount: ilość faktycznie przyjęta; undefined = domyślna ilość z dawki. */
    onConfirm: (amount?: number) => void;
    /** Przejście do karty leku na liście leków. */
    onOpenMedicine?: (medicineId: string) => void;
    /** Ustawienie profilu: pole z ilością w aktualnym opakowaniu; bez niego - tylko cały zapas. Domyślnie tak. */
    showCurrentPackage?: boolean;
}

/** Kolor „Masz …”: ponad 7 dni zielony, ponad 3 dni pomarańczowy, mniej i brak - czerwony. */
const STOCK_LEVEL_CLASS: Record<StockLevel, string> = {
    ok: 'text-success',
    low: 'text-orange',
    critical: 'text-danger',
    empty: 'text-danger',
};

export default function OverdueDoseCard({ dose, medicines, onSkip, onConfirm, onOpenMedicine, showCurrentPackage = true }: OverdueDoseCardProps) {
    const [customAmountDialogOpen, setCustomAmountDialogOpen] = useState(false);
    const [infoOpen, setInfoOpen] = useState(false);

    const medicine = medicines.find(m => m.name === dose.medicineName);
    const unit = useUnits().unitById(medicine?.unitId);
    // Lek z „Ignoruj kontrolę ilości”: bez ilości, zapasu i „Potwierdź inną ilość”.
    const ignoreQuantity = Boolean(medicine?.ignoreQuantity);
    const stock = medicine?.count ?? 0;
    const stockLow = !ignoreQuantity && stock < dose.amount;
    const label = nameWithAmount(dose.medicineName, ignoreQuantity ? undefined : dose.amount, unit);
    const inPackage = showCurrentPackage ? countAmountInCurrentPackage(medicine) : undefined;
    const levelClass = medicine ? STOCK_LEVEL_CLASS[stockLevel(medicine)] : '';
    const totalText = stock > 0 ? `Masz ${amountWithUnit(stock, unit)}` : `Brak ${unit.genitivePlural}`;

    const confirmButton = (
        <Button className="overdue-dose-confirm-main" disabled={stockLow || dose.disabled} onClick={() => onConfirm()}>
            Potwierdź
        </Button>
    );

    const handleCustomAmountSubmit = (amount: number) => {
        setCustomAmountDialogOpen(false);
        onConfirm(amount);
    };

    return (
        <>
        {/* Dwie linie: u góry nazwa leku i „? info”; na dole „Pomiń”, pola z ilością i „Potwierdź”.
            Przezroczystość dawek z godziny, która jeszcze nie nadeszła, ustawia cała grupa (OverdueDosesView). */}
        <Card className="my-2 overdue-dose-card">
            {/* Górna linia: nazwa leku, a po prawej „? info” (tylko gdy jest przyjmowanie z posiłkiem albo opis). */}
            <div className="d-flex align-items-center py-2 px-3 overdue-dose-top">
                <div className="flex-grow-1 overdue-dose-name">
                    {medicine && onOpenMedicine ? (
                        <Button
                            variant="link"
                            className="p-0 fw-bold text-start align-baseline"
                            title="Pokaż lek na liście leków"
                            onClick={() => onOpenMedicine(medicine.id)}
                        >
                            {label}
                        </Button>
                    ) : (
                        <strong>{label}</strong>
                    )}
                    {/* Przyjmowanie z posiłkiem obok nazwy - od tabletu; na telefonie tylko w „info”. */}
                    {dose.meal && <small className="text-secondary ms-3 d-none d-md-inline">{dose.meal}</small>}
                </div>
                {medicine && (medicine.meal || medicine.description) && (
                    <Button
                        variant="link"
                        className="p-0 ms-2 d-inline-flex align-items-center gap-1 text-nowrap"
                        aria-label="Informacje o leku"
                        onClick={() => setInfoOpen(true)}
                    >
                        <BsQuestionCircle /> <span>info</span>
                    </Button>
                )}
            </div>
            {/* Dolna linia: „Pomiń”, pola z ilością i „Potwierdź”, przyklejone do dolnej krawędzi karty; przyciski
                dzielą po równo miejsce obok pól z ilością. */}
            <div className="d-flex overdue-dose-actions">
                <Button
                    variant="outline-secondary"
                    className="overdue-dose-skip"
                    disabled={dose.disabled}
                    onClick={onSkip}
                >
                    Pomiń
                </Button>
                {/* Pola z ilością (w jednym bloku - od tabletu zajmuje 1/3 dolnego wiersza):
                    - profil bez opakowania: jedno pole „Masz 70 tab.” / „Brak tabletek”;
                    - z opakowaniem: „W opak. 14 tab.” i „Wszystkich 70 tab.”, na telefonie same liczby;
                    - bez aktualnego opakowania: jedno połączone pole, na telefonie sama liczba;
                    - lek bez kontroli ilości: „-”.
                    Kolor wg tego, na ile dni starcza zapas: zielony / pomarańczowy / czerwony. */}
                <div className={`overdue-dose-stock-area${!showCurrentPackage ? ' overdue-dose-stock-area-summary' : ''}`}>
                    {ignoreQuantity || !medicine ? (
                        <div className="overdue-dose-stock" title="Razem">-</div>
                    ) : !showCurrentPackage ? (
                        <div className={`overdue-dose-stock ${levelClass}`} title="Razem">{totalText}</div>
                    ) : inPackage !== undefined ? (
                        <>
                            <div className={`overdue-dose-stock ${levelClass}`} title="W aktualnym opakowaniu">
                                <span className="d-md-none">{formatAmountForDisplay(inPackage)}</span>
                                <span className="d-none d-md-inline">W opak. {amountWithUnit(inPackage, unit)}</span>
                            </div>
                            {/* Obok opakowania całość to „Wszystkich 70 tab.” (pole z opakowaniem jest tylko przy zapasie > 0). */}
                            <div className={`overdue-dose-stock ${levelClass}`} title="Razem">
                                <span className="d-md-none">{formatAmountForDisplay(stock)}</span>
                                <span className="d-none d-md-inline">Wszystkich {amountWithUnit(stock, unit)}</span>
                            </div>
                        </>
                    ) : (
                        <div className={`overdue-dose-stock ${levelClass}`} title="Razem">
                            <span className="d-md-none">{formatAmountForDisplay(stock)}</span>
                            <span className="d-none d-md-inline">{totalText}</span>
                        </div>
                    )}
                </div>
                {ignoreQuantity ? (
                    <ButtonGroup className="overdue-dose-confirm">{confirmButton}</ButtonGroup>
                ) : (
                    <Dropdown as={ButtonGroup} align="start" className="overdue-dose-confirm">
                        {/* Strzałka „inna ilość” po lewej stronie „Potwierdź”. Mniejszą dawkę da się przyjąć nawet wtedy,
                            gdy zapas nie starcza na domyślną. */}
                        <Dropdown.Toggle split disabled={stock <= 0 || dose.disabled} aria-label="Inna ilość" />
                        {confirmButton}
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={() => setCustomAmountDialogOpen(true)}>
                                Potwierdź inną ilość…
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                )}
            </div>
        </Card>
            {/* Okienko ilości przeniesione do <body> - nie dziedziczy przezroczystości grupy dawek. */}
            {createPortal(
                <TakeDoseDialog
                    visible={customAmountDialogOpen}
                    medicineName={dose.medicineName}
                    maxAmount={stock}
                    initialAmount={dose.amount}
                    unit={unit}
                    onSubmit={handleCustomAmountSubmit}
                    onCancel={() => setCustomAmountDialogOpen(false)}
                />,
                document.body,
            )}
            {medicine && <MedicineInfoDialog medicine={medicine} show={infoOpen} onClose={() => setInfoOpen(false)} />}
        </>
    );
}
