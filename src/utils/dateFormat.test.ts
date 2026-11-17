import { formatDate } from './dateFormat';

describe('formatDate', () => {
    it('formats with two-digit day, month and year', () => {
        expect(formatDate(new Date(2027, 2, 5))).toBe('05.03.27');
        expect(formatDate(new Date(2026, 11, 17))).toBe('17.12.26');
    });
});
