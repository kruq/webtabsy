import Prescription, { PrescriptionItem, PrescriptionStatus, PrescriptionValidity } from '../models/Prescription';
import { formatDate, formatYmd } from './dateFormat';

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

/** "yyyy-MM-dd" -> wspólny format dat (formatDate), np. 09.02.26. */
export function formatYmdForDisplay(ymd: string): string {
    const [y, m, d] = ymd.split('-').map(Number);
    return formatDate(new Date(y, m - 1, d));
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
export const DEADLINE_WARNING_DAYS = 14;

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

/**
 * Liczba recept (wszystkich, także przeterminowanych i zrealizowanych) wystawionych przez lekarza. Recepta zapisuje
 * nazwę lekarza, nie jego id - porównujemy nazwy bez wielkości liter i spacji na końcach, tak jak API.
 */
export function prescriptionsOfDoctor(prescriptions: Prescription[], doctorName: string): number {
    const name = doctorName.trim().toLocaleLowerCase('pl');
    return prescriptions.filter(p => (p.doctor ?? '').trim().toLocaleLowerCase('pl') === name).length;
}

/** Opakowania jednej wielkości do wykupienia z ważnych recept. */
export interface PrescriptionPackages {
    packages: number;
    packageSize: number;
}

/** Pozycja ważnej recepty, z której można jeszcze coś wykupić - do informacji o recepcie przy leku. */
export interface PrescriptionEntry {
    prescriptionId: string;
    issueDate: string;
    /** Pusty, gdy kodu nie podano. */
    code: string;
    /** Opakowania jeszcze do wykupienia. */
    packages: number;
    packageSize: number;
    /** Ostatni dzień wykupu, "yyyy-MM-dd". */
    deadline: string;
}

/** Pozycje ważnych recept, z których można jeszcze coś wykupić, per id leku; kilka recept na ten sam lek - kilka wpisów. */
export function prescriptionEntries(prescriptions: Prescription[], today: string = todayYmd()): Map<string, PrescriptionEntry[]> {
    const result = new Map<string, PrescriptionEntry[]>();
    for (const prescription of prescriptions) {
        for (const item of prescription.items) {
            const status = itemStatus(prescription, item, today);
            if (status !== 'new' && status !== 'partiallyPurchased') continue;
            const list = result.get(item.medicineId) ?? [];
            list.push({
                prescriptionId: prescription.id,
                issueDate: prescription.issueDate,
                code: prescription.code ?? '',
                packages: remainingPackages(item),
                packageSize: item.packageSize,
                deadline: purchaseDeadline(prescription, item),
            });
            result.set(item.medicineId, list);
        }
    }
    result.forEach(list => list.sort((a, b) => a.deadline.localeCompare(b.deadline)));
    return result;
}

/** Opakowania z kilku pozycji zsumowane według wielkości opakowania (od najmniejszego), np. [{ packages: 2, packageSize: 30 }]. */
export function groupPackages(entries: Pick<PrescriptionEntry, 'packages' | 'packageSize'>[]): PrescriptionPackages[] {
    const result: PrescriptionPackages[] = [];
    for (const entry of entries) {
        const sameSize = result.find(p => p.packageSize === entry.packageSize);
        if (sameSize) sameSize.packages += entry.packages;
        else result.push({ packages: entry.packages, packageSize: entry.packageSize });
    }
    return result.filter(p => p.packages > 0).sort((a, b) => a.packageSize - b.packageSize);
}

/** Kody recept (bez powtórzeń, jeden na receptę); recepta bez kodu daje pusty tekst. */
export function prescriptionCodes(entries: PrescriptionEntry[]): string[] {
    const byPrescription = new Map<string, string>();
    entries.forEach(e => byPrescription.set(e.prescriptionId, e.code));
    return Array.from(byPrescription.values());
}

/** Opakowania do wykupienia z ważnych recept, per id leku, zsumowane według wielkości opakowania. */
export function packagesOnPrescriptions(prescriptions: Prescription[], today: string = todayYmd()): Map<string, PrescriptionPackages[]> {
    const result = new Map<string, PrescriptionPackages[]>();
    prescriptionEntries(prescriptions, today).forEach((entries, medicineId) => result.set(medicineId, groupPackages(entries)));
    return result;
}

/** „2 op. × 30 tab. + 1 op. × 60 tab.”; lek bez kontroli ilości (wielkość opakowania 0) - samo „3 op.”. */
export function formatPrescriptionPackages(packages: PrescriptionPackages[], unitAbbreviation: string): string {
    return packages
        .map(p => (p.packageSize > 0 ? `${p.packages} op. × ${p.packageSize} ${unitAbbreviation}` : `${p.packages} op.`))
        .join(' + ');
}

/**
 * Informacja o receptach na lek do panelu kończących się leków:
 * „Recepta: 3 op. × 30 tab., kod 1234”, „Recepty: 2 op. × 28 tab., kody 1234, bez kodu”.
 */
export function prescriptionSummary(entries: PrescriptionEntry[], unitAbbreviation: string): string {
    const codes = prescriptionCodes(entries);
    const many = codes.length > 1;
    const codeText = many
        ? `kody ${codes.map(c => c || 'bez kodu').join(', ')}`
        : codes[0] ? `kod ${codes[0]}` : 'bez kodu';
    return `${many ? 'Recepty' : 'Recepta'}: ${formatPrescriptionPackages(groupPackages(entries), unitAbbreviation)}, ${codeText}`;
}
