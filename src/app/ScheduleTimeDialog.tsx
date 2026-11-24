import React, { MouseEvent, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Unit from '../models/Unit';
import { formatTimeInput, parseTimeOfDay } from '../utils/time';
import { amountWithUnitName } from '../utils/units';

/** Odmiana „dawka” tymi samymi regułami co jednostki: 1 dawka, 2 dawki, 5 dawek. */
const DOSE_WORD: Unit = {
    id: 'dawka',
    nominativeSingular: 'dawka',
    nominativePlural: 'dawki',
    genitiveSingular: 'dawki',
    genitivePlural: 'dawek',
    abbreviation: 'dawki',
};

interface ScheduleTimeDialogProps {
    /** Godzina grupy w Grafiku; undefined = okienko zamknięte. */
    time: string | undefined;
    /** Liczba dawek w grupie, których dotyczy zmiana. */
    doseCount: number;
    onSubmit: (time: string) => Promise<void> | void;
    onCancel: () => void;
}

/** Zmiana godziny wszystkich dawek z jednej godziny w Grafiku. */
export default function ScheduleTimeDialog({ time, doseCount, onSubmit, onCancel }: ScheduleTimeDialogProps) {
    const [text, setText] = useState(time ?? '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setText(time ?? '');
        setSaving(false);
    }, [time]);

    const parsed = parseTimeOfDay(text);

    const handleSubmit = async (e: MouseEvent) => {
        e.preventDefault();
        if (!parsed || saving) return;
        setSaving(true);
        await onSubmit(parsed);
    };

    return (
        // Wąskie okienko - zamiast domyślnej szerokości dialogów (min. połowa ekranu).
        <dialog open={time !== undefined} className="schedule-time-dialog">
            <Row className="mt-2">
                <Col><strong>Zmiana godziny {time}</strong></Col>
            </Row>
            <Form>
                <Form.Group className="mt-2">
                    <Form.Label>Nowa godzina ({amountWithUnitName(doseCount, DOSE_WORD)}):</Form.Label>
                    <Form.Control
                        type="text"
                        inputMode="numeric"
                        value={text}
                        isInvalid={!parsed}
                        onChange={e => setText(formatTimeInput(e.target.value))}
                    />
                </Form.Group>
                <Row>
                    <Col className="text-end">
                        <Button onClick={handleSubmit} variant="primary" type="submit" className="mt-3" disabled={!parsed || saving}>
                            Zapisz
                        </Button>
                        <Button className="mt-3 ms-2" variant="secondary" onClick={onCancel}>Anuluj</Button>
                    </Col>
                </Row>
            </Form>
        </dialog>
    );
}
