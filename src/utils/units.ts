import Unit from '../models/Unit';
import { formatAmountForDisplay } from './fraction';

/** Jednostka leków bez wybranej jednostki - ta sama, którą API zakłada przy starcie (Unit.DefaultId). */
export const DEFAULT_UNIT: Unit = {
    id: 'tabletka',
    nominativeSingular: 'tabletka',
    nominativePlural: 'tabletki',
    genitiveSingular: 'tabletki',
    genitivePlural: 'tabletek',
    abbreviation: 'tab.',
};

const WHOLE_TOLERANCE = 1e-6;

/**
 * Pełna nazwa jednostki po liczbie: 1 tabletka, ½ / 1½ tabletki, 2–4 tabletki (ale 12–14 tabletek),
 * 0, 5–21, 25… tabletek.
 */
export function unitName(unit: Unit, amount: number): string {
    const whole = Math.round(amount);
    if (Math.abs(amount - whole) > WHOLE_TOLERANCE) return unit.genitiveSingular;
    const n = Math.abs(whole);
    if (n === 1) return unit.nominativeSingular;
    const lastDigit = n % 10;
    const lastTwo = n % 100;
    if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return unit.nominativePlural;
    return unit.genitivePlural;
}

/** Liczba z pełną nazwą jednostki, np. „5 tabletek”. */
export function amountWithUnitName(amount: number, unit: Unit): string {
    return `${formatAmountForDisplay(amount)} ${unitName(unit, amount)}`;
}

/** Liczba ze skrótem jednostki, np. „3½ tab.” - skrót ma jedną formę. */
export function amountWithUnit(amount: number, unit: Unit): string {
    return `${formatAmountForDisplay(amount)} ${unit.abbreviation}`;
}

/** Etykieta „Ilość tabletek” / „Ilość mililitrów” - dopełniacz l.m. bez liczby. */
export function amountLabel(unit: Unit): string {
    return `Ilość ${unit.genitivePlural}`;
}

export function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}
