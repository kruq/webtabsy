import { amountLabel, amountWithUnit, amountWithUnitName, DEFAULT_UNIT, unitName } from './units';

describe('unitName', () => {
    it.each([
        [1, 'tabletka'],
        [0.5, 'tabletki'],
        [1.5, 'tabletki'],
        [1 / 3, 'tabletki'],
        [2, 'tabletki'],
        [4, 'tabletki'],
        [22, 'tabletki'],
        [104, 'tabletki'],
        [0, 'tabletek'],
        [5, 'tabletek'],
        [11, 'tabletek'],
        [12, 'tabletek'],
        [14, 'tabletek'],
        [21, 'tabletek'],
        [25, 'tabletek'],
        [112, 'tabletek'],
    ])('%s -> %s', (amount, expected) => {
        expect(unitName(DEFAULT_UNIT, amount)).toBe(expected);
    });

    it('treats float noise as a whole number', () => {
        expect(unitName(DEFAULT_UNIT, 2.0000001)).toBe('tabletki');
    });
});

describe('formatting', () => {
    const ml = { id: 'ml', nominativeSingular: 'mililitr', nominativePlural: 'mililitry', genitiveSingular: 'mililitra', genitivePlural: 'mililitrów', abbreviation: 'ml' };

    it('uses the abbreviation with numbers', () => {
        expect(amountWithUnit(3.5, DEFAULT_UNIT)).toBe('3½ tab.');
        expect(amountWithUnit(5, ml)).toBe('5 ml');
    });

    it('uses the declined full name where required', () => {
        expect(amountWithUnitName(5, DEFAULT_UNIT)).toBe('5 tabletek');
        expect(amountWithUnitName(1, ml)).toBe('1 mililitr');
        expect(amountWithUnitName(0.5, ml)).toBe('½ mililitra');
    });

    it('builds amount labels from the genitive plural', () => {
        expect(amountLabel(ml)).toBe('Ilość mililitrów');
    });
});
