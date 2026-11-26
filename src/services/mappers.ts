import Dose from '../models/Dose';
import DoseLogEntry from '../models/DoseLogEntry';
import IMedicine from '../models/IMedicine';
import IPurchase from '../models/IPurchase';
import OverdueDose from '../models/OverdueDoses';
import OverdueDoseGroup from '../models/OverdueDosesGroup';
import IDoseLogEntryDTO from './IDoseLogEntryDTO';
import IMedicineDTO from './IMedicineDTO';
import IPurchaseDTO from './IPurchaseDTO';
import { roundPrice } from '../utils/purchases';
import IOverdueDoseGroup from './IOverdueDosesGroup';

/** Zakup z API; zapisy sprzed migracji to jedno opakowanie, a cena 0 oznacza brak ceny. */
export function purchaseFromDTO(p: IPurchaseDTO): IPurchase {
    const packages = p.packages ?? 1;
    const price = p.price ? p.price : undefined;
    const totalPrice = p.totalPrice ?? (price === undefined ? undefined : roundPrice(price * packages));
    return { id: p.id, numberOfTablets: p.numberOfTablets, packages, price, totalPrice, date: new Date(p.date) };
}

export function medicineFromDTO(m: IMedicineDTO): IMedicine {
    return {
        ...m,
        doses: m.doses.map(d => Dose.fromDTO(d)),
        purchases: m.purchases.map(purchaseFromDTO),
    };
}

export function overdueDoseGroupFromDTO(group: IOverdueDoseGroup): OverdueDoseGroup {
    return new OverdueDoseGroup({
        time: new Date(group.date),
        doses: group.doses.map(dose => new OverdueDose({
            ...dose,
            nextDoseDate: new Date(dose.nextDoseDate),
            endDate: dose.endDate ? new Date(dose.endDate) : null,
        })),
    });
}

export function doseLogEntryFromDTO(entry: IDoseLogEntryDTO): DoseLogEntry {
    return {
        ...entry,
        scheduledAt: new Date(entry.scheduledAt),
        loggedAt: new Date(entry.loggedAt),
    };
}
