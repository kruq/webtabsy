import IMedicine from '../models/IMedicine';
import { PrescriptionItem } from '../models/Prescription';

/** Pozycja w formularzu: lek z listy (medicineId) albo nowy lek (newMedicineName), tworzony dopiero przy zapisie. */
export interface DraftPrescriptionItem extends PrescriptionItem {
    newMedicineName?: string;
    /** Nowy lek ma od razu włączone „Ignoruj kontrolę ilości”. */
    newMedicineIgnoreQuantity?: boolean;
}

function sameName(a: string, b: string): boolean {
    return a.trim().localeCompare(b.trim(), 'pl', { sensitivity: 'base' }) === 0;
}

/**
 * Zamienia pozycje z nowymi lekami na pozycje z id leku. Lek o tej samej nazwie (bez względu na wielkość liter)
 * nie jest tworzony drugi raz - ani gdy już jest na liście leków, ani gdy kilka pozycji podaje tę samą nową nazwę.
 */
export async function resolveNewMedicines(
    items: DraftPrescriptionItem[],
    medicines: IMedicine[],
    createMedicine: (name: string, ignoreQuantity: boolean) => Promise<IMedicine>,
): Promise<{ items: PrescriptionItem[]; createdAny: boolean }> {
    const known = [...medicines];
    let createdAny = false;
    const resolved: PrescriptionItem[] = [];

    for (const { newMedicineName, newMedicineIgnoreQuantity, ...item } of items) {
        if (!newMedicineName) {
            resolved.push(item);
            continue;
        }
        let medicine = known.find(m => sameName(m.name, newMedicineName));
        if (!medicine) {
            medicine = await createMedicine(newMedicineName.trim(), Boolean(newMedicineIgnoreQuantity));
            known.push(medicine);
            createdAny = true;
        }
        resolved.push({ ...item, medicineId: medicine.id, medicineName: medicine.name });
    }

    return { items: resolved, createdAny };
}
