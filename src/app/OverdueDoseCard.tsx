import React, { useState } from 'react';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Card from 'react-bootstrap/Card';
import Dropdown from 'react-bootstrap/Dropdown';
import { TfiCheck, TfiClose } from 'react-icons/tfi';
import TakeDoseDialog from '../medicine/TakeDoseDialog';
import IMedicine from '../models/IMedicine';
import OverdueDose from '../models/OverdueDoses';
import { formatAmountForDisplay } from '../utils/fraction';
import { countAmountInCurrentPackage } from '../utils/medicineMath';

interface OverdueDoseCardProps {
    dose: OverdueDose;
    medicines: IMedicine[];
    onSkip: () => void;
    /** amount: ilość faktycznie przyjęta; undefined = domyślna ilość z dawki. */
    onConfirm: (amount?: number) => void;
    /** Przejście do karty leku na liście leków. */
    onOpenMedicine?: (medicineId: string) => void;
}

export default function OverdueDoseCard({ dose, medicines, onSkip, onConfirm, onOpenMedicine }: OverdueDoseCardProps) {
    const [customAmountDialogOpen, setCustomAmountDialogOpen] = useState(false);

    const medicine = medicines.find(m => m.name === dose.medicineName);
    const stock = medicine?.count ?? 0;
    const stockLow = stock < dose.amount;
    const inPackage = countAmountInCurrentPackage(medicine);

    const handleCustomAmountSubmit = (amount: number) => {
        setCustomAmountDialogOpen(false);
        onConfirm(amount);
    };

    return (
        // Przyciski „Pomiń” i „Potwierdź” są przyklejone do lewej i prawej krawędzi karty, na całą jej wysokość
        // (jak „X” przy polu wyszukiwania leków). Zaokrąglenia przycisków pasują do wnętrza karty.
        <Card
            className="my-2 d-flex flex-row align-items-stretch overdue-dose-card"
            style={{ backgroundColor: dose.todaysDate > new Date() ? '#eceff1' : 'white' }}
        >
            <Button
                variant="outline-secondary"
                className="overdue-dose-skip"
                disabled={dose.disabled}
                onClick={onSkip}
            >
                <TfiClose /> <span className="d-none d-md-inline">Pomiń</span>
            </Button>
            {/* Od szerokości tabletu (md) sposób przyjmowania stoi obok leku; na mniejszych ekranach pod nim, a jego
                linia jest zawsze zajęta (pusta, gdy brak informacji) - wszystkie karty mają tę samą wysokość. */}
            <Card.Body className="d-flex flex-column flex-md-row align-items-md-baseline justify-content-center justify-content-md-start py-2">
                <div>
                    {medicine && onOpenMedicine ? (
                        <Button
                            variant="link"
                            className="p-0 fw-bold text-start align-baseline"
                            title="Pokaż lek na liście leków"
                            onClick={() => onOpenMedicine(medicine.id)}
                        >
                            {formatAmountForDisplay(dose.amount)} x {dose.medicineName}
                        </Button>
                    ) : (
                        <strong>{formatAmountForDisplay(dose.amount)} x {dose.medicineName}</strong>
                    )}{' '}
                    <small style={{ verticalAlign: 'top', marginLeft: '5px' }}>
                        <Badge bg={stockLow ? 'danger' : 'secondary'} pill>
                            {formatAmountForDisplay(stock)}{inPackage !== undefined ? ` (${formatAmountForDisplay(inPackage)})` : ''}
                        </Badge>
                    </small>
                </div>
                {/* ms-md-3: odstęp od leku tylko wtedy, gdy stoi obok niego (od md). */}
                <div className="ms-md-3">
                    <small className="text-secondary">{dose.meal || '\u00a0'}</small>
                </div>
                <TakeDoseDialog
                    visible={customAmountDialogOpen}
                    medicineName={dose.medicineName}
                    maxAmount={stock}
                    initialAmount={dose.amount}
                    onSubmit={handleCustomAmountSubmit}
                    onCancel={() => setCustomAmountDialogOpen(false)}
                />
            </Card.Body>
            <Dropdown as={ButtonGroup} align="end" className="overdue-dose-confirm">
                <Button disabled={stockLow || dose.disabled} onClick={() => onConfirm()}>
                    <TfiCheck /> <span className="d-none d-md-inline">Potwierdź</span>
                </Button>
                {/* Mniejszą dawkę da się przyjąć nawet wtedy, gdy zapas nie starcza na domyślną. */}
                <Dropdown.Toggle split disabled={stock <= 0 || dose.disabled} aria-label="Inna ilość" />
                <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setCustomAmountDialogOpen(true)}>
                        Potwierdź inną ilość…
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        </Card>
    );
}
