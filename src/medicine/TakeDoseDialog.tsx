import React, { MouseEvent, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import FormGroup from 'react-bootstrap/FormGroup';
import Row from 'react-bootstrap/Row';
import { AMOUNT_HINT, formatAmount, parseAmount } from '../utils/fraction';
import Unit from '../models/Unit';
import { amountLabel, amountWithUnitName, DEFAULT_UNIT } from '../utils/units';

interface TakeDoseDialogProps {
    visible: boolean;
    medicineName: string;
    maxAmount: number;
    /** Ilość wpisana w pole po otwarciu dialogu; domyślnie 1. */
    initialAmount?: number;
    onSubmit: (amount: number) => Promise<void> | void;
    onCancel: () => void;
    /** Jednostka leku; domyślnie tabletka. */
    unit?: Unit;
}

const DEFAULT_AMOUNT = 1;

export default function TakeDoseDialog({
    visible,
    medicineName,
    maxAmount,
    initialAmount = DEFAULT_AMOUNT,
    onSubmit,
    onCancel,
    unit = DEFAULT_UNIT,
}: TakeDoseDialogProps) {
    const [amountText, setAmountText] = useState<string>(formatAmount(initialAmount));

    useEffect(() => {
        if (visible) setAmountText(formatAmount(initialAmount));
    }, [visible, initialAmount]);

    const amount = parseAmount(amountText);
    const valid = amount !== undefined && amount > 0 && amount <= maxAmount;

    const handleSubmit = async (e: MouseEvent) => {
        e.preventDefault();
        if (amount === undefined || amount <= 0) {
            alert(`Nieprawidłowa ${amountLabel(unit).toLowerCase()} (${AMOUNT_HINT})`);
            return;
        }
        if (amount > maxAmount) {
            alert(`Nie można przyjąć więcej niż ${amountWithUnitName(maxAmount, unit)}`);
            return;
        }
        await onSubmit(amount);
    };

    return (
        <dialog open={visible}>
            <Row className="mt-2">
                <Col><strong>Weź lek: {medicineName}</strong></Col>
            </Row>
            <Form>
                <Row className="mt-2">
                    <FormGroup as={Col}>
                        <Form.Label>{amountLabel(unit)} do przyjęcia:</Form.Label>
                        <Form.Control
                            type="text"
                            inputMode="text"
                            value={amountText}
                            isInvalid={!valid}
                            onChange={e => setAmountText(e.target.value)}
                        />
                        <Form.Text className="text-secondary">{AMOUNT_HINT}</Form.Text>
                    </FormGroup>
                </Row>
                <Row>
                    <Col className="text-end">
                        <Button onClick={handleSubmit} variant="primary" type="submit" className="mt-3" disabled={!valid}>
                            Weź lek
                        </Button>
                        <Button className="mt-3 ms-2" variant="secondary" onClick={onCancel}>Anuluj</Button>
                    </Col>
                </Row>
            </Form>
        </dialog>
    );
}
