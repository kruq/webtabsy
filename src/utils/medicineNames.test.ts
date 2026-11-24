import IMedicine from '../models/IMedicine';
import { isMedicineNameTaken, medicinesContaining } from './medicineNames';

function med(id: string, name: string): IMedicine {
    return { id, name, meal: '', description: '', count: 0, isVisible: true, hideWhenEmpty: false, doses: [], purchases: [] };
}

const medicines = [med('1', 'Metformina 500'), med('2', 'Asentra 50mg'), med('3', 'metformina XR')];

describe('isMedicineNameTaken', () => {
    it('ignores case and surrounding spaces', () => {
        expect(isMedicineNameTaken('  ASENTRA 50MG ', medicines)).toBe(true);
        expect(isMedicineNameTaken('Asentra', medicines)).toBe(false);
    });

    it('does not count the medicine being renamed', () => {
        expect(isMedicineNameTaken('asentra 50mg', medicines, '2')).toBe(false);
    });
});

describe('medicinesContaining', () => {
    it('needs more than 3 characters', () => {
        expect(medicinesContaining('met', medicines)).toEqual([]);
    });

    it('lists medicines containing the phrase, alphabetically, without the edited one', () => {
        expect(medicinesContaining('ETFO', medicines).map(m => m.id)).toEqual(['1', '3']);
        expect(medicinesContaining('etfo', medicines, '1').map(m => m.id)).toEqual(['3']);
    });
});
