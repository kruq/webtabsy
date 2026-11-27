import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import Modal from 'react-bootstrap/Modal';
import Prescription, { Doctor, Specialization } from '../models/Prescription';
import SpecializationSelect from './SpecializationSelect';
import { prescriptionsOfDoctor } from '../utils/prescriptionStatus';

interface DoctorsDialogProps {
    show: boolean;
    doctors: Doctor[];
    specializations: Specialization[];
    prescriptions: Prescription[];
    onAdd: (doctor: Omit<Doctor, 'id'>) => Promise<Doctor>;
    onAddSpecialization: (name: string) => Promise<Specialization>;
    onDelete: (id: string) => Promise<void>;
    onClose: () => void;
}

const byName = (a: Doctor, b: Doctor) => a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' });

/**
 * Lista lekarzy z zakładki Recepty. „Usuń” działa tylko dla lekarza bez recept; przy lekarzu z receptami jest
 * wyszarzony, a podpowiedź (title na otaczającym spanie - wyłączony przycisk nie reaguje na mysz) podaje liczbę recept.
 * „Dodaj lekarza” otwiera ten sam formularz co „+ Dodaj nowego…” w recepcie (nazwa i specjalizacja).
 */
export default function DoctorsDialog({ show, doctors, specializations, prescriptions, onAdd, onAddSpecialization, onDelete, onClose }: DoctorsDialogProps) {
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [saving, setSaving] = useState(false);

    // Każde otwarcie okienka zaczyna od zamkniętego, pustego formularza.
    useEffect(() => {
        if (!show) return;
        setAdding(false);
        setName('');
        setSpecialization('');
    }, [show]);

    // API przy tej samej nazwie (bez wielkości liter i spacji na końcach) zwróciłoby istniejącego lekarza - blokujemy wcześniej.
    const nameTaken = doctors.some(d => d.name.trim().toLocaleLowerCase('pl') === name.trim().toLocaleLowerCase('pl'));
    const canAdd = name.trim().length > 0 && !nameTaken && !saving;

    const handleAdd = async () => {
        if (!canAdd) return;
        setSaving(true);
        try {
            await onAdd({ name: name.trim(), specialization: specialization || null });
            setAdding(false);
            setName('');
            setSpecialization('');
        } catch (e) {
            console.error(e);
            alert('Nie udało się dodać lekarza');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (doctor: Doctor) => {
        if (!window.confirm(`Czy chcesz usunąć lekarza ${doctor.name}?`)) return;
        try {
            await onDelete(doctor.id);
        } catch (e) {
            console.error(e);
            alert('Nie udało się usunąć lekarza');
        }
    };

    return (
        <Modal show={show} onHide={onClose} centered scrollable>
            <Modal.Header closeButton>
                <Modal.Title as="h5">Lekarze</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {adding ? (
                    <div className="border rounded p-2 mb-3">
                        <Form.Control
                            className="mb-2"
                            type="text"
                            placeholder="Imię i nazwisko"
                            value={name}
                            autoFocus
                            isInvalid={nameTaken}
                            onChange={e => setName(e.target.value)}
                        />
                        <Form.Control.Feedback type="invalid" className="mb-2">Lekarz o tej nazwie już istnieje</Form.Control.Feedback>
                        <SpecializationSelect
                            className="mb-2"
                            value={specialization}
                            onChange={setSpecialization}
                            specializations={specializations}
                            onAdd={onAddSpecialization}
                            emptyLabel="— specjalizacja: brak —"
                        />
                        <div className="text-end">
                            <Button size="sm" onClick={handleAdd} disabled={!canAdd}>Dodaj</Button>
                            <Button size="sm" variant="outline-secondary" className="ms-2" onClick={() => setAdding(false)}>Anuluj</Button>
                        </div>
                    </div>
                ) : (
                    <Button size="sm" className="mb-3" onClick={() => setAdding(true)}>Dodaj lekarza</Button>
                )}
                {doctors.length === 0 && <div className="text-secondary">Brak lekarzy</div>}
                <ListGroup variant="flush">
                    {[...doctors].sort(byName).map(doctor => {
                        const count = prescriptionsOfDoctor(prescriptions, doctor.name);
                        const hint = count > 0 ? `Lekarz ma recepty (${count})` : undefined;
                        return (
                            <ListGroup.Item key={doctor.id} className="d-flex align-items-center px-0">
                                <div className="flex-grow-1">
                                    <div>{doctor.name}</div>
                                    {doctor.specialization && <small className="text-secondary">{doctor.specialization}</small>}
                                </div>
                                <span title={hint} className="d-inline-block ms-2">
                                    <Button
                                        size="sm"
                                        variant="outline-danger"
                                        disabled={count > 0}
                                        aria-label={hint ? `Usuń - ${hint}` : `Usuń lekarza ${doctor.name}`}
                                        onClick={() => handleDelete(doctor)}
                                    >
                                        Usuń
                                    </Button>
                                </span>
                            </ListGroup.Item>
                        );
                    })}
                </ListGroup>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>Zamknij</Button>
            </Modal.Footer>
        </Modal>
    );
}
