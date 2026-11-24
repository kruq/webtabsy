import { formatTimeInput, parseTimeOfDay, withTimeOfDay } from './time';

describe('formatTimeInput', () => {
    it.each([
        ['1200', '12:00'],
        ['830', '8:30'],
        ['12:0', '12:0'],
        ['1:200', '12:00'],
        ['12:00', '12:00'],
        ['12', '12'],
        ['8:', '8:'],
        ['abc', 'abc'],
    ])('%s -> %s', (raw, expected) => {
        expect(formatTimeInput(raw)).toBe(expected);
    });
});

describe('parseTimeOfDay', () => {
    it.each([
        ['8:30', '08:30'],
        ['08:30', '08:30'],
        ['830', '08:30'],
        ['2359', '23:59'],
        [' 0:00 ', '00:00'],
    ])('%s -> %s', (raw, expected) => {
        expect(parseTimeOfDay(raw)).toBe(expected);
    });

    it.each(['24:00', '12:60', '8', '8:3', 'ab:cd', '', '123:45'])('rejects %s', raw => {
        expect(parseTimeOfDay(raw)).toBeUndefined();
    });
});

describe('withTimeOfDay', () => {
    it('keeps the day and sets the time', () => {
        const result = withTimeOfDay(new Date(2026, 10, 25, 20, 15, 30), '07:05');
        expect([result.getFullYear(), result.getMonth(), result.getDate(), result.getHours(), result.getMinutes(), result.getSeconds()])
            .toEqual([2026, 10, 25, 7, 5, 0]);
    });
});
