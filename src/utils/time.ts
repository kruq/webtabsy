/**
 * Poprawna godzina jako „HH:MM” albo undefined. Przyjmuje „8:30”, „08:30”, „830” i „0830”;
 * godzina 0-23, minuty 0-59.
 */
export function parseTimeOfDay(raw: string): string | undefined {
    const match = /^(\d{1,2}):?(\d{2})$/.exec(raw.trim());
    if (!match) return undefined;
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    if (hours > 23 || minutes > 59) return undefined;
    return `${String(hours).padStart(2, '0')}:${match[2]}`;
}

/**
 * Wpisywana godzina z dwukropkiem wstawionym przed dwiema ostatnimi cyframi - jak w okienku dawki:
 * „1200” → „12:00”, „830” → „8:30”, „1:200” → „12:00” (kolejna cyfra). Inny tekst zostaje bez zmian.
 */
export function formatTimeInput(raw: string): string {
    const digits = raw.replaceAll(':', '');
    if (!/^\d{3,4}$/.test(digits) || !/^\d?:?\d:?\d\d$/.test(raw)) return raw;
    return `${digits.slice(0, -2)}:${digits.slice(-2)}`;
}

/** Ta sama data z godziną „HH:MM” (czas lokalny). */
export function withTimeOfDay(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const result = new Date(date.getTime());
    result.setHours(hours, minutes, 0, 0);
    return result;
}
