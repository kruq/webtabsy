import IMedicine from '../models/IMedicine';
import { selectAsNeededMedicines } from './AsNeededPanel';

function medicine(name: string, count: number, asNeeded?: boolean): IMedicine {
    return {
        id: name,
        name,
        meal: '',
        description: '',
        count,
        isVisible: true,
        hideWhenEmpty: false,
        asNeeded,
        doses: [],
        purchases: [],
    };
}

describe('selectAsNeededMedicines', () => {
    it('returns only as-needed medicines with stock, sorted by name', () => {
        const result = selectAsNeededMedicines([
            medicine('Ibuprom', 10, true),
            medicine('apap', 5, true),
            medicine('Metformina', 30, false),
            medicine('Euthyrox', 20),
            medicine('Nospa', 0, true),
            medicine('Żelazo', 0.5, true),
            medicine('Cetyryzyna', 3, true),
        ]);

        expect(result.map(m => m.name)).toEqual(['apap', 'Cetyryzyna', 'Ibuprom', 'Żelazo']);
    });

    it('sorts Polish letters in alphabetical order', () => {
        const result = selectAsNeededMedicines([
            medicine('Żel', 1, true),
            medicine('Zyrtec', 1, true),
            medicine('Ślaz', 1, true),
            medicine('Sudafed', 1, true),
        ]);

        expect(result.map(m => m.name)).toEqual(['Sudafed', 'Ślaz', 'Zyrtec', 'Żel']);
    });

    it('does not mutate the input array', () => {
        const input = [medicine('B', 1, true), medicine('A', 1, true)];

        selectAsNeededMedicines(input);

        expect(input.map(m => m.name)).toEqual(['B', 'A']);
    });
});

describe('selectAsNeededMedicines without quantity control', () => {
    it('skips medicines that ignore quantity', () => {
        const spray = { ...medicine('Aerozol', 5, true), ignoreQuantity: true };

        expect(selectAsNeededMedicines([spray, medicine('Apap', 5, true)]).map(m => m.name)).toEqual(['Apap']);
    });
});
