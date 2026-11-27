import IMedicine from '../models/IMedicine';
import { forecastStock, hasActiveDoses, stockLevel } from './medicineMath';

/** Lek doraźny trafia do kończących się, gdy zostało mniej sztuk niż ta liczba. */
export const AS_NEEDED_LOW_STOCK = 7;

export type LowStockLevel = 'low' | 'critical' | 'empty';

export interface LowStockMedicine {
    medicine: IMedicine;
    /** low = pomarańczowy, critical/empty = czerwony (te same progi co pola z ilością na karcie dawki). */
    level: LowStockLevel;
    /** Na ile dni starcza zapas - tylko dla leków z planem dawkowania i zapasem > 0. */
    days?: number;
}

const LEVEL_ORDER: Record<LowStockLevel, number> = { empty: 0, critical: 1, low: 2 };

function lowStockOf(medicine: IMedicine): LowStockMedicine | undefined {
    // Bez kontroli ilości nie ma z czego liczyć - liczy się tylko ręczne oznaczenie „Kończy się”.
    if (medicine.ignoreQuantity) return medicine.runningOut ? { medicine, level: 'low' } : undefined;
    if (medicine.asNeeded) {
        if (medicine.noLowStockWarning || medicine.count >= AS_NEEDED_LOW_STOCK) return undefined;
        return { medicine, level: medicine.count > 0 ? 'low' : 'empty' };
    }
    // Lek z planem: tylko gdy są jeszcze dawki do przyjęcia i nie ma „Ukryj jeśli brakuje leku”.
    if (medicine.hideWhenEmpty || !hasActiveDoses(medicine)) return undefined;
    const level = stockLevel(medicine);
    if (level === 'ok') return undefined;
    return { medicine, level, days: forecastStock(medicine)?.days };
}

/** Kończące się leki: najpierw czerwone (brak, potem krótszy zapas), potem pomarańczowe; w obrębie poziomu wg nazwy. */
export function lowStockMedicines(medicines: IMedicine[]): LowStockMedicine[] {
    return medicines
        .map(lowStockOf)
        .filter((m): m is LowStockMedicine => m !== undefined)
        .sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]
            || a.medicine.name.localeCompare(b.medicine.name, 'pl', { sensitivity: 'base' }));
}
