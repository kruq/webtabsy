import IMedicine from '../models/IMedicine';
import { DraftPrescriptionItem, resolveNewMedicines } from './prescriptionDraft';

function medicine(id: string, name: string): IMedicine {
    return { id, name, meal: '', description: '', count: 0, isVisible: true, hideWhenEmpty: false, doses: [], purchases: [] };
}

function item(id: string, medicineId: string, newMedicineName?: string): DraftPrescriptionItem {
    return { id, medicineId, medicineName: newMedicineName ?? medicineId, packages: 1, packageSize: 30, purchasedPackages: 0, newMedicineName };
}

describe('resolveNewMedicines', () => {
    it('keeps existing items and creates each new medicine once', async () => {
        const create = jest.fn(async (name: string) => medicine(`new-${name}`, name));

        const result = await resolveNewMedicines(
            [item('a', 'med-1'), item('b', '', 'Apap'), item('c', '', ' apap ')],
            [medicine('med-1', 'Metformina')],
            create,
        );

        expect(create).toHaveBeenCalledTimes(1);
        expect(result.createdAny).toBe(true);
        expect(result.items.map(i => i.medicineId)).toEqual(['med-1', 'new-Apap', 'new-Apap']);
        expect(result.items.some(i => 'newMedicineName' in i)).toBe(false);
    });

    it('reuses a medicine already on the list instead of creating a duplicate', async () => {
        const create = jest.fn();

        const result = await resolveNewMedicines([item('a', '', 'METFORMINA')], [medicine('med-1', 'Metformina')], create);

        expect(create).not.toHaveBeenCalled();
        expect(result.createdAny).toBe(false);
        expect(result.items[0]).toMatchObject({ medicineId: 'med-1', medicineName: 'Metformina' });
    });

    it('creates a new medicine without quantity control when asked', async () => {
        const create = jest.fn(async (name: string) => medicine(`new-${name}`, name));

        const result = await resolveNewMedicines(
            [{ ...item('a', '', 'Aerozol'), packageSize: 0, newMedicineIgnoreQuantity: true }, item('b', '', 'Apap')],
            [],
            create,
        );

        expect(create).toHaveBeenNthCalledWith(1, 'Aerozol', true);
        expect(create).toHaveBeenNthCalledWith(2, 'Apap', false);
        expect(result.items.some(i => 'newMedicineIgnoreQuantity' in i)).toBe(false);
    });
});
