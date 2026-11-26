import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import IMedicine from '../models/IMedicine';

interface MedicineInfoDialogProps {
    medicine: Pick<IMedicine, 'name' | 'meal' | 'description'>;
    show: boolean;
    onClose: () => void;
}

/**
 * Małe okienko ze Statusu: nazwa leku, przyjmowanie z posiłkiem i opis (pominięte, gdy puste).
 * Długi tekst przewija się w pionie; jedyny przycisk to „Zamknij”.
 */
export default function MedicineInfoDialog({ medicine, show, onClose }: MedicineInfoDialogProps) {
    return (
        <Modal show={show} onHide={onClose} size="sm" centered scrollable>
            <Modal.Body>
                <h6 className="fw-bold">{medicine.name}</h6>
                {medicine.meal && (
                    <div className="mt-3">
                        <small className="text-secondary">Przyjmowanie z posiłkiem</small>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{medicine.meal}</div>
                    </div>
                )}
                {medicine.description && (
                    <div className="mt-3">
                        <small className="text-secondary">Opis</small>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{medicine.description}</div>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>Zamknij</Button>
            </Modal.Footer>
        </Modal>
    );
}
