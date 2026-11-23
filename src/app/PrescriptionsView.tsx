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
import { formatAmountForDisplay } from '../utils/fraction';
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
import EmptyState from './EmptyState';
import PrescriptionDialog, { emptyPrescription, PrescriptionDraft } from './PrescriptionDialog';
import { PrescriptionItemPurchase } from './prescriptionPurchase';
import PrescriptionPurchaseDialog from './PrescriptionPurchaseDialog';

interface PrescriptionsViewProps {
    prescriptions: Prescription[];
    medicines: IMedicine[];
    specializations: Specialization[];
    doctors: Doctor[];
    onSave: (draft: PrescriptionDraft) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onAddSpecialization: (name: string) => Promise<Specialization>;
    onAddDoctor: (doctor: Omit<Doctor, 'id'>) => Promise<Doctor>;
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
    const status = prescriptionStatus(prescription);
    const canPurchase = status === 'new' || status === 'partiallyPurchased';
    const doctorLine = [prescription.doctor, prescription.specialization].filter(Boolean).join(', ');

    return (
        <Card className="my-2" onClick={onClick} style={{ cursor: 'pointer' }}>
            <Card.Body>
                <Row>
                    <Col>
                        <strong>{formatYmdForDisplay(prescription.issueDate)}</strong>
                        <small className="text-secondary">
                            {' '}·{' '}
                            {/* Na telefonie pełny opis się nie mieści - zostaje "do <data>". */}
                            <span className="d-none d-md-inline">{VALIDITY_LABELS[prescription.validity]}, ważna </span>
                            do {formatYmdForDisplay(expiryDate(prescription))}
                        </small>
                    </Col>
                    <Col xs="auto">
                        <Badge bg={STATUS_VARIANTS[status]}>{PRESCRIPTION_STATUS_LABELS[status]}</Badge>
                    </Col>
                </Row>
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
                                    <Col>
                                        <small>
                                            {item.medicineName}{' '}
                                            <span className="text-secondary">
                                                {remainingPackages(item)}/{item.packages} op. × {formatAmountForDisplay(item.packageSize)} tab.
                                            </span>
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
            <Row className="mb-2">
                <Col>
                    <Button size="sm" onClick={() => setEditing(emptyPrescription())}>
                        Dodaj<span className="d-none d-md-inline"> receptę</span>
                    </Button>
                </Col>
                <Col xs="auto" className="d-flex align-items-center">
                    <Form.Switch
                        id="prescriptions-show-expired"
                        checked={showExpired}
                        label="przeterminowane"
                        onChange={e => setShowExpired(e.target.checked)}
                    />
                </Col>
                <Col xs="auto" className="d-flex align-items-center">
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
