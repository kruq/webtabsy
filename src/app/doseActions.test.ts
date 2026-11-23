import Dose from '../models/Dose';
import IMedicine from '../models/IMedicine';
import OverdueDose from '../models/OverdueDoses';
import OverdueDoseGroup from '../models/OverdueDosesGroup';
import { formatAmount, parseAmount } from '../utils/fraction';
import { applyDoseAction, buildUnscheduledDoseLogEntry, withSavedDose } from './doseActions';

const AMOUNT = parseAmount('1 1/3') as number;
const NEXT_DOSE_DATE = new Date('2026-08-09T08:00:00');

function buildDose(amount: number): Dose {
    return {
        id: 'dose-1',
        time: '08:00',
        amount,
        numberOfDays: 1,
        nextDoseDate: new Date(NEXT_DOSE_DATE.getTime()),
        endDate: null,
    };
}

function buildMedicine(count: number, amount: number): IMedicine {
    return {
        id: 'medicine-1',
        name: 'Metformina',
        meal: '',
        description: '',
        count,
        isVisible: true,
        hideWhenEmpty: false,
        doses: [buildDose(amount)],
        purchases: [],
    };
}

function buildOverdueDose(amount: number): OverdueDose {
    return new OverdueDose({
        id: 'dose-1',
        amount,
        numberOfDays: 1,
        nextDoseDate: new Date(NEXT_DOSE_DATE.getTime()),
        medicineName: 'Metformina',
        meal: '',
        time: '08:00',
        endDate: null,
    });
}

function buildScenario(count: number, amount: number) {
    const medicine = buildMedicine(count, amount);
    const overdueDose = buildOverdueDose(amount);
    const group = new OverdueDoseGroup({ time: new Date(NEXT_DOSE_DATE.getTime()), doses: [overdueDose] });
    return { medicines: [medicine], groups: [group], group, overdueDose };
}

describe('applyDoseAction', () => {
    it('confirms a dose of a medicine without quantity control and leaves the stock alone', () => {
        const { medicines, groups, group, overdueDose } = buildScenario(0, 1);
        const untracked = [{ ...medicines[0], ignoreQuantity: true }];

        const result = applyDoseAction(untracked, groups, group, overdueDose, 'confirm');

        expect(result.medicineToPersist?.count).toBe(0);
        expect(result.medicineToPersist?.doses[0].nextDoseDate.getTime()).toBeGreaterThan(NEXT_DOSE_DATE.getTime());
        expect(result.overdueGroups).toHaveLength(0);
    });

    it('subtracts a fractional dose from the stock', () => {
        const { medicines, groups, group, overdueDose } = buildScenario(10, AMOUNT);

        const result = applyDoseAction(medicines, groups, group, overdueDose, 'confirm');

        expect(formatAmount(result.medicineToPersist?.count)).toBe('8 2/3');
        expect(formatAmount(result.medicines[0].count)).toBe('8 2/3');
    });

    it('produces the expected sequence over repeated confirmations', () => {
        let scenario = buildScenario(10, AMOUNT);
        const sequence: string[] = [];

        for (let i = 0; i < 5; i++) {
            const result = applyDoseAction(
                scenario.medicines,
                scenario.groups,
                scenario.group,
                scenario.overdueDose,
                'confirm',
            );
            sequence.push(formatAmount(result.medicines[0].count));

            // Kolejny dzień: świeża grupa zaległych dawek dla zaktualizowanego stanu leku.
            const overdueDose = buildOverdueDose(AMOUNT);
            const group = new OverdueDoseGroup({ time: new Date(NEXT_DOSE_DATE.getTime()), doses: [overdueDose] });
            scenario = { medicines: result.medicines, groups: [group], group, overdueDose };
        }

        expect(sequence).toEqual(['8 2/3', '7 1/3', '6', '4 2/3', '3 1/3']);
    });

    it('leaves the stock untouched when the dose is skipped', () => {
        const { medicines, groups, group, overdueDose } = buildScenario(10, AMOUNT);

        const result = applyDoseAction(medicines, groups, group, overdueDose, 'skip');

        expect(result.medicines[0].count).toBe(10);
        expect(result.medicineToPersist?.count).toBe(10);
    });

    it('advances the next dose date and drops the dose from its group', () => {
        const { medicines, groups, group, overdueDose } = buildScenario(10, AMOUNT);

        const result = applyDoseAction(medicines, groups, group, overdueDose, 'confirm');

        expect(result.medicines[0].doses[0].nextDoseDate.getDate()).toBe(NEXT_DOSE_DATE.getDate() + 1);
        expect(result.overdueGroups).toHaveLength(0);
    });

    it('refuses to confirm when the stock is smaller than the dose', () => {
        const { medicines, groups, group, overdueDose } = buildScenario(0.5, 1);

        const result = applyDoseAction(medicines, groups, group, overdueDose, 'confirm');

        expect(result.medicineToPersist).toBeUndefined();
        expect(result.medicines[0].count).toBe(0.5);
    });

    describe('with a custom taken amount', () => {
        it('subtracts the custom amount instead of the default dose', () => {
            const { medicines, groups, group, overdueDose } = buildScenario(10, AMOUNT);

            const result = applyDoseAction(medicines, groups, group, overdueDose, 'confirm', parseAmount('1/2') as number);

            expect(formatAmount(result.medicineToPersist?.count)).toBe('9 1/2');
        });

        it('advances the next dose date exactly like a default confirmation', () => {
            const { medicines, groups, group, overdueDose } = buildScenario(10, AMOUNT);

            const result = applyDoseAction(medicines, groups, group, overdueDose, 'confirm', 2);

            expect(result.medicines[0].doses[0].nextDoseDate.getDate()).toBe(NEXT_DOSE_DATE.getDate() + 1);
            expect(result.medicines[0].doses[0].amount).toBe(AMOUNT);
            expect(result.overdueGroups).toHaveLength(0);
        });

        it('allows a smaller dose when the stock does not cover the default one', () => {
            const { medicines, groups, group, overdueDose } = buildScenario(0.5, 1);

            const result = applyDoseAction(medicines, groups, group, overdueDose, 'confirm', 0.5);

            expect(result.medicineToPersist?.count).toBe(0);
        });

        it('refuses an amount larger than the stock', () => {
            const { medicines, groups, group, overdueDose } = buildScenario(1, 1);

            const result = applyDoseAction(medicines, groups, group, overdueDose, 'confirm', 2);

            expect(result.medicineToPersist).toBeUndefined();
        });

        it('refuses a zero amount', () => {
            const { medicines, groups, group, overdueDose } = buildScenario(10, 1);

            const result = applyDoseAction(medicines, groups, group, overdueDose, 'confirm', 0);

            expect(result.medicineToPersist).toBeUndefined();
        });
    });
});

describe('buildUnscheduledDoseLogEntry', () => {
    it('records the moment the medicine was taken and marks it as unscheduled', () => {
        const takenAt = new Date('2026-11-17T13:45:00');

        const entry = buildUnscheduledDoseLogEntry({ id: 'medicine-1', name: 'Metformina' }, 2, takenAt);

        expect(entry).toEqual({
            medicineId: 'medicine-1',
            medicineName: 'Metformina',
            doseId: null,
            action: 'taken',
            amount: 2,
            scheduledAt: takenAt,
            unscheduled: true,
        });
    });
});

describe('withSavedDose', () => {
    it('replaces the edited dose and keeps the list sorted by time', () => {
        const morning = { ...buildDose(1), id: 'a', time: '08:00' };
        const evening = { ...buildDose(1), id: 'b', time: '20:00' };

        const result = withSavedDose([morning, evening], { ...evening, time: '06:30', amount: 2 });

        expect(result.map(d => [d.id, d.time, d.amount])).toEqual([['b', '06:30', 2], ['a', '08:00', 1]]);
    });
});
