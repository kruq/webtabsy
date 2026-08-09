import { formatAmount, formatAmountForDisplay, parseAmount, roundAmount, subtractAmount } from './fraction';

describe('parseAmount', () => {
    it('parses whole numbers', () => {
        expect(parseAmount('2')).toBe(2);
        expect(parseAmount(' 10 ')).toBe(10);
    });

    it('parses simple fractions', () => {
        expect(parseAmount('1/2')).toBe(0.5);
        expect(parseAmount('1/3')).toBeCloseTo(1 / 3, 10);
        expect(parseAmount('2 / 4')).toBe(0.5);
    });

    it('parses mixed fractions', () => {
        expect(parseAmount('1 1/2')).toBe(1.5);
        expect(parseAmount('1 1/3')).toBeCloseTo(4 / 3, 10);
        expect(parseAmount('2  2/3')).toBeCloseTo(8 / 3, 10);
    });

    it('parses decimals with dot and comma', () => {
        expect(parseAmount('1.5')).toBe(1.5);
        expect(parseAmount('1,5')).toBe(1.5);
    });

    it('accepts fraction glyphs, so a displayed value can be pasted back in', () => {
        expect(parseAmount('½')).toBe(0.5);
        expect(parseAmount('1½')).toBe(1.5);
        expect(parseAmount('8⅔')).toBeCloseTo(26 / 3, 10);
        expect(parseAmount(formatAmountForDisplay(4 / 3))).toBeCloseTo(4 / 3, 10);
    });

    it('rejects invalid input', () => {
        expect(parseAmount('')).toBeUndefined();
        expect(parseAmount('   ')).toBeUndefined();
        expect(parseAmount('abc')).toBeUndefined();
        expect(parseAmount('1/0')).toBeUndefined();
        expect(parseAmount('1 1/')).toBeUndefined();
        expect(parseAmount('-1')).toBeUndefined();
    });
});

describe('formatAmount', () => {
    it('formats whole numbers without a fraction part', () => {
        expect(formatAmount(10)).toBe('10');
        expect(formatAmount(0)).toBe('0');
    });

    it('formats proper fractions', () => {
        expect(formatAmount(0.5)).toBe('1/2');
        expect(formatAmount(1 / 3)).toBe('1/3');
        expect(formatAmount(2 / 3)).toBe('2/3');
    });

    it('formats mixed fractions', () => {
        expect(formatAmount(1.5)).toBe('1 1/2');
        expect(formatAmount(4 / 3)).toBe('1 1/3');
        expect(formatAmount(26 / 3)).toBe('8 2/3');
    });

    it('formats values that survived the float32 round-trip through the API', () => {
        expect(formatAmount(8.666667)).toBe('8 2/3');
        expect(formatAmount(Math.fround(26 / 3))).toBe('8 2/3');
        expect(formatAmount(Math.fround(4 / 3))).toBe('1 1/3');
    });

    it('falls back to a decimal for values that are not simple fractions', () => {
        expect(formatAmount(0.123)).toBe('0.12');
    });

    it('handles negatives and empty values', () => {
        expect(formatAmount(-1.5)).toBe('-1 1/2');
        expect(formatAmount(undefined)).toBe('');
        expect(formatAmount(NaN)).toBe('');
    });
});

describe('formatAmountForDisplay', () => {
    it('uses fraction glyphs where they exist', () => {
        expect(formatAmountForDisplay(0.5)).toBe('½');
        expect(formatAmountForDisplay(1 / 3)).toBe('⅓');
        expect(formatAmountForDisplay(0.75)).toBe('¾');
        expect(formatAmountForDisplay(1 / 8)).toBe('⅛');
    });

    it('glues the glyph to the whole part', () => {
        expect(formatAmountForDisplay(1.5)).toBe('1½');
        expect(formatAmountForDisplay(4 / 3)).toBe('1⅓');
        expect(formatAmountForDisplay(8.666667)).toBe('8⅔');
    });

    it('falls back to n/d when no glyph exists', () => {
        expect(formatAmountForDisplay(1 / 12)).toBe('1/12');
        expect(formatAmountForDisplay(1 + 1 / 12)).toBe('1 1/12');
        expect(formatAmountForDisplay(0.3)).toBe('3/10');
    });

    it('behaves like formatAmount for whole numbers and empty values', () => {
        expect(formatAmountForDisplay(10)).toBe('10');
        expect(formatAmountForDisplay(0)).toBe('0');
        expect(formatAmountForDisplay(undefined)).toBe('');
    });

    it('handles negatives', () => {
        expect(formatAmountForDisplay(-1.5)).toBe('-1½');
    });
});

describe('subtractAmount', () => {
    it('subtracts a fractional dose exactly', () => {
        expect(formatAmount(subtractAmount(10, 4 / 3))).toBe('8 2/3');
        expect(formatAmount(subtractAmount(10, 0.5))).toBe('9 1/2');
    });

    it('produces the expected sequence when taking 1 1/3 from a stock of 10', () => {
        const amount = parseAmount('1 1/3') as number;
        const sequence: string[] = [];
        let count = 10;
        for (let i = 0; i < 5; i++) {
            count = subtractAmount(count, amount);
            sequence.push(formatAmount(count));
        }
        expect(sequence).toEqual(['8 2/3', '7 1/3', '6', '4 2/3', '3 1/3']);
    });

    it('keeps the sequence stable across float32 round-trips through the API', () => {
        const amount = Math.fround(parseAmount('1 1/3') as number);
        const sequence: string[] = [];
        let count = 10;
        for (let i = 0; i < 5; i++) {
            count = Math.fround(subtractAmount(count, amount));
            sequence.push(formatAmount(count));
        }
        expect(sequence).toEqual(['8 2/3', '7 1/3', '6', '4 2/3', '3 1/3']);
    });

    it('falls back to plain subtraction for values that are not simple fractions', () => {
        expect(subtractAmount(0.123, 0.023)).toBeCloseTo(0.1, 6);
    });
});

describe('roundAmount', () => {
    it('snaps values close to a simple fraction', () => {
        expect(roundAmount(8.666667)).toBeCloseTo(26 / 3, 10);
        expect(roundAmount(2.0000001)).toBe(2);
    });

    it('leaves other values as they are', () => {
        expect(roundAmount(0.123)).toBe(0.123);
    });
});
