import IMedicine from '../models/IMedicine';
import OverdueDose from '../models/OverdueDoses';
import OverdueDoseGroup from '../models/OverdueDosesGroup';

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
): DoseActionResult {
    const sourceMedicine = medicines.find(m => m.name === dose.medicineName);
    if (!sourceMedicine) {
        return { medicines, overdueGroups, medicineToPersist: undefined };
    }
    if (action === 'confirm' && sourceMedicine.count <= 0) {
        return { medicines, overdueGroups, medicineToPersist: undefined };
    }

    const days = dose.numberOfDays ?? 1;
    const updatedDoses = sourceMedicine.doses.map(d => {
        if (d.id !== dose.id) return d;
        return { ...d, nextDoseDate: advanceNextDoseDate(d.nextDoseDate, d.time, days) };
    });
    const decrement = action === 'confirm' ? dose.amount : 0;
    const updatedMedicine: IMedicine = {
        ...sourceMedicine,
        count: sourceMedicine.count - decrement,
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
