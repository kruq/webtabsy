import { formatDate, formatDayLabel } from './dateFormat';

describe('formatDate', () => {
    it('formats with two-digit day, month and year', () => {
        expect(formatDate(new Date(2027, 2, 5))).toBe('05.03.27');
        expect(formatDate(new Date(2026, 11, 17))).toBe('17.12.26');
    });
});

describe('formatDayLabel', () => {
    const today = new Date(2026, 10, 26, 12, 0);

    it('names nearby days', () => {
        expect(formatDayLabel(new Date(2026, 10, 26, 8, 0), today)).toBe('dziś');
        expect(formatDayLabel(new Date(2026, 10, 25, 23, 0), today)).toBe('wczoraj');
        expect(formatDayLabel(new Date(2026, 10, 27, 1, 0), today)).toBe('jutro');
    });

    it('shows the weekday and date for other days', () => {
        expect(formatDayLabel(new Date(2026, 10, 23, 8, 0), today)).toBe('Pn. 23.11.26');
    });
});
