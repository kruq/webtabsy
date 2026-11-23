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
import { formatAmountForDisplay } from './utils/fraction';
import EmptyState from './app/EmptyState';
import DoseDialog from './medicine/DoseDialog';

interface IScheduleProps {
    medicines: IMedicine[];
    /** Zapis dawki zmienionej w okienku edycji (to samo okienko co w karcie leku). */
    onSaveDose: (medicineId: string, dose: Dose) => Promise<void>;
}

interface ScheduleEntry {
    dose: Dose;
    name: string;
    medicineId: string;
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
        .filter(m => m.doses.length > 0 && (m.count > 0 || !m.hideWhenEmpty))
        .flatMap(m => m.doses
            .filter(isWithinScheduleWindow)
            .map(dose => ({ dose, name: m.name, medicineId: m.id })));
}

export default function Schedule({ medicines, onSaveDose }: IScheduleProps) {
    const [editing, setEditing] = useState<ScheduleEntry | undefined>(undefined);

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
                            <strong className="text-secondary">{time}</strong>
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
                                                        {formatAmountForDisplay(entry.dose.amount)} x {entry.name}
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
                {editing && (
                    <DoseDialog
                        visible
                        initialDose={editing.dose}
                        isEdit
                        onSave={handleSave}
                        onCancel={() => setEditing(undefined)}
                    />
                )}
            </Col>
        </Row>
    );
}
