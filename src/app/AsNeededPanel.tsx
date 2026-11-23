import React, { useState } from 'react';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Collapse from 'react-bootstrap/Collapse';
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

/** Leki doraźne z zapasem większym od zera, alfabetycznie po nazwie. */
export function selectAsNeededMedicines(medicines: IMedicine[]): IMedicine[] {
    return medicines
        .filter(m => m.asNeeded && m.count > 0)
        .sort((a, b) => a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' }));
}

export default function AsNeededPanel({ medicines, onTake }: AsNeededPanelProps) {
    const { unitById } = useUnits();
    const [expanded, setExpanded] = useState(false);
    // Trzymamy id, nie obiekt - po synchronizacji okno ma widzieć aktualny stan leku.
    const [idToTake, setIdToTake] = useState<string | undefined>(undefined);

    const asNeeded = selectAsNeededMedicines(medicines);
    const medicineToTake = medicines.find(m => m.id === idToTake);
    if (asNeeded.length === 0) return null;

    const handleSubmit = async (amount: number) => {
        const medicine = medicineToTake;
        setIdToTake(undefined);
        if (medicine) await onTake(medicine, amount);
    };

    return (
        <div className="mb-2 border rounded bg-white">
            <Button
                variant="light"
                size="sm"
                className="w-100 d-flex justify-content-between align-items-center"
                onClick={() => setExpanded(prev => !prev)}
                aria-expanded={expanded}
                aria-controls="as-needed-list"
            >
                <span>Leki doraźne ({asNeeded.length})</span>
                <span>{expanded ? '▼' : '▲'}</span>
            </Button>
            <Collapse in={expanded}>
                <div id="as-needed-list">
                    {/* Lista może być długa - przewija się w panelu, zamiast zasłaniać cały ekran. */}
                    <div className="px-2" style={{ maxHeight: '40vh', overflowY: 'auto' }}>
                        {asNeeded.map(medicine => (
                            <Row key={medicine.id} className="align-items-center py-1 border-top">
                                <Col>
                                    <strong>{medicine.name}</strong>
                                    <small style={{ verticalAlign: 'top', marginLeft: '5px' }}>
                                        <Badge bg="secondary" pill>{amountWithUnit(medicine.count, unitById(medicine.unitId))}</Badge>
                                    </small>
                                </Col>
                                <Col xs="auto">
                                    <Button size="sm" className="py-0 px-2" onClick={() => setIdToTake(medicine.id)}>
                                        <TfiCheck /> <span className="d-none d-md-inline">Potwierdź</span>
                                    </Button>
                                </Col>
                            </Row>
                        ))}
                    </div>
                </div>
            </Collapse>
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
