import React from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import { BsExclamationTriangle } from 'react-icons/bs';
import IMedicine from '../models/IMedicine';
import { getDaysText } from '../text.helpers';
import { lowStockMedicines, LowStockMedicine } from '../utils/lowStock';
import { PrescriptionEntry, prescriptionSummary } from '../utils/prescriptionStatus';
import { amountWithUnit } from '../utils/units';
import { useUnits } from './UnitsContext';

interface LowStockPanelProps {
    medicines: IMedicine[];
    /** Pozycje ważnych recept per id leku. */
    prescriptionEntries: Map<string, PrescriptionEntry[]>;
    /** Przejście do listy recept. */
    onOpenPrescriptions: () => void;
}

function daysText(days: number): string {
    return days === 0 ? 'wystarczy na dziś' : `wystarczy na ${getDaysText(days)}`;
}

/**
 * Kończące się leki (całość zapasu, nie opakowanie), wg tych samych progów co kolory pól z ilością na karcie dawki,
 * plus leki doraźne (mniej niż 7 sztuk) i leki bez kontroli ilości oznaczone „Kończy się”. Pod lekiem - recepty na
 * niego zebrane w jedną informację (link do listy recept) albo „Brak recepty”.
 */
export default function LowStockPanel({ medicines, prescriptionEntries, onOpenPrescriptions }: LowStockPanelProps) {
    const { unitById } = useUnits();
    const items = lowStockMedicines(medicines);
    if (items.length === 0) return null;
    const urgent = items.some(i => i.level !== 'low');

    const stockText = ({ medicine, days }: LowStockMedicine): string => {
        const unit = unitById(medicine.unitId);
        if (medicine.ignoreQuantity) return 'kończy się';
        if (medicine.count <= 0) return `brak ${unit.genitivePlural}`;
        const left = `zostało ${amountWithUnit(medicine.count, unit)}`;
        return days === undefined ? left : `${left}, ${daysText(days)}`;
    };

    return (
        <Alert variant={urgent ? 'danger' : 'warning'} className="py-2">
            <div className="mb-1">
                <BsExclamationTriangle style={{ verticalAlign: '-2px' }} /> <strong>Kończące się leki</strong>
            </div>
            {items.map(item => {
                const entries = prescriptionEntries.get(item.medicine.id) ?? [];
                return (
                    <div key={item.medicine.id} className="mb-1">
                        <small>
                            <strong>{item.medicine.name}</strong> — {stockText(item)}
                            <div className="ms-3">
                                {entries.length > 0 ? (
                                    // Przycisk-link do lewej; przycisk Bootstrapa ma własny rozmiar (1rem) - <small> wyrównuje go do wiersza.
                                    <Button variant="link" className="alert-link p-0 border-0 align-baseline text-start" onClick={onOpenPrescriptions}>
                                        <small>{prescriptionSummary(entries, unitById(item.medicine.unitId).abbreviation)}</small>
                                    </Button>
                                ) : (
                                    'Brak recepty'
                                )}
                            </div>
                        </small>
                    </div>
                );
            })}
        </Alert>
    );
}
