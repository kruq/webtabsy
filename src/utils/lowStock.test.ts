import IMedicine from '../models/IMedicine';
import { lowStockMedicines } from './lowStock';

const tomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
};

/** Lek z jedną dawką 1 dziennie od jutra (aktywny plan): zapas N = na ile dni starcza. */
function scheduled(name: string, count: number, extra: Partial<IMedicine> = {}): IMedicine {
    return {
        id: name, name, meal: '', description: '', count, isVisible: true, hideWhenEmpty: false, purchases: [],
        doses: [{ id: `${name}-d`, amount: 1, numberOfDays: 1, nextDoseDate: tomorrow(), endDate: null } as never],
        ...extra,
    };
}

const names = (medicines: IMedicine[]) => lowStockMedicines(medicines).map(m => `${m.medicine.name}:${m.level}`);

describe('lowStockMedicines', () => {
    it('lists scheduled medicines below 8 days of stock, red ones first', () => {
        expect(names([scheduled('Ok', 30), scheduled('Low', 6), scheduled('Critical', 3), scheduled('Empty', 0)]))
            .toEqual(['Empty:empty', 'Critical:critical', 'Low:low']);
    });

    it('skips "Ukryj jeśli brakuje leku" and medicines without doses to take', () => {
        expect(names([scheduled('Hidden', 0, { hideWhenEmpty: true }), scheduled('Finished', 0, { doses: [] })])).toEqual([]);
    });

    it('lists as-needed medicines with less than 7 units unless the warning is off', () => {
        const asNeeded = (name: string, count: number, extra: Partial<IMedicine> = {}) =>
            scheduled(name, count, { asNeeded: true, doses: [], ...extra });
        expect(names([asNeeded('Seven', 7), asNeeded('Six', 6), asNeeded('Zero', 0), asNeeded('Off', 1, { noLowStockWarning: true })]))
            .toEqual(['Zero:empty', 'Six:low']);
    });

    it('lists medicines without quantity control only when marked "Kończy się"', () => {
        expect(names([
            scheduled('Spray', 0, { ignoreQuantity: true, runningOut: true }),
            scheduled('Other', 0, { ignoreQuantity: true }),
        ])).toEqual(['Spray:low']);
    });
});
