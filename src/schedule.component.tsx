import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import _ from 'lodash';
import { MS_PER_DAY, SCHEDULE_WINDOW_DAYS } from './constants';
import Dose from './models/Dose';
import IMedicine from './models/IMedicine';
import { getDateText, getDaysText } from './text.helpers';
import EmptyState from './app/EmptyState';
import DoseDialog from './medicine/DoseDialog';
import ScheduleTimeDialog from './app/ScheduleTimeDialog';
import { useUnits } from './app/UnitsContext';
import { nameWithAmount } from './utils/units';

interface IScheduleProps {
    medicines: IMedicine[];
    /** Zapis dawki zmienionej w okienku edycji (to samo okienko co w karcie leku). */
    onSaveDose: (medicineId: string, dose: Dose) => Promise<void>;
    /** Nowa godzina dla wszystkich dawek z jednej godziny Grafiku. */
    onSaveTime: (doses: { medicineId: string; doseId: string }[], time: string) => Promise<void>;
}

interface ScheduleEntry {
    dose: Dose;
    name: string;
    medicineId: string;
    ignoreQuantity: boolean;
}

function isWithinScheduleWindow(dose: Dose): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const windowEnd = new Date(today.getTime() + SCHEDULE_WINDOW_DAYS * MS_PER_DAY);

    const notExpired = dose.endDate === null || new Date() <= dose.endDate;
    const startsInWindow = dose.nextDoseDate >= today && dose.nextDoseDate <= windowEnd;
    return notExpired && startsInWindow;
}

function buildScheduleEntries(medicines: IMedicine[]): ScheduleEntry[] {
    return medicines
        .filter(m => m.doses.length > 0 && (m.ignoreQuantity || m.count > 0 || !m.hideWhenEmpty))
        .flatMap(m => m.doses
            .filter(isWithinScheduleWindow)
            .map(dose => ({ dose, name: m.name, medicineId: m.id, ignoreQuantity: Boolean(m.ignoreQuantity) })));
}

export default function Schedule({ medicines, onSaveDose, onSaveTime }: IScheduleProps) {
    const { unitOfMedicine } = useUnits();
    const [editing, setEditing] = useState<ScheduleEntry | undefined>(undefined);
    // Godzina grupy, której godzinę zmieniamy, i dawki tej grupy (zapamiętane w chwili kliknięcia).
    const [editingTime, setEditingTime] = useState<{ time: string; entries: ScheduleEntry[] } | undefined>(undefined);

    const handleSaveTime = async (time: string) => {
        if (!editingTime) return;
        await onSaveTime(editingTime.entries.map(e => ({ medicineId: e.medicineId, doseId: e.dose.id })), time);
        setEditingTime(undefined);
    };

    const handleSave = async (dose: Dose) => {
        if (!editing) return;
        await onSaveDose(editing.medicineId, dose);
        setEditing(undefined);
    };

    const groupsByTime = Object.entries(_.groupBy(buildScheduleEntries(medicines), e => e.dose.time))
        .sort((a, b) => (a[0] > b[0] ? 1 : -1));

    if (medicines.length === 0) {
        return <EmptyState title="Brak leków" hint="Dodaj lek w zakładce „Lista leków”" />;
    }

    return (
        <Row>
            <Col className="d-flex flex-column align-items-center">
                {groupsByTime.map(([time, entries]) => (
                    <Row className="w-100" key={`schedule-${entries[0].dose.id}`}>
                        <Col xs="auto" className="d-flex align-items-center">
                            {/* Godzina jest linkiem: zmiana godziny wszystkich dawek z tej grupy. */}
                            <Button
                                variant="link"
                                className="p-0 fw-bold"
                                title="Zmień godzinę wszystkich dawek z tej godziny"
                                onClick={() => setEditingTime({ time, entries })}
                            >
                                {time}
                            </Button>
                        </Col>
                        <Col>
                            <Card className="my-2">
                                <Card.Body>
                                    {entries
                                        .sort((y, z) => (y.name > z.name ? 1 : -1))
                                        .map(entry => (
                                            // Cały wiersz otwiera edycję tej dawki; nazwa leku jest linkiem, żeby było widać, że to klikalne.
                                            <Row
                                                key={`schedule-dose-${entry.dose.id}`}
                                                onClick={() => setEditing(entry)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <Col md={4} sm={8} xs={12}>
                                                    <Button variant="link" className="fw-bold text-start">
                                                        {nameWithAmount(entry.name, entry.ignoreQuantity ? undefined : entry.dose.amount, unitOfMedicine(entry.medicineId))}
                                                    </Button>
                                                </Col>
                                                <Col md={4} sm={4} xs={6} className="text-start text-sm-end">
                                                    <small>co {getDaysText(entry.dose.numberOfDays)}</small>
                                                </Col>
                                                <Col md={4} sm={12} xs={6} className="text-end">
                                                    <small>następny {getDateText(entry.dose.nextDoseDate)}</small>
                                                </Col>
                                            </Row>
                                        ))}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                ))}
                <ScheduleTimeDialog
                    time={editingTime?.time}
                    doseCount={editingTime?.entries.length ?? 0}
                    onSubmit={handleSaveTime}
                    onCancel={() => setEditingTime(undefined)}
                />
                {editing && (
                    <DoseDialog
                        visible
                        initialDose={editing.dose}
                        unit={unitOfMedicine(editing.medicineId)}
                        withoutQuantity={editing.ignoreQuantity}
                        isEdit
                        onSave={handleSave}
                        onCancel={() => setEditing(undefined)}
                    />
                )}
            </Col>
        </Row>
    );
}
