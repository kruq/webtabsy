import Dose from '../models/Dose';
import IMedicine from '../models/IMedicine';
import IPurchase from '../models/IPurchase';
import OverdueDose from '../models/OverdueDoses';
import OverdueDoseGroup from '../models/OverdueDosesGroup';
import IMedicineDTO from './IMedicineDTO';
import IPurchaseDTO from './IPurchaseDTO';
import IOverdueDoseGroup from './IOverdueDosesGroup';

function purchaseFromDTO(p: IPurchaseDTO): IPurchase {
    return { ...p, date: new Date(p.date) };
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
