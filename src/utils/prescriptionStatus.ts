import Prescription, { PrescriptionItem, PrescriptionStatus, PrescriptionValidity } from '../models/Prescription';
import { formatYmd } from './dateFormat';

/**
 * Długości okresów w dniach od daty wystawienia (włącznie z ostatnim dniem).
 * Recepta 30-dniowa: ważna przez 30 dni. Recepta roczna: ważna 365 dni, ale pierwsze opakowanie
 * trzeba wykupić w ciągu pierwszych 30 dni - inaczej pozycja przepada.
 */
export const VALIDITY_DAYS: Record<PrescriptionValidity, number> = { '30days': 30, annual: 365 };
export const FIRST_PURCHASE_DAYS = 30;

export const VALIDITY_LABELS: Record<PrescriptionValidity, string> = { '30days': '30 dni', annual: 'roczna' };

export const PRESCRIPTION_STATUS_LABELS: Record<PrescriptionStatus, string> = {
    new: 'Wystawiona',
    partiallyPurchased: 'Częściowo zrealizowana',
    fullyPurchased: 'Zrealizowana',
    expired: 'Przeterminowana',
};

export const ITEM_STATUS_LABELS: Record<PrescriptionStatus, string> = {
    new: 'Wystawiony',
    partiallyPurchased: 'Częściowo zrealizowany',
    fullyPurchased: 'Zrealizowany',
    expired: 'Przeterminowany',
};

export const STATUS_VARIANTS: Record<PrescriptionStatus, string> = {
    new: 'success',
    partiallyPurchased: 'success',
    fullyPurchased: 'secondary',
    expired: 'danger',
};

/** Dodaje dni do daty "yyyy-MM-dd" w kalendarzu lokalnym. */
export function addDaysYmd(ymd: string, days: number): string {
    const [y, m, d] = ymd.split('-').map(Number);
    return formatYmd(new Date(y, m - 1, d + days)) as string;
}

const DISPLAY_DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };

/** "yyyy-MM-dd" -> "dd.MM.yyyy", np. 09.02.2026. */
export function formatYmdForDisplay(ymd: string): string {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('pl-PL', DISPLAY_DATE_OPTIONS);
}

export function todayYmd(): string {
    return formatYmd(new Date()) as string;
}

/** Ostatni dzień ważności recepty. */
export function expiryDate(prescription: Pick<Prescription, 'issueDate' | 'validity'>): string {
    return addDaysYmd(prescription.issueDate, VALIDITY_DAYS[prescription.validity]);
}

export function remainingPackages(item: PrescriptionItem): number {
    return Math.max(0, item.packages - item.purchasedPackages);
}

export function itemStatus(
    prescription: Pick<Prescription, 'issueDate' | 'validity'>,
    item: PrescriptionItem,
    today: string = todayYmd(),
): PrescriptionStatus {
    if (remainingPackages(item) === 0) return 'fullyPurchased';
    if (today > expiryDate(prescription)) return 'expired';
    // Daty "yyyy-MM-dd" porównują się poprawnie jako tekst.
    if (item.purchasedPackages === 0 && today > addDaysYmd(prescription.issueDate, FIRST_PURCHASE_DAYS)) return 'expired';
    return item.purchasedPackages === 0 ? 'new' : 'partiallyPurchased';
}

/**
 * Status recepty z statusów pozycji:
 * - wszystkie wykupione -> zrealizowana;
 * - nic nie da się już wykupić (każda pozycja wykupiona albo przeterminowana) -> przeterminowana;
 * - wszystkie nierozpoczęte -> wystawiona;
 * - w pozostałych przypadkach (coś wykupiono albo coś przepadło, a coś jeszcze da się wykupić) -> częściowo zrealizowana.
 */
export function prescriptionStatus(prescription: Prescription, today: string = todayYmd()): PrescriptionStatus {
    const statuses = prescription.items.map(item => itemStatus(prescription, item, today));
    if (statuses.length === 0) {
        return today > expiryDate(prescription) ? 'expired' : 'new';
    }
    if (statuses.every(s => s === 'fullyPurchased')) return 'fullyPurchased';
    if (statuses.every(s => s === 'fullyPurchased' || s === 'expired')) return 'expired';
    if (statuses.every(s => s === 'new')) return 'new';
    return 'partiallyPurchased';
}

/** Tabletki, które można jeszcze wykupić z ważnych pozycji recept, per id leku. */
export function tabletsOnPrescriptions(prescriptions: Prescription[], today: string = todayYmd()): Map<string, number> {
    const result = new Map<string, number>();
    for (const prescription of prescriptions) {
        for (const item of prescription.items) {
            const status = itemStatus(prescription, item, today);
            if (status !== 'new' && status !== 'partiallyPurchased') continue;
            const tablets = remainingPackages(item) * item.packageSize;
            result.set(item.medicineId, (result.get(item.medicineId) ?? 0) + tablets);
        }
    }
    return result;
}

/** Ostrzeżenie pojawia się, gdy do terminu wykupu zostało tyle dni lub mniej. */
export const DEADLINE_WARNING_DAYS = 30;

export interface PurchaseDeadline {
    prescriptionId: string;
    itemId: string;
    medicineName: string;
    /** Ostatni dzień, w którym można wykupić (kolejne) opakowanie, "yyyy-MM-dd". */
    deadline: string;
    daysLeft: number;
    remainingPackages: number;
    /** false = nie wykupiono jeszcze żadnego opakowania. */
    started: boolean;
}

function daysBetweenYmd(from: string, to: string): number {
    const toUtc = (ymd: string) => {
        const [y, m, d] = ymd.split('-').map(Number);
        return Date.UTC(y, m - 1, d);
    };
    return Math.round((toUtc(to) - toUtc(from)) / (24 * 60 * 60 * 1000));
}

/**
 * Termin wykupu pozycji: nierozpoczętą trzeba zacząć w ciągu 30 dni od wystawienia (także na recepcie rocznej),
 * rozpoczętą - do końca ważności recepty.
 */
export function purchaseDeadline(prescription: Pick<Prescription, 'issueDate' | 'validity'>, item: PrescriptionItem): string {
    const expiry = expiryDate(prescription);
    if (item.purchasedPackages > 0) return expiry;
    const firstPurchase = addDaysYmd(prescription.issueDate, FIRST_PURCHASE_DAYS);
    return firstPurchase < expiry ? firstPurchase : expiry;
}

/** Pozycje, które da się jeszcze wykupić, a do ich terminu zostało najwyżej DEADLINE_WARNING_DAYS dni; najpilniejsze pierwsze. */
export function upcomingPurchaseDeadlines(prescriptions: Prescription[], today: string = todayYmd()): PurchaseDeadline[] {
    const result: PurchaseDeadline[] = [];
    for (const prescription of prescriptions) {
        for (const item of prescription.items) {
            const status = itemStatus(prescription, item, today);
            if (status !== 'new' && status !== 'partiallyPurchased') continue;
            const deadline = purchaseDeadline(prescription, item);
            const daysLeft = daysBetweenYmd(today, deadline);
            if (daysLeft > DEADLINE_WARNING_DAYS) continue;
            result.push({
                prescriptionId: prescription.id,
                itemId: item.id,
                medicineName: item.medicineName,
                deadline,
                daysLeft,
                remainingPackages: remainingPackages(item),
                started: item.purchasedPackages > 0,
            });
        }
    }
    return result.sort((a, b) => a.deadline.localeCompare(b.deadline) || a.medicineName.localeCompare(b.medicineName, 'pl'));
}
