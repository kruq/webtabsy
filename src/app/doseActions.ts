import { NewDoseLogEntry } from '../models/DoseLogEntry';
import IMedicine from '../models/IMedicine';
import OverdueDose from '../models/OverdueDoses';
import OverdueDoseGroup from '../models/OverdueDosesGroup';
import { subtractAmount } from '../utils/fraction';

export type DoseAction = 'skip' | 'confirm';

export interface DoseActionResult {
    medicines: IMedicine[];
    overdueGroups: OverdueDoseGroup[];
    medicineToPersist: IMedicine | undefined;
}

function advanceNextDoseDate(currentDate: Date, time: string, numberOfDays: number): Date {
    const result = new Date(currentDate.getTime());
    const [hh, mm] = time.split(':');
    result.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
    result.setDate(result.getDate() + numberOfDays);
    return result;
}

export function applyDoseAction(
    medicines: IMedicine[],
    overdueGroups: OverdueDoseGroup[],
    group: OverdueDoseGroup,
    dose: OverdueDose,
    action: DoseAction,
    takenAmount: number = dose.amount,
): DoseActionResult {
    const unchanged = { medicines, overdueGroups, medicineToPersist: undefined };
    const sourceMedicine = medicines.find(m => m.name === dose.medicineName);
    if (!sourceMedicine) return unchanged;
    if (action === 'confirm' && (takenAmount <= 0 || sourceMedicine.count < takenAmount)) return unchanged;

    const days = dose.numberOfDays ?? 1;
    const updatedDoses = sourceMedicine.doses.map(d => {
        if (d.id !== dose.id) return d;
        return { ...d, nextDoseDate: advanceNextDoseDate(d.nextDoseDate, d.time, days) };
    });
    const decrement = action === 'confirm' ? takenAmount : 0;
    const updatedMedicine: IMedicine = {
        ...sourceMedicine,
        count: subtractAmount(sourceMedicine.count, decrement),
        doses: updatedDoses,
    };

    const updatedMedicines = medicines.map(m => (m.id === updatedMedicine.id ? updatedMedicine : m));
    const updatedGroups = overdueGroups
        .map(g => {
            if (g !== group) return g;
            return new OverdueDoseGroup({ time: g.date, doses: g.doses.filter(d => d !== dose) });
        })
        .filter(g => g.doses.length > 0);

    return { medicines: updatedMedicines, overdueGroups: updatedGroups, medicineToPersist: updatedMedicine };
}

/**
 * Wpis historii dla dawki z grafiku. Data to zaplanowany termin tego konkretnego wystąpienia dawki
 * (API zwraca go w nextDoseDate zaległej dawki razem z godziną), a nie moment kliknięcia.
 * Przy pominięciu zapisujemy zaplanowaną ilość.
 */
export function buildScheduledDoseLogEntry(
    medicine: IMedicine,
    dose: OverdueDose,
    action: DoseAction,
    takenAmount: number = dose.amount,
): NewDoseLogEntry {
    return {
        medicineId: medicine.id,
        medicineName: medicine.name,
        doseId: dose.id,
        action: action === 'confirm' ? 'taken' : 'skipped',
        amount: action === 'confirm' ? takenAmount : dose.amount,
        scheduledAt: dose.nextDoseDate,
        unscheduled: false,
    };
}

/** Wpis historii dla leku wziętego poza grafikiem („Weź lek” w karcie leku) - z datą wzięcia. */
export function buildUnscheduledDoseLogEntry(medicine: Pick<IMedicine, 'id' | 'name'>, amount: number, takenAt: Date): NewDoseLogEntry {
    return {
        medicineId: medicine.id,
        medicineName: medicine.name,
        doseId: null,
        action: 'taken',
        amount,
        scheduledAt: takenAt,
        unscheduled: true,
    };
}
