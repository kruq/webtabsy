import React from 'react';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import _ from 'lodash';
import { MS_PER_DAY, SCHEDULE_WINDOW_DAYS } from './constants';
import Dose from './models/Dose';
import IMedicine from './models/IMedicine';
import { getDateText, getDaysText } from './text.helpers';

interface IScheduleProps {
    medicines: IMedicine[];
}

interface ScheduleEntry {
    dose: Dose;
    name: string;
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
            .map(dose => ({ dose, name: m.name })));
}

export default function Schedule({ medicines }: IScheduleProps) {
    const groupsByTime = Object.entries(_.groupBy(buildScheduleEntries(medicines), e => e.dose.time))
        .sort((a, b) => (a[0] > b[0] ? 1 : -1));

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
                                            <Row key={`schedule-dose-${entry.dose.id}`}>
                                                <Col md={4} sm={8} xs={12}>
                                                    <strong>{entry.dose.amount} x {entry.name}</strong>
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
            </Col>
        </Row>
    );
}
