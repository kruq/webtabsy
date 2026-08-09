import React, { MouseEvent, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import FormGroup from 'react-bootstrap/FormGroup';
import Row from 'react-bootstrap/Row';
import { AMOUNT_HINT, formatAmount, parseAmount } from '../utils/fraction';

interface TakeDoseDialogProps {
    visible: boolean;
    medicineName: string;
    maxAmount: number;
    onSubmit: (amount: number) => Promise<void> | void;
    onCancel: () => void;
}

const DEFAULT_AMOUNT = '1';

export default function TakeDoseDialog({ visible, medicineName, maxAmount, onSubmit, onCancel }: TakeDoseDialogProps) {
    const [amountText, setAmountText] = useState<string>(DEFAULT_AMOUNT);

    useEffect(() => {
        if (visible) setAmountText(DEFAULT_AMOUNT);
    }, [visible]);

    const amount = parseAmount(amountText);
    const valid = amount !== undefined && amount > 0 && amount <= maxAmount;

    const handleSubmit = async (e: MouseEvent) => {
        e.preventDefault();
        if (amount === undefined || amount <= 0) {
            alert(`Nieprawidłowa ilość tabletek (${AMOUNT_HINT})`);
            return;
        }
        if (amount > maxAmount) {
            alert(`Nie można przyjąć więcej niż ${formatAmount(maxAmount)} tab.`);
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
                        <Form.Label>Ilość tabletek do przyjęcia:</Form.Label>
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
