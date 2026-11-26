import { v4 as Uuid } from 'uuid';
import IMedicine from '../models/IMedicine';
import IPurchase from '../models/IPurchase';
import Prescription from '../models/Prescription';
import { remainingPackages } from '../utils/prescriptionStatus';

export interface PrescriptionItemPurchase {
    itemId: string;
    packages: number;
    /** Cena za wszystkie wykupione opakowania tej pozycji; undefined = nie podano. */
    totalPrice?: number;
}

export interface PrescriptionPurchaseResult {
    prescription: Prescription;
    /** Tylko leki, których dotyczy zakup. */
    medicines: IMedicine[];
}

/** Cena opakowania zaokrąglona do groszy. */
function pricePerPackage(totalPrice: number | undefined, packages: number): number | undefined {
    if (totalPrice === undefined) return undefined;
    return Math.round((totalPrice / packages) * 100) / 100;
}

/**
 * Wykup z recepty: pozycje z 0 opakowań są pomijane, pozostałe zwiększają purchasedPackages na recepcie,
 * a do leku dopisują jeden zakup (z liczbą opakowań) i zwiększają jego ilość.
 * Kilka pozycji z tym samym lekiem trafia do jednego, wspólnego stanu leku.
 * Lek z włączonym „Ignoruj kontrolę ilości” dostaje tylko zakupy (bez ilości), a jego ilość się nie zmienia.
 *
 * @param resetDosesFor id leków, którym ustawiamy następny dzień dawkowania na `now` (jak przy zwykłym kupowaniu,
 *   gdy lek się skończył).
 */
export function applyPrescriptionPurchase(
    prescription: Prescription,
    medicines: IMedicine[],
    purchases: PrescriptionItemPurchase[],
    purchaseDate: Date,
    resetDosesFor: Set<string> = new Set(),
    now: Date = new Date(),
): PrescriptionPurchaseResult {
    const byItem = new Map(purchases.filter(p => p.packages > 0).map(p => [p.itemId, p]));
    const touched = new Map<string, IMedicine>();

    const items = prescription.items.map(item => {
        const purchase = byItem.get(item.id);
        if (!purchase) return item;
        if (!Number.isInteger(purchase.packages) || purchase.packages > remainingPackages(item)) {
            throw new Error(`Nieprawidłowa liczba opakowań dla ${item.medicineName}`);
        }

        const medicine = touched.get(item.medicineId) ?? medicines.find(m => m.id === item.medicineId);
        if (!medicine) throw new Error(`Nie znaleziono leku ${item.medicineName}`);

        const packageSize = medicine.ignoreQuantity ? 0 : item.packageSize;
        // Jeden wpis na pozycję: cena wszystkich opakowań tak, jak ją wpisano, a cena opakowania wyliczona.
        const newPurchases: IPurchase[] = [{
            id: Uuid(),
            date: purchaseDate,
            numberOfTablets: packageSize,
            packages: purchase.packages,
            price: pricePerPackage(purchase.totalPrice, purchase.packages),
            totalPrice: purchase.totalPrice,
        }];
        touched.set(medicine.id, {
            ...medicine,
            count: medicine.count + purchase.packages * packageSize,
            purchases: [...(medicine.purchases ?? []), ...newPurchases],
        });

        return { ...item, purchasedPackages: item.purchasedPackages + purchase.packages };
    });

    const updatedMedicines = Array.from(touched.values()).map(m =>
        resetDosesFor.has(m.id) ? { ...m, doses: m.doses.map(d => ({ ...d, nextDoseDate: now })) } : m,
    );

    return { prescription: { ...prescription, items }, medicines: updatedMedicines };
}
