import DoseLogEntry from '../models/DoseLogEntry';
import { groupByDay } from './DoseLogView';

function entry(id: string, scheduledAt: string): DoseLogEntry {
    return {
        id,
        medicineId: 'medicine-1',
        medicineName: 'Metformina',
        doseId: 'dose-1',
        action: 'taken',
        amount: 1,
        scheduledAt: new Date(scheduledAt),
        loggedAt: new Date(scheduledAt),
        unscheduled: false,
    };
}

describe('groupByDay', () => {
    it('groups entries by local day, newest day and newest entry first', () => {
        const groups = groupByDay([
            entry('a', '2026-11-16T08:00:00'),
            entry('b', '2026-11-17T20:00:00'),
            entry('c', '2026-11-16T20:00:00'),
            entry('d', '2026-11-17T08:00:00'),
        ]);

        expect(groups.map(g => g.key)).toEqual(['2026-11-17', '2026-11-16']);
        expect(groups[0].entries.map(e => e.id)).toEqual(['b', 'd']);
        expect(groups[1].entries.map(e => e.id)).toEqual(['c', 'a']);
    });

    it('returns no groups for no entries', () => {
        expect(groupByDay([])).toEqual([]);
    });
});
