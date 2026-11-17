import moment from 'moment';
import { weekDays } from '../text.helpers';

export function formatDoseTimestamp(date: Date): string {
    if (date.getDate() === new Date().getDate()) {
        return `dziś o ${moment(date).format('HH:mm')}`;
    }
    return `${weekDays[date.getDay()]}. ${date.getDate()} o ${moment(date).format('HH:mm')}`;
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
