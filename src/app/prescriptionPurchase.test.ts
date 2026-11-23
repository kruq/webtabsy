import IMedicine from '../models/IMedicine';
import Prescription, { PrescriptionItem } from '../models/Prescription';
import { applyPrescriptionPurchase } from './prescriptionPurchase';

const PURCHASE_DATE = new Date('2026-11-20T00:00:00');

function medicine(id: string, count: number): IMedicine {
    return {
        id,
        name: id,
        meal: '',
        description: '',
        count,
        isVisible: true,
        hideWhenEmpty: false,
        doses: [{ id: 'd', time: '08:00', amount: 1, numberOfDays: 1, nextDoseDate: new Date('2026-11-01T08:00:00'), endDate: null }],
        purchases: [],
    };
}

function item(id: string, medicineId: string, packages: number, packageSize: number, purchasedPackages = 0): PrescriptionItem {
    return { id, medicineId, medicineName: medicineId, packages, packageSize, purchasedPackages };
}

function prescription(items: PrescriptionItem[]): Prescription {
    return { id: 'p', issueDate: '2026-11-17', validity: 'annual', code: '', doctor: '', specialization: '', note: '', items };
}

describe('applyPrescriptionPurchase', () => {
    it('ignores items with 0 packages and updates the others', () => {
        const p = prescription([item('a', 'apap', 3, 20), item('b', 'ibuprom', 2, 10)]);

        const result = applyPrescriptionPurchase(
            p,
            [medicine('apap', 5), medicine('ibuprom', 0)],
            [{ itemId: 'a', packages: 2, totalPrice: 25 }, { itemId: 'b', packages: 0 }],
            PURCHASE_DATE,
        );

        expect(result.prescription.items.map(i => i.purchasedPackages)).toEqual([2, 0]);
        expect(result.medicines).toHaveLength(1);
        expect(result.medicines[0].count).toBe(5 + 2 * 20);
        expect(result.medicines[0].purchases).toHaveLength(2);
        expect(result.medicines[0].purchases[0]).toMatchObject({ date: PURCHASE_DATE, numberOfTablets: 20, price: 12.5 });
    });

    it('leaves the price empty when it was not given and rounds it to grosze', () => {
        const p = prescription([item('a', 'apap', 3, 20), item('b', 'ibuprom', 3, 10)]);

        const result = applyPrescriptionPurchase(
            p,
            [medicine('apap', 0), medicine('ibuprom', 0)],
            [{ itemId: 'a', packages: 1 }, { itemId: 'b', packages: 3, totalPrice: 10 }],
            PURCHASE_DATE,
        );

        expect(result.medicines.find(m => m.id === 'apap')?.purchases[0].price).toBeUndefined();
        expect(result.medicines.find(m => m.id === 'ibuprom')?.purchases[0].price).toBe(3.33);
    });

    it('adds up two items of the same medicine', () => {
        const p = prescription([item('a', 'apap', 1, 20), item('b', 'apap', 1, 10)]);

        const result = applyPrescriptionPurchase(
            p,
            [medicine('apap', 1)],
            [{ itemId: 'a', packages: 1 }, { itemId: 'b', packages: 1 }],
            PURCHASE_DATE,
        );

        expect(result.medicines).toHaveLength(1);
        expect(result.medicines[0].count).toBe(31);
        expect(result.medicines[0].purchases).toHaveLength(2);
    });

    it('resets the next dose date only for the requested medicines', () => {
        const now = new Date('2026-11-20T10:00:00');
        const p = prescription([item('a', 'apap', 1, 20), item('b', 'ibuprom', 1, 10)]);

        const result = applyPrescriptionPurchase(
            p,
            [medicine('apap', 0), medicine('ibuprom', 0)],
            [{ itemId: 'a', packages: 1 }, { itemId: 'b', packages: 1 }],
            PURCHASE_DATE,
            new Set(['apap']),
            now,
        );

        expect(result.medicines.find(m => m.id === 'apap')?.doses[0].nextDoseDate).toBe(now);
        expect(result.medicines.find(m => m.id === 'ibuprom')?.doses[0].nextDoseDate).not.toBe(now);
    });

    it('refuses more packages than remain on the prescription', () => {
        const p = prescription([item('a', 'apap', 2, 20, 1)]);

        expect(() =>
            applyPrescriptionPurchase(p, [medicine('apap', 0)], [{ itemId: 'a', packages: 2 }], PURCHASE_DATE),
        ).toThrow();
    });
});

describe('applyPrescriptionPurchase without quantity control', () => {
    it('records the purchase without an amount and keeps the medicine count', () => {
        const p = prescription([item('a', 'spray', 2, 0)]);
        const spray = { ...medicine('spray', 7), ignoreQuantity: true };

        const result = applyPrescriptionPurchase(p, [spray], [{ itemId: 'a', packages: 1, totalPrice: 20 }], PURCHASE_DATE);

        expect(result.prescription.items[0].purchasedPackages).toBe(1);
        expect(result.medicines[0].count).toBe(7);
        expect(result.medicines[0].purchases).toEqual([expect.objectContaining({ numberOfTablets: 0, price: 20 })]);
    });
});
