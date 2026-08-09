import React from 'react';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Dose from '../models/Dose';
import { getDaysText } from '../text.helpers';
import { formatAmount } from '../utils/fraction';

interface DoseListProps {
    doses: Dose[];
    onEdit: (dose: Dose) => void;
    onRemove: (dose: Dose) => void;
}

const DATE_OPTIONS: Intl.DateTimeFormatOptions = { year: '2-digit', month: '2-digit', day: 'numeric' };

function startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}

export default function DoseList({ doses, onEdit, onRemove }: DoseListProps) {
    const today = startOfDay(new Date());
    const sortedDoses = [...doses].sort((a, b) => b.nextDoseDate.getTime() - a.nextDoseDate.getTime());

    return (
        <Table size="sm">
            <tbody>
                {sortedDoses.map(dose => {
                    const startWindowEnd = new Date(today);
                    startWindowEnd.setDate(startWindowEnd.getDate() + (dose.numberOfDays ?? 1));
                    const isCurrent = startOfDay(dose.nextDoseDate) <= startWindowEnd
                        && (!dose.endDate || startOfDay(dose.endDate) >= today);
                    return (
                        <tr key={`medicine-dose-${dose.id}`} className={!isCurrent ? 'text-secondary' : undefined}>
                            <td width="auto">
                                <Button variant="link" onClick={() => onEdit(dose)}>{dose.time}</Button>
                            </td>
                            <td width="auto" className="text-end">{formatAmount(dose.amount)} tab.</td>
                            <td width="auto">{getDaysText(dose.numberOfDays ?? 1)}</td>
                            <td style={{ textAlign: 'right', paddingRight: '5px' }}>
                                {dose.nextDoseDate.toLocaleDateString('pl-PL', DATE_OPTIONS)}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                                {dose.endDate
                                    ? dose.endDate.toLocaleDateString('pl-PL', DATE_OPTIONS)
                                    : <small className="text-secondary">bez końca</small>}
                            </td>
                            <td className="text-end">
                                <Button onClick={() => onRemove(dose)} variant="link" className="text-danger">Usuń</Button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </Table>
    );
}
