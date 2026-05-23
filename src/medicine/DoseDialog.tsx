import React, { MouseEvent, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import FormGroup from 'react-bootstrap/FormGroup';
import Row from 'react-bootstrap/Row';
import { v4 as Uuid } from 'uuid';
import Dose from '../models/Dose';
import { formatYmd } from '../utils/dateFormat';

interface DoseDialogProps {
    visible: boolean;
    initialDose: Dose;
    isEdit: boolean;
    onSave: (dose: Dose) => Promise<void> | void;
    onCancel: () => void;
}

const TIME_PATTERN = /^\d?:?\d:?\d\d$/;

function normaliseTime(raw: string): string {
    return raw.length === 4 ? `0${raw}` : raw;
}

function applyTimeOfDay(date: Date, time: string): Date {
    const result = new Date(date.toString());
    const [hh, mm] = time.split(':');
    result.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
    return result;
}

export default function DoseDialog({ visible, initialDose, isEdit, onSave, onCancel }: DoseDialogProps) {
    const [draft, setDraft] = useState<Dose>(initialDose);
    const [valid, setValid] = useState<boolean>(true);

    useEffect(() => {
        if (visible) {
            setDraft(initialDose);
            setValid(true);
        }
    }, [visible, initialDose]);

    const updateDraft = (patch: Partial<Dose>) => setDraft(prev => ({ ...prev, ...patch }));

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const stripped = raw.replaceAll(':', '');
        const cursor = stripped.length - 2;
        const matches = TIME_PATTERN.test(raw);
        setValid(matches);
        const newTime = matches ? `${stripped.slice(0, cursor)}:${stripped.slice(cursor)}` : raw;
        updateDraft({ time: newTime });
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const amount = parseFloat(e.target.value);
        if (!isNaN(amount)) updateDraft({ amount });
    };

    const handleNumberOfDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const numberOfDays = parseFloat(e.target.value);
        if (!isNaN(numberOfDays)) updateDraft({ numberOfDays });
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const ts = Date.parse(e.target.value);
        if (isNaN(ts)) return;
        const value = new Date(ts);
        value.setHours(0, 0, 0, 0);
        updateDraft({ nextDoseDate: value });
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const ts = Date.parse(e.target.value);
        let value: Date | null = null;
        if (!isNaN(ts)) {
            value = new Date(ts);
            value.setHours(23, 59, 59, 100);
        }
        updateDraft({ endDate: value });
    };

    const handleSubmit = async (e: MouseEvent) => {
        e.preventDefault();
        if (!draft.amount) {
            alert('Nie można dodać dawki z pustą wartością ilości');
            return;
        }
        const finalised: Dose = {
            ...draft,
            id: draft.id || Uuid(),
            time: normaliseTime(draft.time),
            nextDoseDate: applyTimeOfDay(
                draft.nextDoseDate < new Date() ? new Date() : draft.nextDoseDate,
                normaliseTime(draft.time),
            ),
        };
        await onSave(finalised);
    };

    return (
        <dialog open={visible}>
            <Row>
                <Col>
                    <strong>{isEdit ? 'Edycja dawki' : 'Nowa dawka'}</strong>
                </Col>
            </Row>
            <Form>
                <Row className="mt-2">
                    <FormGroup as={Col}>
                        <Form.Label>Godzina:</Form.Label>
                        <Form.Control type="text" value={draft.time} onChange={handleTimeChange} />
                    </FormGroup>
                    <FormGroup as={Col}>
                        <Form.Label>Ilość tabletek:</Form.Label>
                        <Form.Control type="number" value={draft.amount} onChange={handleAmountChange} />
                    </FormGroup>
                    <FormGroup as={Col}>
                        <Form.Label>Co ile dni:</Form.Label>
                        <Form.Control type="number" value={draft.numberOfDays} onChange={handleNumberOfDaysChange} />
                    </FormGroup>
                </Row>
                <Row>
                    <FormGroup as={Col}>
                        <Form.Label>Od kiedy:</Form.Label>
                        <Form.Control type="date" value={formatYmd(draft.nextDoseDate)} onChange={handleStartDateChange} />
                    </FormGroup>
                    <FormGroup as={Col}>
                        <Form.Label>Do kiedy:</Form.Label>
                        <Form.Control type="date" value={formatYmd(draft.endDate)} onChange={handleEndDateChange} />
                    </FormGroup>
                </Row>
                <Row className="text-end">
                    <Col>
                        <Button onClick={handleSubmit} variant="primary" type="submit" className="mt-3" disabled={!valid}>
                            {isEdit ? 'Zapisz dawkę' : 'Dodaj dawkę'}
                        </Button>
                        <Button className="mt-3 ms-2" variant="secondary" onClick={onCancel}>Anuluj</Button>
                    </Col>
                </Row>
            </Form>
        </dialog>
    );
}
