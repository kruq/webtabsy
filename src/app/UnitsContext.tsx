import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import IMedicine from '../models/IMedicine';
import Unit from '../models/Unit';
import { createUnit, fetchUnits } from '../services/unit.service';
import { DEFAULT_UNIT } from '../utils/units';

interface UnitsContextValue {
    units: Unit[];
    /** Jednostka o danym id; brak id albo nieznana jednostka = tabletka. */
    unitById: (unitId: string | null | undefined) => Unit;
    /** Jednostka leku o danym id (np. dla wpisu historii); lek nieznany albo usunięty = tabletka. */
    unitOfMedicine: (medicineId: string | null | undefined) => Unit;
    addUnit: (unit: Omit<Unit, 'id'>) => Promise<Unit>;
}

const fallback: UnitsContextValue = {
    units: [DEFAULT_UNIT],
    unitById: () => DEFAULT_UNIT,
    unitOfMedicine: () => DEFAULT_UNIT,
    addUnit: () => Promise.reject(new Error('UnitsProvider is missing')),
};

const UnitsContext = createContext<UnitsContextValue>(fallback);

export function useUnits(): UnitsContextValue {
    return useContext(UnitsContext);
}

/** Wczytuje wspólną listę jednostek i udostępnia ją komponentom razem z jednostkami leków. */
export function UnitsProvider({ medicines, children }: { medicines: IMedicine[]; children: ReactNode }) {
    const [units, setUnits] = useState<Unit[]>([DEFAULT_UNIT]);

    useEffect(() => {
        fetchUnits()
            .then(loaded => setUnits(loaded.some(u => u.id === DEFAULT_UNIT.id) ? loaded : [DEFAULT_UNIT, ...loaded]))
            .catch(e => console.error('Nie udało się pobrać jednostek', e));
    }, []);

    const addUnit = useCallback(async (unit: Omit<Unit, 'id'>) => {
        const created = await createUnit(unit);
        setUnits(prev => (prev.some(u => u.id === created.id) ? prev : [...prev, created]));
        return created;
    }, []);

    const value = useMemo<UnitsContextValue>(() => {
        const unitById = (unitId: string | null | undefined) => units.find(u => u.id === unitId) ?? DEFAULT_UNIT;
        return {
            units,
            unitById,
            unitOfMedicine: medicineId => unitById(medicines.find(m => m.id === medicineId)?.unitId),
            addUnit,
        };
    }, [units, medicines, addUnit]);

    return <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>;
}
