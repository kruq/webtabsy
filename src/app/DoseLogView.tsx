import React, { useCallback, useEffect, useRef, useState } from 'react';
import Badge from 'react-bootstrap/Badge';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import moment from 'moment';
import { BsCalendarX } from 'react-icons/bs';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import DoseLogEntry from '../models/DoseLogEntry';
import { fetchDoseLog } from '../services/doseLog.service';
import { formatYmd } from '../utils/dateFormat';
import { useUnits } from './UnitsContext';
import { nameWithAmount } from '../utils/units';

const DEFAULT_MONTHS = 1;
// Krótsze niż DEBOUNCE_TIMEOUT_MS (3 s) - tu użytkownik czeka na wynik, a nie zapisuje pole.
const MONTHS_INPUT_DEBOUNCE_MS = 500;
// Musi zgadzać się z limitem w API (DoseLogController.MaxMonths).
const MAX_MONTHS = 120;

const DAY_HEADER_OPTIONS: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };

interface DayGroup {
    key: string;
    date: Date;
    entries: DoseLogEntry[];
}

function parseMonths(text: string): number | undefined {
    if (!/^\d+$/.test(text.trim())) return undefined;
    const value = parseInt(text, 10);
    return value >= 1 && value <= MAX_MONTHS ? value : undefined;
}

/** Grupuje wpisy po lokalnym dniu zaplanowanej dawki, zachowując kolejność od najnowszego. */
export function groupByDay(entries: DoseLogEntry[]): DayGroup[] {
    const sorted = [...entries].sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime());
    const groups: DayGroup[] = [];
    for (const entry of sorted) {
        const key = formatYmd(entry.scheduledAt) as string;
        const last = groups[groups.length - 1];
        if (last?.key === key) {
            last.entries.push(entry);
        } else {
            groups.push({ key, date: entry.scheduledAt, entries: [entry] });
        }
    }
    return groups;
}

function ActionBadge({ entry }: { entry: DoseLogEntry }) {
    if (entry.action === 'skipped') return <Badge bg="secondary">Pominięto</Badge>;
    return <Badge bg="success">Wzięto</Badge>;
}

export default function DoseLogView() {
    const { unitOfMedicine } = useUnits();
    const [monthsText, setMonthsText] = useState(String(DEFAULT_MONTHS));
    const [entries, setEntries] = useState<DoseLogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    // Odpowiedź na starsze zapytanie nie może nadpisać wyniku nowszego.
    const latestRequest = useRef(0);

    const load = useCallback(async (months: number) => {
        const request = ++latestRequest.current;
        setLoading(true);
        setError(false);
        try {
            const result = await fetchDoseLog(months);
            if (request === latestRequest.current) setEntries(result);
        } catch (e) {
            console.error(e);
            if (request === latestRequest.current) setError(true);
        } finally {
            if (request === latestRequest.current) setLoading(false);
        }
    }, []);

    const debouncedLoad = useDebouncedCallback(load, MONTHS_INPUT_DEBOUNCE_MS);

    useEffect(() => {
        load(DEFAULT_MONTHS);
    }, [load]);

    const months = parseMonths(monthsText);

    const handleMonthsChange = (text: string) => {
        setMonthsText(text);
        const parsed = parseMonths(text);
        if (parsed !== undefined) debouncedLoad(parsed);
    };

    const groups = groupByDay(entries);

    return (
        <>
            <Row className="align-items-center mb-2">
                <Col xs="auto">
                    <Form.Label htmlFor="dose-log-months" className="mb-0">Historia z ostatnich</Form.Label>
                </Col>
                <Col xs={3} sm={2}>
                    <Form.Control
                        id="dose-log-months"
                        type="text"
                        inputMode="numeric"
                        size="sm"
                        value={monthsText}
                        isInvalid={months === undefined}
                        onChange={e => handleMonthsChange(e.target.value)}
                    />
                </Col>
                <Col xs="auto" className="ps-0">mies.</Col>
                <Col xs="auto">{loading && <Spinner animation="border" size="sm" variant="primary" />}</Col>
            </Row>
            {months === undefined && (
                <small className="text-danger">Podaj liczbę miesięcy od 1 do {MAX_MONTHS}</small>
            )}
            {error && <small className="text-danger">Nie udało się pobrać historii</small>}
            {!loading && !error && groups.length === 0 && (
                <div className="mt-5 text-center text-secondary">Brak wpisów w wybranym okresie</div>
            )}
            {groups.map(group => (
                <div key={group.key} className="mt-3">
                    <strong className="text-secondary">
                        <small>{group.date.toLocaleDateString('pl-PL', DAY_HEADER_OPTIONS)}</small>
                    </strong>
                    {group.entries.map(entry => (
                        <Card key={entry.id} className="my-1">
                            <Card.Body className="py-2">
                                <Row className="align-items-center">
                                    <Col xs="auto">{moment(entry.scheduledAt).format('HH:mm')}</Col>
                                    {/* Jedna linia: długa nazwa leku jest ucinana wielokropkiem zamiast zawijać się pod spód. */}
                                    <Col className="p-0 text-truncate" style={{ minWidth: 0 }}>
                                        {/* Ilość 0 zapisuje lek z „Ignoruj kontrolę ilości” - wtedy sama nazwa. */}
                                        <strong>{nameWithAmount(entry.medicineName, entry.amount > 0 ? entry.amount : undefined, unitOfMedicine(entry.medicineId))}</strong>
                                        {entry.unscheduled && (
                                            <small className="text-secondary" title="Poza grafikiem">
                                                {' '}<BsCalendarX style={{ verticalAlign: '-2px' }} aria-label="poza grafikiem" />
                                                <span className="d-none d-md-inline"> poza grafikiem</span>
                                            </small>
                                        )}
                                    </Col>
                                    <Col xs="auto"><ActionBadge entry={entry} /></Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    ))}
                </div>
            ))}
        </>
    );
}
