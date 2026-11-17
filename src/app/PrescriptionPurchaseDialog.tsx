import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Prescription from '../models/Prescription';
import { formatAmountForDisplay } from '../utils/fraction';
import { formatYmdForDisplay, itemStatus, purchaseDeadline, remainingPackages, todayYmd } from '../utils/prescriptionStatus';
import { PrescriptionItemPurchase } from './prescriptionPurchase';

interface PrescriptionPurchaseDialogProps {
    /** undefined = dialog zamknięty. */
    prescription: Prescription | undefined;
    onSubmit: (purchaseDate: Date, purchases: PrescriptionItemPurchase[]) => Promise<void>;
    onClose: () => void;
}

interface ItemInput {
    packages: string;
    totalPrice: string;
}

function parsePackages(text: string): number | undefined {
    return /^\d+$/.test(text.trim()) ? parseInt(text, 10) : undefined;
}

/** Pusta cena jest dozwolona (undefined); null = wpisano coś niepoprawnego. */
function parsePrice(text: string): number | undefined | null {
    const normalized = text.trim().replace(',', '.');
    if (normalized === '') return undefined;
    return /^\d+(\.\d{1,2})?$/.test(normalized) ? parseFloat(normalized) : null;
}

/** Data z pola "yyyy-MM-dd" jako południe czasu lokalnego - żadna strefa czasowa nie przesunie jej na inny dzień. */
function dateFromYmd(ymd: string): Date {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
}

const priceFormat = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' });

export default function PrescriptionPurchaseDialog({ prescription, onSubmit, onClose }: PrescriptionPurchaseDialogProps) {
    const [purchaseDate, setPurchaseDate] = useState(todayYmd());
    const [inputs, setInputs] = useState<Record<string, ItemInput>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!prescription) return;
        setPurchaseDate(todayYmd());
        setInputs({});
    }, [prescription]);

    // Wykupić można tylko pozycje, które dziś nie są ani zrealizowane, ani przeterminowane.
    const items = (prescription?.items ?? []).filter(item => {
        const status = itemStatus(prescription as Prescription, item);
        return status === 'new' || status === 'partiallyPurchased';
    });

    const inputFor = (id: string): ItemInput => inputs[id] ?? { packages: '0', totalPrice: '' };
    const setInput = (id: string, params: Partial<ItemInput>) =>
        setInputs(prev => ({ ...prev, [id]: { ...inputFor(id), ...params } }));

    const rows = items.map(item => {
        const input = inputFor(item.id);
        const packages = parsePackages(input.packages);
        const price = parsePrice(input.totalPrice);
        const packagesValid = packages !== undefined && packages <= remainingPackages(item);
        return { item, input, packages, price, valid: packagesValid && price !== null };
    });

    const dateValid = purchaseDate !== '' && purchaseDate <= todayYmd();
    const anyPackages = rows.some(r => (r.packages ?? 0) > 0);
    const formValid = dateValid && anyPackages && rows.every(r => r.valid);

    const handleSubmit = async () => {
        if (!formValid) return;
        setSaving(true);
        try {
            await onSubmit(
                dateFromYmd(purchaseDate),
                rows
                    .filter(r => (r.packages ?? 0) > 0)
                    .map(r => ({ itemId: r.item.id, packages: r.packages as number, totalPrice: r.price ?? undefined })),
            );
        } catch (e) {
            console.error(e);
            alert('Nie udało się zapisać wykupu');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={prescription !== undefined} onHide={onClose} fullscreen="sm-down" scrollable>
            <Modal.Header closeButton>
                <Modal.Title as="h5">Wykup leków z recepty</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={e => e.preventDefault()}>
                    <Form.Group className="mb-3" style={{ maxWidth: '12rem' }}>
                        <Form.Label>Data wykupu</Form.Label>
                        <Form.Control
                            type="date"
                            value={purchaseDate}
                            max={todayYmd()}
                            isInvalid={!dateValid}
                            onChange={e => setPurchaseDate(e.target.value)}
                        />
                        <Form.Control.Feedback type="invalid">Data nie może być z przyszłości</Form.Control.Feedback>
                    </Form.Group>

                    {items.length === 0 && <div className="text-secondary">Na tej recepcie nie ma już leków do wykupienia</div>}
                    {rows.map(({ item, input, packages, price }) => {
                        const remaining = remainingPackages(item);
                        return (
                            <div key={item.id} className="border-top py-2">
                                <div>
                                    <strong>{item.medicineName}</strong>
                                    <small className="text-secondary">
                                        {' '}· zostało {remaining} op. × {formatAmountForDisplay(item.packageSize)} tab.
                                        {' '}· wykup do {formatYmdForDisplay(purchaseDeadline(prescription as Prescription, item))}
                                    </small>
                                </div>
                                <Row className="mt-1">
                                    <Form.Group as={Col} xs={6}>
                                        <Form.Label><small>Opakowania (0–{remaining})</small></Form.Label>
                                        <Form.Control
                                            type="text"
                                            inputMode="numeric"
                                            value={input.packages}
                                            isInvalid={packages === undefined || packages > remaining}
                                            onChange={e => setInput(item.id, { packages: e.target.value })}
                                        />
                                    </Form.Group>
                                    <Form.Group as={Col} xs={6}>
                                        <Form.Label><small>Cena łącznie (opcjonalnie)</small></Form.Label>
                                        <Form.Control
                                            type="text"
                                            inputMode="decimal"
                                            placeholder="0,00"
                                            value={input.totalPrice}
                                            disabled={!packages}
                                            isInvalid={price === null}
                                            onChange={e => setInput(item.id, { totalPrice: e.target.value })}
                                        />
                                    </Form.Group>
                                </Row>
                                {!!packages && typeof price === 'number' && (
                                    <small className="text-secondary">{priceFormat.format(price / packages)} za opakowanie</small>
                                )}
                            </div>
                        );
                    })}
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>Anuluj</Button>
                <Button onClick={handleSubmit} disabled={!formValid || saving}>Wykup</Button>
            </Modal.Footer>
        </Modal>
    );
}
