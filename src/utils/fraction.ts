const DENOMINATORS = [1, 2, 3, 4, 5, 6, 8, 10, 12];
// Tolerancja musi przetrwać konwersję do float32 po stronie API (26/3 wraca jako 8.666667),
// a jednocześnie być mniejsza niż połowa najmniejszego odstępu między ułamkami (1/132).
const RELATIVE_EPS = 1e-5;
const MAX_EPS = 0.002;

interface Fraction {
    n: number;
    d: number;
}

export const AMOUNT_HINT = 'np. 1, 1/2, 1 1/3';

const AMOUNT_PATTERN = /^(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)$/;
const DECIMAL_PATTERN = /^\d+(?:[.,]\d+)?$/;

function gcd(a: number, b: number): number {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y !== 0) {
        [x, y] = [y, x % y];
    }
    return x === 0 ? 1 : x;
}

export function toFraction(value: number): Fraction | undefined {
    if (!isFinite(value)) return undefined;
    const tolerance = Math.min(RELATIVE_EPS * Math.max(1, Math.abs(value)), MAX_EPS);
    for (const d of DENOMINATORS) {
        const scaled = value * d;
        const rounded = Math.round(scaled);
        if (Math.abs(scaled - rounded) < tolerance * d) {
            const divisor = gcd(rounded, d);
            return { n: rounded / divisor, d: d / divisor };
        }
    }
    return undefined;
}

export function parseAmount(raw: string): number | undefined {
    const text = raw.trim().replace(/\s+/g, ' ');
    if (!text) return undefined;

    const fractionMatch = AMOUNT_PATTERN.exec(text);
    if (fractionMatch) {
        const [, wholePart, numerator, denominator] = fractionMatch;
        const d = parseInt(denominator, 10);
        if (d === 0) return undefined;
        const whole = wholePart ? parseInt(wholePart, 10) : 0;
        return whole + parseInt(numerator, 10) / d;
    }

    if (DECIMAL_PATTERN.test(text)) {
        const value = parseFloat(text.replace(',', '.'));
        return isNaN(value) ? undefined : value;
    }

    return undefined;
}

function formatDecimal(value: number): string {
    return parseFloat(value.toFixed(2)).toString();
}

export function formatAmount(value: number | undefined | null): string {
    if (value === undefined || value === null || isNaN(value)) return '';

    const sign = value < 0 ? '-' : '';
    const absolute = Math.abs(value);
    const fraction = toFraction(absolute);
    if (!fraction) return sign + formatDecimal(absolute);

    const whole = Math.floor(fraction.n / fraction.d);
    const remainder = fraction.n - whole * fraction.d;
    if (remainder === 0) return `${sign}${whole}`;
    if (whole === 0) return `${sign}${remainder}/${fraction.d}`;
    return `${sign}${whole} ${remainder}/${fraction.d}`;
}

export function roundAmount(value: number): number {
    const fraction = toFraction(value);
    if (!fraction) return Number(value.toFixed(6));
    return fraction.n / fraction.d;
}

export function subtractAmount(a: number, b: number): number {
    const left = toFraction(a);
    const right = toFraction(b);
    if (!left || !right) return Number((a - b).toFixed(6));

    const denominator = (left.d * right.d) / gcd(left.d, right.d);
    const numerator = left.n * (denominator / left.d) - right.n * (denominator / right.d);
    return numerator / denominator;
}
