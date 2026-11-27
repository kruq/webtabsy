import React, { useState } from 'react';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import IMedicine from '../models/IMedicine';
import Prescription, { Doctor, Specialization } from '../models/Prescription';
import {
    expiryDate,
    formatYmdForDisplay,
    ITEM_STATUS_LABELS,
    itemStatus,
    PRESCRIPTION_STATUS_LABELS,
    prescriptionStatus,
    remainingPackages,
    STATUS_VARIANTS,
    VALIDITY_LABELS,
} from '../utils/prescriptionStatus';
import DoctorsDialog from './DoctorsDialog';
import EmptyState from './EmptyState';
import PrescriptionDialog, { emptyPrescription, PrescriptionDraft } from './PrescriptionDialog';
import { PrescriptionItemPurchase } from './prescriptionPurchase';
import PrescriptionPurchaseDialog from './PrescriptionPurchaseDialog';
import { useUnits } from './UnitsContext';
import { packageSizeSuffix } from '../utils/units';

interface PrescriptionsViewProps {
    prescriptions: Prescription[];
    medicines: IMedicine[];
    specializations: Specialization[];
    doctors: Doctor[];
    onSave: (draft: PrescriptionDraft) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onAddSpecialization: (name: string) => Promise<Specialization>;
    onAddDoctor: (doctor: Omit<Doctor, 'id'>) => Promise<Doctor>;
    onDeleteDoctor: (id: string) => Promise<void>;
    onPurchase: (prescription: Prescription, purchaseDate: Date, purchases: PrescriptionItemPurchase[]) => Promise<void>;
}

const SHOW_EXPIRED_STORAGE_KEY = 'prescriptionsShowExpired';
const SHOW_FULFILLED_STORAGE_KEY = 'prescriptionsShowFulfilled';

/** Wystawione i częściowo zrealizowane są widoczne zawsze; przeterminowane i zrealizowane - gdy włączono ich przełącznik. */
export function isShown(prescription: Prescription, showExpired: boolean, showFulfilled: boolean): boolean {
    const status = prescriptionStatus(prescription);
    if (status === 'expired') return showExpired;
    if (status === 'fullyPurchased') return showFulfilled;
    return true;
}

function useStoredFlag(key: string): [boolean, (value: boolean) => void] {
    const [value, setValue] = useState<boolean>(localStorage.getItem(key) === 'true');
    const update = (next: boolean) => {
        setValue(next);
        localStorage.setItem(key, next.toString());
    };
    return [value, update];
}

interface PrescriptionCardProps {
    prescription: Prescription;
    onClick: () => void;
    onPurchase: () => void;
}

function PrescriptionCard({ prescription, onClick, onPurchase }: PrescriptionCardProps) {
    const { unitOfMedicine } = useUnits();
    const status = prescriptionStatus(prescription);
    const canPurchase = status === 'new' || status === 'partiallyPurchased';
    const doctorLine = [prescription.doctor, prescription.specialization].filter(Boolean).join(', ');

    return (
        <Card className="my-2" onClick={onClick} style={{ cursor: 'pointer' }}>
            <Card.Body>
                {/* Najważniejszy jest termin ważności - obok statusu (mniejszy odstęp gx-2, żeby zmieścić się na 340px);
                    data wystawienia i rodzaj recepty w drugiej linii na całą szerokość. */}
                <Row className="gx-2 align-items-center">
                    <Col>
                        <strong className="text-nowrap">Ważna do {formatYmdForDisplay(expiryDate(prescription))}</strong>
                    </Col>
                    <Col xs="auto">
                        {/* Status recepty od tabletu większy (14px) niż statusy leków; na telefonie tej samej wielkości, żeby
                            zmieścił się obok terminu ważności (App.css). Obie plakietki zaokrąglone (pill). */}
                        <Badge bg={STATUS_VARIANTS[status]} pill className="prescription-status-badge">{PRESCRIPTION_STATUS_LABELS[status]}</Badge>
                    </Col>
                </Row>
                <div>
                    <small className="text-secondary">
                        wystawiona {formatYmdForDisplay(prescription.issueDate)} · {VALIDITY_LABELS[prescription.validity]}
                    </small>
                </div>
                {(doctorLine || prescription.code) && (
                    <div>
                        <small>
                            {doctorLine}
                            {prescription.code && <span className="text-secondary">{doctorLine ? ' · ' : ''}kod {prescription.code}</span>}
                        </small>
                    </div>
                )}
                {prescription.note && <div><small className="text-secondary">{prescription.note}</small></div>}
            </Card.Body>
            {prescription.items.length > 0 && (
                <ListGroup variant="flush" className="border-top">
                    {prescription.items.map(item => {
                        const itemStat = itemStatus(prescription, item);
                        return (
                            <ListGroup.Item key={item.id} className="py-1 bg-light">
                                <Row className="align-items-center">
                                    {/* Nazwa leku obok statusu, opakowania pod nazwą - nic się nie zawija na telefonie. */}
                                    <Col>
                                        <small>
                                            <div>{item.medicineName}</div>
                                            <div className="text-secondary">
                                                {remainingPackages(item)}/{item.packages} op.{packageSizeSuffix(item.packageSize, unitOfMedicine(item.medicineId))}
                                            </div>
                                        </small>
                                    </Col>
                                    <Col xs="auto">
                                        <Badge bg={STATUS_VARIANTS[itemStat]} pill>{ITEM_STATUS_LABELS[itemStat]}</Badge>
                                    </Col>
                                </Row>
                            </ListGroup.Item>
                        );
                    })}
                </ListGroup>
            )}
            {canPurchase && (
                <Card.Footer className="text-end py-2">
                    <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={e => {
                            // Kliknięcie karty otwiera edycję - przycisk ma otworzyć tylko wykup.
                            e.stopPropagation();
                            onPurchase();
                        }}
                    >
                        Wykup
                    </Button>
                </Card.Footer>
            )}
        </Card>
    );
}

export default function PrescriptionsView(props: PrescriptionsViewProps) {
    // Obiekt (nie id), żeby dialog dostał stabilną wartość początkową także dla nowej recepty.
    const [editing, setEditing] = useState<Prescription | undefined>(undefined);
    const [purchasing, setPurchasing] = useState<Prescription | undefined>(undefined);
    const [doctorsOpen, setDoctorsOpen] = useState(false);
    const [showExpired, setShowExpired] = useStoredFlag(SHOW_EXPIRED_STORAGE_KEY);
    const [showFulfilled, setShowFulfilled] = useStoredFlag(SHOW_FULFILLED_STORAGE_KEY);

    const sorted = props.prescriptions
        .filter(p => isShown(p, showExpired, showFulfilled))
        .sort((a, b) => b.issueDate.localeCompare(a.issueDate));
    const hiddenCount = props.prescriptions.length - sorted.length;

    const handleSave = async (draft: PrescriptionDraft) => {
        await props.onSave(draft);
        setEditing(undefined);
    };

    const handleDelete = async (id: string) => {
        await props.onDelete(id);
        setEditing(undefined);
    };

    return (
        <>
            {/* Na telefonie przyciski w pierwszej linii, przełączniki pod nimi; od tabletu wszystko w jednej linii. */}
            <Row className="mb-2">
                <Col xs={12} md className="text-nowrap">
                    <Button size="sm" onClick={() => setEditing(emptyPrescription())}>
                        Dodaj<span className="d-none d-md-inline"> receptę</span>
                    </Button>
                    <Button size="sm" variant="outline-primary" className="ms-2" onClick={() => setDoctorsOpen(true)}>
                        Lekarze
                    </Button>
                </Col>
                <Col xs="auto" className="d-flex align-items-center mt-2 mt-md-0">
                    <Form.Switch
                        id="prescriptions-show-expired"
                        checked={showExpired}
                        label="przeterminowane"
                        onChange={e => setShowExpired(e.target.checked)}
                    />
                </Col>
                <Col xs="auto" className="d-flex align-items-center mt-2 mt-md-0">
                    <Form.Switch
                        id="prescriptions-show-fulfilled"
                        checked={showFulfilled}
                        label="zrealizowane"
                        onChange={e => setShowFulfilled(e.target.checked)}
                    />
                </Col>
            </Row>
            {sorted.length === 0 && <EmptyState title="Brak recept" />}
            {hiddenCount > 0 && (
                <div className="text-center">
                    <small className="text-secondary">Ukryte recepty: {hiddenCount}</small>
                </div>
            )}
            {sorted.map(p => (
                <PrescriptionCard key={p.id} prescription={p} onClick={() => setEditing(p)} onPurchase={() => setPurchasing(p)} />
            ))}
            <PrescriptionPurchaseDialog
                prescription={purchasing}
                onSubmit={async (purchaseDate, purchases) => {
                    await props.onPurchase(purchasing as Prescription, purchaseDate, purchases);
                    setPurchasing(undefined);
                }}
                onClose={() => setPurchasing(undefined)}
            />
            <DoctorsDialog
                show={doctorsOpen}
                doctors={props.doctors}
                specializations={props.specializations}
                prescriptions={props.prescriptions}
                onAdd={props.onAddDoctor}
                onAddSpecialization={props.onAddSpecialization}
                onDelete={props.onDeleteDoctor}
                onClose={() => setDoctorsOpen(false)}
            />
            <PrescriptionDialog
                initial={editing}
                medicines={props.medicines}
                specializations={props.specializations}
                doctors={props.doctors}
                onSave={handleSave}
                onDelete={handleDelete}
                onAddSpecialization={props.onAddSpecialization}
                onAddDoctor={props.onAddDoctor}
                onClose={() => setEditing(undefined)}
            />
        </>
    );
}
