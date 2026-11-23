import React, { useEffect, useState } from 'react';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import { v4 as Uuid } from 'uuid';
import IMedicine from '../models/IMedicine';
import Prescription, { Doctor, PrescriptionValidity, Specialization } from '../models/Prescription';
import {
    expiryDate,
    formatYmdForDisplay,
    ITEM_STATUS_LABELS,
    itemStatus,
    remainingPackages,
    STATUS_VARIANTS,
    todayYmd,
    VALIDITY_LABELS,
} from '../utils/prescriptionStatus';
import { DraftPrescriptionItem } from './prescriptionDraft';
import { useUnits } from './UnitsContext';
import { capitalize, packageSizeSuffix } from '../utils/units';

export interface PrescriptionDraft extends Omit<Prescription, 'items'> {
    items: DraftPrescriptionItem[];
}

interface PrescriptionDialogProps {
    /** undefined = dialog zamknięty. */
    initial: Prescription | undefined;
    medicines: IMedicine[];
    specializations: Specialization[];
    doctors: Doctor[];
    onSave: (draft: PrescriptionDraft) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onAddSpecialization: (name: string) => Promise<Specialization>;
    onAddDoctor: (doctor: Omit<Doctor, 'id'>) => Promise<Doctor>;
    onClose: () => void;
}

const NEW_MEDICINE = '__new__';
const NEW_SPECIALIZATION = '__new__';
const NEW_DOCTOR = '__new__';

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' });
const CODE_PATTERN = /^\d{4}$/;

export function emptyPrescription(): Prescription {
    return { id: '', issueDate: todayYmd(), validity: '30days', code: '', doctor: '', specialization: '', note: '', items: [] };
}

function parsePositiveInt(text: string): number | undefined {
    return /^\d+$/.test(text.trim()) && parseInt(text, 10) > 0 ? parseInt(text, 10) : undefined;
}

interface NewItemForm {
    medicineChoice: string;
    newMedicineName: string;
    packages: string;
    packageSize: string;
    newMedicineIgnoreQuantity: boolean;
}

const EMPTY_ITEM_FORM: NewItemForm = { medicineChoice: '', newMedicineName: '', packages: '1', packageSize: '', newMedicineIgnoreQuantity: false };

export default function PrescriptionDialog({
    initial,
    medicines,
    specializations,
    doctors,
    onSave,
    onDelete,
    onAddSpecialization,
    onAddDoctor,
    onClose,
}: PrescriptionDialogProps) {
    const { unitOfMedicine } = useUnits();
    const [draft, setDraft] = useState<PrescriptionDraft>(emptyPrescription());
    const [itemForm, setItemForm] = useState<NewItemForm>(EMPTY_ITEM_FORM);
    const [addingSpecialization, setAddingSpecialization] = useState(false);
    const [newSpecialization, setNewSpecialization] = useState('');
    const [addingDoctor, setAddingDoctor] = useState(false);
    const [newDoctorName, setNewDoctorName] = useState('');
    const [newDoctorSpecialization, setNewDoctorSpecialization] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!initial) return;
        setDraft({ ...initial, items: initial.items.map(i => ({ ...i })) });
        setItemForm(EMPTY_ITEM_FORM);
        setAddingSpecialization(false);
        setNewSpecialization('');
        setAddingDoctor(false);
        setNewDoctorName('');
        setNewDoctorSpecialization('');
    }, [initial]);

    const update = (params: Partial<PrescriptionDraft>) => setDraft(prev => ({ ...prev, ...params }));

    const sortedMedicines = [...medicines].sort((a, b) => a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' }));
    const sortedSpecializations = [...specializations].sort(byName);
    const sortedDoctors = [...doctors].sort(byName);

    // Walidacja nowej pozycji.
    const isNewMedicine = itemForm.medicineChoice === NEW_MEDICINE;
    const packages = parsePositiveInt(itemForm.packages);
    // Lek z „Ignoruj kontrolę ilości” ma na recepcie tylko opakowania - rozmiar opakowania zapisujemy jako 0.
    const chosenIgnoresQuantity = isNewMedicine
        ? itemForm.newMedicineIgnoreQuantity
        : Boolean(medicines.find(m => m.id === itemForm.medicineChoice)?.ignoreQuantity);
    const packageSize = chosenIgnoresQuantity ? 0 : parsePositiveInt(itemForm.packageSize);
    const medicineChosen = isNewMedicine ? itemForm.newMedicineName.trim().length > 0 : itemForm.medicineChoice !== '';
    const itemValid = medicineChosen && packages !== undefined && packageSize !== undefined;

    const addItem = () => {
        if (!itemValid) return;
        const existing = medicines.find(m => m.id === itemForm.medicineChoice);
        const item: DraftPrescriptionItem = {
            id: Uuid(),
            medicineId: isNewMedicine ? '' : itemForm.medicineChoice,
            medicineName: isNewMedicine ? itemForm.newMedicineName.trim() : existing?.name ?? '',
            packages: packages as number,
            packageSize: packageSize as number,
            purchasedPackages: 0,
            newMedicineName: isNewMedicine ? itemForm.newMedicineName.trim() : undefined,
            newMedicineIgnoreQuantity: isNewMedicine ? itemForm.newMedicineIgnoreQuantity : undefined,
        };
        update({ items: [...draft.items, item] });
        setItemForm(EMPTY_ITEM_FORM);
    };

    const removeItem = (id: string) => update({ items: draft.items.filter(i => i.id !== id) });

    /** Wybór lekarza wpisuje jego specjalizację; bez specjalizacji w słowniku zostawiamy bieżącą. */
    const chooseDoctor = (doctor: Doctor) => {
        update({ doctor: doctor.name, ...(doctor.specialization ? { specialization: doctor.specialization } : {}) });
    };

    const handleDoctorChoice = (value: string) => {
        if (value === NEW_DOCTOR) {
            setNewDoctorSpecialization(draft.specialization);
            setAddingDoctor(true);
            return;
        }
        const doctor = doctors.find(d => d.name === value);
        if (doctor) chooseDoctor(doctor);
        else update({ doctor: '' });
    };

    const saveNewDoctor = async () => {
        const name = newDoctorName.trim();
        if (!name) return;
        try {
            const created = await onAddDoctor({ name, specialization: newDoctorSpecialization || null });
            chooseDoctor(created);
            setAddingDoctor(false);
            setNewDoctorName('');
        } catch (e) {
            console.error(e);
            alert('Nie udało się dodać lekarza');
        }
    };

    const handleSpecializationChoice = (value: string) => {
        if (value === NEW_SPECIALIZATION) {
            setAddingSpecialization(true);
            return;
        }
        update({ specialization: value });
    };

    const saveNewSpecialization = async () => {
        const name = newSpecialization.trim();
        if (!name) return;
        try {
            const created = await onAddSpecialization(name);
            update({ specialization: created.name });
            setAddingSpecialization(false);
            setNewSpecialization('');
        } catch (e) {
            console.error(e);
            alert('Nie udało się dodać specjalizacji');
        }
    };

    const codeValid = draft.code === '' || CODE_PATTERN.test(draft.code);
    const formValid = codeValid && draft.issueDate !== '';

    const handleSave = async () => {
        if (!formValid) return;
        if (itemForm.medicineChoice !== '' && !window.confirm('Pozycja w formularzu "Dodaj lek" nie została dodana. Zapisać receptę bez niej?')) {
            return;
        }
        setSaving(true);
        try {
            await onSave(draft);
        } catch (e) {
            console.error(e);
            alert('Nie udało się zapisać recepty');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Czy chcesz usunąć receptę?')) return;
        try {
            await onDelete(draft.id);
        } catch (e) {
            console.error(e);
            alert('Nie udało się usunąć recepty');
        }
    };

    return (
        <Modal show={initial !== undefined} onHide={onClose} fullscreen="sm-down" scrollable>
            <Modal.Header closeButton>
                <Modal.Title as="h5">{draft.id ? 'Edytuj receptę' : 'Nowa recepta'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={e => e.preventDefault()}>
                    <Row className="mb-2">
                        <Form.Group as={Col} xs={6}>
                            <Form.Label>Data wystawienia</Form.Label>
                            <Form.Control
                                type="date"
                                value={draft.issueDate}
                                isInvalid={draft.issueDate === ''}
                                onChange={e => update({ issueDate: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group as={Col} xs={6}>
                            <Form.Label>Ważność</Form.Label>
                            <Form.Select
                                value={draft.validity}
                                onChange={e => update({ validity: e.target.value as PrescriptionValidity })}
                            >
                                <option value="30days">{VALIDITY_LABELS['30days']}</option>
                                <option value="annual">{VALIDITY_LABELS.annual}</option>
                            </Form.Select>
                            {draft.issueDate && (
                                <Form.Text className="text-secondary">ważna do {formatYmdForDisplay(expiryDate(draft))}</Form.Text>
                            )}
                        </Form.Group>
                    </Row>
                    <Row className="mb-2">
                        <Form.Group as={Col} xs={4}>
                            <Form.Label>Kod</Form.Label>
                            <Form.Control
                                type="text"
                                inputMode="numeric"
                                maxLength={4}
                                placeholder="0000"
                                value={draft.code}
                                isInvalid={!codeValid}
                                onChange={e => update({ code: e.target.value.trim() })}
                            />
                            <Form.Control.Feedback type="invalid">4 cyfry</Form.Control.Feedback>
                        </Form.Group>
                    </Row>
                    <Form.Group className="mb-2">
                        <Form.Label>Lekarz</Form.Label>
                        {addingDoctor ? (
                            <div className="border rounded p-2">
                                <Form.Control
                                    className="mb-2"
                                    type="text"
                                    placeholder="Imię i nazwisko"
                                    value={newDoctorName}
                                    autoFocus
                                    onChange={e => setNewDoctorName(e.target.value)}
                                />
                                <Form.Select
                                    className="mb-2"
                                    value={newDoctorSpecialization}
                                    onChange={e => setNewDoctorSpecialization(e.target.value)}
                                >
                                    <option value="">— specjalizacja: brak —</option>
                                    {sortedSpecializations.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </Form.Select>
                                <div className="text-end">
                                    <Button size="sm" onClick={saveNewDoctor} disabled={!newDoctorName.trim()}>Dodaj</Button>
                                    <Button size="sm" variant="outline-secondary" className="ms-2" onClick={() => setAddingDoctor(false)}>
                                        Anuluj
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Form.Select value={draft.doctor} onChange={e => handleDoctorChoice(e.target.value)}>
                                <option value="">— brak —</option>
                                {sortedDoctors.map(d => (
                                    <option key={d.id} value={d.name}>
                                        {d.name}{d.specialization ? ` (${d.specialization})` : ''}
                                    </option>
                                ))}
                                {draft.doctor && !doctors.some(d => d.name === draft.doctor) && (
                                    <option value={draft.doctor}>{draft.doctor}</option>
                                )}
                                <option value={NEW_DOCTOR}>+ Dodaj nowego…</option>
                            </Form.Select>
                        )}
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Specjalizacja lekarza</Form.Label>
                        {addingSpecialization ? (
                            <InputGroup>
                                <Form.Control
                                    type="text"
                                    placeholder="Nazwa specjalizacji"
                                    value={newSpecialization}
                                    autoFocus
                                    onChange={e => setNewSpecialization(e.target.value)}
                                />
                                <Button onClick={saveNewSpecialization} disabled={!newSpecialization.trim()}>Dodaj</Button>
                                <Button variant="outline-secondary" onClick={() => setAddingSpecialization(false)}>Anuluj</Button>
                            </InputGroup>
                        ) : (
                            <Form.Select value={draft.specialization} onChange={e => handleSpecializationChoice(e.target.value)}>
                                <option value="">— brak —</option>
                                {sortedSpecializations.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                {/* Specjalizacja zapisana na recepcie, a potem usunięta ze słownika, nadal ma się wyświetlić. */}
                                {draft.specialization && !specializations.some(s => s.name === draft.specialization) && (
                                    <option value={draft.specialization}>{draft.specialization}</option>
                                )}
                                <option value={NEW_SPECIALIZATION}>+ Dodaj nową…</option>
                            </Form.Select>
                        )}
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Notatka</Form.Label>
                        <Form.Control as="textarea" rows={2} value={draft.note} onChange={e => update({ note: e.target.value })} />
                    </Form.Group>

                    <h6 className="text-accent">Leki na recepcie</h6>
                    {draft.items.length === 0 && <div className="text-secondary mb-2"><small>Brak leków</small></div>}
                    {draft.items.map(item => {
                        const status = itemStatus(draft, item);
                        return (
                            <Row key={item.id} className="align-items-center py-1 border-bottom">
                                <Col>
                                    <div>
                                        <strong>{item.medicineName}</strong>
                                        {item.newMedicineName && <Badge bg="info" className="ms-1">nowy lek</Badge>}
                                        <Badge bg={STATUS_VARIANTS[status]} className="ms-1">{ITEM_STATUS_LABELS[status]}</Badge>
                                    </div>
                                    <small className="text-secondary">
                                        {remainingPackages(item)}/{item.packages} op.{packageSizeSuffix(item.packageSize, unitOfMedicine(item.medicineId))}
                                    </small>
                                </Col>
                                <Col xs="auto">
                                    <Button variant="outline-danger" size="sm" onClick={() => removeItem(item.id)}>Usuń</Button>
                                </Col>
                            </Row>
                        );
                    })}

                    <div className="border rounded p-2 mt-3">
                        <div className="mb-2"><small className="text-accent">Dodaj lek</small></div>
                        <Form.Select
                            className="mb-2"
                            value={itemForm.medicineChoice}
                            onChange={e => setItemForm(prev => ({ ...prev, medicineChoice: e.target.value }))}
                        >
                            <option value="">— wybierz lek —</option>
                            {sortedMedicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            <option value={NEW_MEDICINE}>+ Nowy lek…</option>
                        </Form.Select>
                        {isNewMedicine && (
                            <>
                                <Form.Control
                                    className="mb-2"
                                    type="text"
                                    placeholder="Nazwa nowego leku"
                                    value={itemForm.newMedicineName}
                                    onChange={e => setItemForm(prev => ({ ...prev, newMedicineName: e.target.value }))}
                                />
                                <Form.Check
                                    className="mb-2"
                                    type="switch"
                                    id="prescription-new-medicine-ignore-quantity"
                                    label="Ignoruj kontrolę ilości"
                                    checked={itemForm.newMedicineIgnoreQuantity}
                                    onChange={e => setItemForm(prev => ({ ...prev, newMedicineIgnoreQuantity: e.target.checked }))}
                                />
                            </>
                        )}
                        <Row className="mb-2">
                            <Form.Group as={Col} xs={6}>
                                <Form.Label><small>Opakowania</small></Form.Label>
                                <Form.Control
                                    type="text"
                                    inputMode="numeric"
                                    value={itemForm.packages}
                                    isInvalid={itemForm.packages !== '' && packages === undefined}
                                    onChange={e => setItemForm(prev => ({ ...prev, packages: e.target.value }))}
                                />
                            </Form.Group>
                            {!chosenIgnoresQuantity && <Form.Group as={Col} xs={6}>
                                <Form.Label><small>{capitalize(unitOfMedicine(isNewMedicine ? undefined : itemForm.medicineChoice).genitivePlural)} w opakowaniu</small></Form.Label>
                                <Form.Control
                                    type="text"
                                    inputMode="numeric"
                                    value={itemForm.packageSize}
                                    isInvalid={itemForm.packageSize !== '' && packageSize === undefined}
                                    onChange={e => setItemForm(prev => ({ ...prev, packageSize: e.target.value }))}
                                />
                            </Form.Group>}
                        </Row>
                        <div className="text-end">
                            <Button size="sm" onClick={addItem} disabled={!itemValid}>Dodaj do recepty</Button>
                        </div>
                    </div>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                {draft.id && (
                    <Button variant="outline-danger" className="me-auto" onClick={handleDelete}>Usuń receptę</Button>
                )}
                <Button variant="secondary" onClick={onClose}>Anuluj</Button>
                <Button onClick={handleSave} disabled={!formValid || saving}>Zapisz</Button>
            </Modal.Footer>
        </Modal>
    );
}
