import React from 'react';
import Alert from 'react-bootstrap/Alert';
import { BsFileEarmarkMedical } from 'react-icons/bs';
import { getDaysText } from '../text.helpers';
import { formatYmdForDisplay, PurchaseDeadline } from '../utils/prescriptionStatus';

interface PurchaseDeadlinesPanelProps {
    deadlines: PurchaseDeadline[];
}

/** Do tylu dni włącznie ostrzeżenie jest czerwone zamiast żółtego. */
const URGENT_DAYS = 7;

function daysLeftText(daysLeft: number): string {
    if (daysLeft === 0) return 'dziś ostatni dzień';
    if (daysLeft === 1) return 'jutro ostatni dzień';
    return `zostało ${getDaysText(daysLeft)}`;
}

export default function PurchaseDeadlinesPanel({ deadlines }: PurchaseDeadlinesPanelProps) {
    if (deadlines.length === 0) return null;
    const urgent = deadlines.some(d => d.daysLeft <= URGENT_DAYS);

    return (
        <Alert variant={urgent ? 'danger' : 'warning'} className="py-2">
            <div className="mb-1">
                <BsFileEarmarkMedical style={{ verticalAlign: '-2px' }} /> <strong>Leki do wykupienia z recept</strong>
            </div>
            {deadlines.map(d => (
                <div key={`${d.prescriptionId}-${d.itemId}`}>
                    <small>
                        <strong>{d.medicineName}</strong>
                        {d.started ? ` (zostało ${d.remainingPackages} op.)` : ''}
                        {' '}— wykup do {formatYmdForDisplay(d.deadline)}
                        <span className={d.daysLeft <= URGENT_DAYS ? 'text-danger fw-bold' : ''}>, {daysLeftText(d.daysLeft)}</span>
                        {!d.started && <span className="text-secondary">, potem recepta na ten lek wygaśnie</span>}
                    </small>
                </div>
            ))}
        </Alert>
    );
}
