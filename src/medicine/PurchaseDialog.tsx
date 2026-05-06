import React, { MouseEvent, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import FormGroup from 'react-bootstrap/FormGroup';
import InputGroup from 'react-bootstrap/InputGroup';
import Row from 'react-bootstrap/Row';
import IPurchase from '../models/IPurchase';

export interface NewPurchase {
    numberOfPackages: number | undefined;
    numberOfTabletsInPackage: number | undefined;
    pricePerPackage: number | undefined;
}

interface PurchaseDialogProps {
    visible: boolean;
    lastPurchase: IPurchase | undefined;
    onSubmit: (purchase: NewPurchase) => Promise<void> | void;
    onCancel: () => void;
}

function buildDefault(lastPurchase: IPurchase | undefined): NewPurchase {
    return {
        numberOfPackages: 1,
        numberOfTabletsInPackage: lastPurchase?.numberOfTablets,
        pricePerPackage: lastPurchase?.price,
    };
}

function parseOptionalNumber(raw: string): number | undefined {
    const value = parseFloat(raw);
    return isNaN(value) ? undefined : value;
}

export default function PurchaseDialog({ visible, lastPurchase, onSubmit, onCancel }: PurchaseDialogProps) {
    const [draft, setDraft] = useState<NewPurchase>(buildDefault(lastPurchase));

    useEffect(() => {
        if (visible) setDraft(buildDefault(lastPurchase));
    }, [visible, lastPurchase]);

    const handleSubmit = async (e: MouseEvent) => {
        e.preventDefault();
        if (!draft.numberOfPackages || draft.numberOfPackages <= 0) {
            alert('Nieprawidłowa ilość opakowań');
            return;
        }
        if (!draft.numberOfTabletsInPackage || draft.numberOfTabletsInPackage <= 0) {
            alert('Nieprawidłowa ilość tabletek w opakowaniu');
            return;
        }
        if (draft.pricePerPackage !== undefined && draft.pricePerPackage <= 0) {
            alert('Nieprawidłowa cena');
            return;
        }
        if (!draft.pricePerPackage && !window.confirm('Czy na pewno nie chcesz podać ceny?')) {
            return;
        }
        await onSubmit(draft);
    };

    return (
        <dialog open={visible}>
            <Row className="mt-2">
                <Col><strong>Zakupy leków</strong></Col>
            </Row>
            <Form>
                <Row className="mt-2">
                    <FormGroup as={Col}>
                        <Form.Label>Ilość opakowań:</Form.Label>
                        <Form.Control
                            type="number"
                            value={draft.numberOfPackages ?? ''}
                            onChange={e => setDraft({ ...draft, numberOfPackages: parseOptionalNumber(e.target.value) })}
                        />
                    </FormGroup>
                    <FormGroup as={Col}>
                        <Form.Label>Ilość tab. w opakowaniu:</Form.Label>
                        <Form.Control
                            type="number"
                            value={draft.numberOfTabletsInPackage ?? ''}
                            onChange={e => setDraft({ ...draft, numberOfTabletsInPackage: parseOptionalNumber(e.target.value) })}
                        />
                    </FormGroup>
                    <FormGroup as={Col}>
                        <Form.Label>Cena za opakowanie:</Form.Label>
                        <InputGroup>
                            <Form.Control
                                type="number"
                                value={draft.pricePerPackage ?? ''}
                                onChange={e => setDraft({ ...draft, pricePerPackage: parseOptionalNumber(e.target.value) })}
                            />
                            <InputGroup.Text>zł</InputGroup.Text>
                        </InputGroup>
                    </FormGroup>
                </Row>
                <Row>
                    <Col className="text-end">
                        <Button onClick={handleSubmit} variant="primary" type="submit" className="mt-3">
                            Dodaj zakupione leki
                        </Button>
                        <Button className="mt-3 ms-2" variant="secondary" onClick={onCancel}>Anuluj</Button>
                    </Col>
                </Row>
            </Form>
        </dialog>
    );
}
