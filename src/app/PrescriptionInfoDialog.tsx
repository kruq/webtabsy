import React from 'react';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Modal from 'react-bootstrap/Modal';
import Unit from '../models/Unit';
import {
    formatPrescriptionPackages,
    formatYmdForDisplay,
    groupPackages,
    PrescriptionEntry,
} from '../utils/prescriptionStatus';

interface PrescriptionInfoDialogProps {
    medicineName: string;
    entries: PrescriptionEntry[];
    unit: Unit;
    show: boolean;
    onClose: () => void;
}

/**
 * Okienko z etykiety „recepta” na karcie dawki: łącznie do wykupienia ze wszystkich ważnych recept na lek,
 * a pod spodem każda recepta osobno (data wystawienia, kod, opakowania, termin wykupu).
 */
export default function PrescriptionInfoDialog({ medicineName, entries, unit, show, onClose }: PrescriptionInfoDialogProps) {
    return (
        <Modal show={show} onHide={onClose} centered scrollable>
            <Modal.Body>
                <h6 className="fw-bold">{medicineName}</h6>
                <div className="mt-3">
                    <small className="text-secondary">Do wykupienia z recept</small>
                    <div>{formatPrescriptionPackages(groupPackages(entries), unit.abbreviation)}</div>
                </div>
                <ListGroup variant="flush" className="mt-3">
                    {entries.map((entry, index) => (
                        <ListGroup.Item key={`${entry.prescriptionId}-${index}`} className="px-0">
                            <div>
                                Recepta z {formatYmdForDisplay(entry.issueDate)}
                                <span className="text-secondary"> · {entry.code ? `kod ${entry.code}` : 'bez kodu'}</span>
                            </div>
                            <small className="text-secondary">
                                {formatPrescriptionPackages([{ packages: entry.packages, packageSize: entry.packageSize }], unit.abbreviation)}
                                {' '}· wykup do {formatYmdForDisplay(entry.deadline)}
                            </small>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>Zamknij</Button>
            </Modal.Footer>
        </Modal>
    );
}
