import React, { useState } from 'react';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import { TfiCheck } from 'react-icons/tfi';
import TakeDoseDialog from '../medicine/TakeDoseDialog';
import IMedicine from '../models/IMedicine';
import { useUnits } from './UnitsContext';
import { amountWithUnit } from '../utils/units';

interface AsNeededPanelProps {
    medicines: IMedicine[];
    onTake: (medicine: IMedicine, amount: number) => Promise<void> | void;
}

/** Leki doraźne z zapasem większym od zera, alfabetycznie po nazwie (bez leków z „Ignoruj kontrolę ilości”). */
export function selectAsNeededMedicines(medicines: IMedicine[]): IMedicine[] {
    return medicines
        .filter(m => m.asNeeded && !m.ignoreQuantity && m.count > 0)
        .sort((a, b) => a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' }));
}

/**
 * Przycisk „Potwierdź lek doraźny” (po prawej, nad dolnym menu, wielkości „Potwierdź” na karcie dawki) otwierający okienko z listą leków doraźnych.
 * „Potwierdź” przy leku zamyka listę i pyta o ilość. Przycisk jest tylko wtedy, gdy istnieje jakiś lek doraźny;
 * bez leków doraźnych z zapasem jest wyszarzony.
 */
export default function AsNeededPanel({ medicines, onTake }: AsNeededPanelProps) {
    const { unitById } = useUnits();
    const [listOpen, setListOpen] = useState(false);
    // Trzymamy id, nie obiekt - po synchronizacji okno ma widzieć aktualny stan leku.
    const [idToTake, setIdToTake] = useState<string | undefined>(undefined);

    const asNeeded = selectAsNeededMedicines(medicines);
    const medicineToTake = medicines.find(m => m.id === idToTake);
    // Bez żadnego leku doraźnego przycisku nie ma; gdy są, ale bez zapasu - jest wyszarzony.
    if (!medicines.some(m => m.asNeeded && !m.ignoreQuantity)) return null;

    const chooseMedicine = (id: string) => {
        setListOpen(false);
        setIdToTake(id);
    };

    const handleSubmit = async (amount: number) => {
        const medicine = medicineToTake;
        setIdToTake(undefined);
        if (medicine) await onTake(medicine, amount);
    };

    return (
        <div className="mb-2">
            {/* text-end tylko wokół przycisku - okienko ilości (dialog) nie może dziedziczyć wyrównania. */}
            <div className="text-end">
                <Button variant="primary" disabled={asNeeded.length === 0} onClick={() => setListOpen(true)}>
                    Potwierdź lek doraźny
                </Button>
            </div>
            <Modal show={listOpen} onHide={() => setListOpen(false)} scrollable>
                <Modal.Header closeButton>
                    <Modal.Title as="h5">Leki doraźne</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {asNeeded.map(medicine => (
                        <Row key={medicine.id} className="align-items-center py-1 border-bottom">
                            <Col>
                                <strong>{medicine.name}</strong>
                                <small style={{ verticalAlign: 'top', marginLeft: '5px' }}>
                                    <Badge bg="secondary" pill>{amountWithUnit(medicine.count, unitById(medicine.unitId))}</Badge>
                                </small>
                            </Col>
                            <Col xs="auto">
                                <Button size="sm" onClick={() => chooseMedicine(medicine.id)}>
                                    <TfiCheck /> Potwierdź
                                </Button>
                            </Col>
                        </Row>
                    ))}
                </Modal.Body>
            </Modal>
            <TakeDoseDialog
                visible={medicineToTake !== undefined}
                medicineName={medicineToTake?.name ?? ''}
                maxAmount={medicineToTake?.count ?? 0}
                unit={unitById(medicineToTake?.unitId)}
                onSubmit={handleSubmit}
                onCancel={() => setIdToTake(undefined)}
            />
        </div>
    );
}
