import Dose from '../models/Dose';
import IMedicine from '../models/IMedicine';
import { formatAmount } from './fraction';
import { forecastStock } from './medicineMath';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function today(): Date {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
}

function inDays(offset: number, hours = 8): Date {
    const date = new Date(today().getTime() + offset * MS_PER_DAY);
    date.setHours(hours, 0, 0, 0);
    return date;
}

function dose(overrides: Partial<Dose> = {}): Dose {
    return {
        id: `dose-${Math.round(Math.random() * 1e9)}`,
        time: '08:00',
        amount: 1,
        numberOfDays: 1,
        nextDoseDate: inDays(0),
        endDate: null,
        ...overrides,
    };
}

function medicine(count: number, doses: Dose[]): IMedicine {
    return {
        id: 'medicine-1',
        name: 'Metformina',
        meal: '',
        description: '',
        count,
        isVisible: true,
        hideWhenEmpty: false,
        doses,
        purchases: [],
    };
}

/** Liczba dni między dziś a datą ostatniego dnia, dla sprawdzenia spójności z polem days. */
function offsetOf(date: Date): number {
    return Math.round((date.getTime() - today().getTime()) / MS_PER_DAY);
}

describe('forecastStock', () => {
    it('counts a daily dose starting today', () => {
        // 10 tabletek, 1 tab. dziennie od dziś: ostatnia dawka za 9 dni.
        const result = forecastStock(medicine(10, [dose()]));

        expect(result?.days).toBe(9);
        expect(result?.coversWholePlan).toBe(false);
        expect(offsetOf(result!.lastDay)).toBe(9);
    });

    it('respects the interval between doses', () => {
        // 1 tab. co 3 dni: 30 tabletek wystarcza na 30 dawek, czyli 87 dni.
        const result = forecastStock(medicine(30, [dose({ numberOfDays: 3 })]));

        expect(result?.days).toBe(87);
    });

    it('ignores a dose that has not started yet', () => {
        // Dawka startuje za 10 dni, więc zapas wystarcza do dnia 10 + 9.
        const result = forecastStock(medicine(10, [dose({ nextDoseDate: inDays(10) })]));

        expect(result?.days).toBe(19);
    });

    it('stops consuming stock after the end date', () => {
        // Dawka kończy się za 4 dni (5 dawek), 10 tabletek zostaje z nadwyżką.
        const result = forecastStock(medicine(10, [dose({ endDate: inDays(4, 23) })]));

        expect(result?.coversWholePlan).toBe(true);
        expect(result?.days).toBe(4);
    });

    it('reports a shortage when the stock runs out before the end date', () => {
        const result = forecastStock(medicine(3, [dose({ endDate: inDays(30, 23) })]));

        expect(result?.coversWholePlan).toBe(false);
        expect(result?.days).toBe(2);
    });

    it('combines doses that overlap only for part of the period', () => {
        // Dzień 0-1: 2 tab./dzień (obie dawki), od dnia 2: 1 tab./dzień.
        // 10 tabletek: dzień 0 -> 8, dzień 1 -> 6, potem po 1 dziennie do dnia 7.
        const result = forecastStock(medicine(10, [
            dose(),
            dose({ endDate: inDays(1, 23) }),
        ]));

        expect(result?.days).toBe(7);
    });

    it('handles fractional amounts', () => {
        // 10 tabletek, 1 1/3 na dawkę: 7 pełnych dawek (dni 0-6), na dzień 7 brakuje.
        const result = forecastStock(medicine(10, [dose({ amount: 4 / 3 })]));

        expect(result?.days).toBe(6);
        expect(result?.coversWholePlan).toBe(false);
    });

    it('treats an overdue dose as due today', () => {
        const result = forecastStock(medicine(10, [dose({ nextDoseDate: inDays(-5) })]));

        expect(result?.days).toBe(9);
    });

    it('returns undefined when there is no stock', () => {
        expect(forecastStock(medicine(0, [dose()]))).toBeUndefined();
    });

    it('returns undefined when every dose has already ended', () => {
        expect(forecastStock(medicine(10, [dose({ endDate: inDays(-1, 23) })]))).toBeUndefined();
    });

    it('returns undefined when there are no doses at all', () => {
        expect(forecastStock(medicine(10, []))).toBeUndefined();
    });

    it('returns zero days when the stock cannot cover even the first dose', () => {
        const result = forecastStock(medicine(0.5, [dose({ amount: 1 })]));

        expect(result?.days).toBe(0);
        expect(result?.coversWholePlan).toBe(false);
        expect(formatAmount(0.5)).toBe('1/2');
    });

    it('ignores doses with a non-positive amount instead of looping forever', () => {
        expect(forecastStock(medicine(10, [dose({ amount: 0 })]))).toBeUndefined();
    });
});
