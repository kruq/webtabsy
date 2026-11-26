import moment from 'moment';
import { weekDays } from '../text.helpers';

export function formatDoseTimestamp(date: Date): string {
    if (date.getDate() === new Date().getDate()) {
        return `dziś o ${moment(date).format('HH:mm')}`;
    }
    return `${weekDays[date.getDay()]}. ${date.getDate()} o ${moment(date).format('HH:mm')}`;
}

function startOfDay(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Ten sam dzień kalendarzowy (czas lokalny). */
export function sameDay(a: Date, b: Date): boolean {
    return startOfDay(a) === startOfDay(b);
}

const SHORT_WEEKDAYS = ['Nd', 'Pn', 'Wt', 'Śr', 'Czw', 'Pt', 'Sb'];

/** Dzień na kresce między dniami na Statusie: „dziś”, „wczoraj”, „jutro” albo np. „Pn. 24.11.26”. */
export function formatDayLabel(date: Date, today: Date = new Date()): string {
    const diff = Math.round((startOfDay(date) - startOfDay(today)) / 86400000);
    if (diff === 0) return 'dziś';
    if (diff === -1) return 'wczoraj';
    if (diff === 1) return 'jutro';
    return `${SHORT_WEEKDAYS[date.getDay()]}. ${formatDate(date)}`;
}

export function formatYmd(date: Date | null | undefined): string | undefined {
    if (!date) return undefined;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

/** Wspólny format zwykłych dat w aplikacji: dd.MM.yy, np. 05.03.27. */
export function formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear() % 100).padStart(2, '0');
    return `${day}.${month}.${year}`;
}
