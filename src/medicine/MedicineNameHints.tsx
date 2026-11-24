import React from 'react';
import IMedicine from '../models/IMedicine';
import { isMedicineNameTaken, medicinesContaining } from '../utils/medicineNames';

interface MedicineNameHintsProps {
    name: string;
    medicines: IMedicine[];
    /** Lek, którego nazwa jest zmieniana - nie podpowiadamy go i nie traktujemy jako duplikatu. */
    exceptId?: string;
}

/**
 * Pod polem nazwy leku: czerwony komunikat, gdy lek o tej nazwie już istnieje, i szara lista istniejących leków
 * zawierających wpisaną frazę (od 4 znaków), aktualizowana przy każdym znaku.
 */
export default function MedicineNameHints({ name, medicines, exceptId }: MedicineNameHintsProps) {
    const taken = isMedicineNameTaken(name, medicines, exceptId);
    const similar = medicinesContaining(name, medicines, exceptId);
    if (!taken && similar.length === 0) return null;
    return (
        <div className="mt-1">
            {taken && <div className="text-danger"><small>Lek o tej nazwie już istnieje</small></div>}
            {similar.length > 0 && (
                <div className="text-secondary">
                    <small>Istniejące leki:</small>
                    {similar.map(m => <div key={m.id}><small>{m.name}</small></div>)}
                </div>
            )}
        </div>
    );
}
