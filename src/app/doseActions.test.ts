import Dose from '../models/Dose';
import IMedicine from '../models/IMedicine';
import OverdueDose from '../models/OverdueDoses';
import OverdueDoseGroup from '../models/OverdueDosesGroup';
import { formatAmount, parseAmount } from '../utils/fraction';
import { applyDoseAction } from './doseActions';

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
});
