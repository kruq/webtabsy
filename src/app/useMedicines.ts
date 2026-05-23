import { useCallback, useEffect, useState } from 'react';
import { ERROR_MESSAGE_TIMEOUT_MS } from '../constants';
import IMedicine from '../models/IMedicine';
import OverdueDoseGroup from '../models/OverdueDosesGroup';
import { ApiError } from '../services/http';
import { addMedicine, deleteMedicine, fetchMedicines, updateMedicine } from '../services/medicine.service';
import { findOverdueDoses } from '../services/overdueDoses.service';

interface UseMedicinesResult {
    medicines: IMedicine[];
    overdueGroups: OverdueDoseGroup[];
    errorMessage: string;
    showSpinner: boolean;
    refresh: () => Promise<void>;
    refreshOverdue: () => Promise<void>;
    addNewMedicine: (name: string) => Promise<void>;
    saveMedicine: (id: string, params: Partial<IMedicine>) => Promise<void>;
    removeMedicine: (id: string) => Promise<void>;
    setMedicines: (next: IMedicine[]) => void;
    setOverdueGroups: (next: OverdueDoseGroup[]) => void;
}

export function useMedicines(): UseMedicinesResult {
    const [medicines, setMedicines] = useState<IMedicine[]>([]);
    const [overdueGroups, setOverdueGroups] = useState<OverdueDoseGroup[]>([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [showSpinner, setShowSpinner] = useState(false);

    const reportError = useCallback((error: unknown) => {
        const isNetwork = error instanceof TypeError || (error instanceof ApiError && error.status >= 500);
        setErrorMessage(isNetwork ? 'Bład połączenia!' : 'Wystąpił nieznany błąd');
        console.error(error);
        setTimeout(() => setErrorMessage(''), ERROR_MESSAGE_TIMEOUT_MS);
    }, []);

    const refreshOverdue = useCallback(async () => {
        try {
            setOverdueGroups(await findOverdueDoses());
        } catch (e) {
            reportError(e);
        }
    }, [reportError]);

    const refresh = useCallback(async () => {
        try {
            const [meds, groups] = await Promise.all([fetchMedicines(), findOverdueDoses()]);
            setMedicines(meds);
            setOverdueGroups(groups);
        } catch (e) {
            reportError(e);
        }
    }, [reportError]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const addNewMedicine = useCallback(async (name: string) => {
        setShowSpinner(true);
        try {
            await addMedicine({
                id: '',
                name,
                meal: '',
                description: '',
                count: 0,
                isVisible: true,
                doses: [],
                purchases: [],
                hideWhenEmpty: false,
            });
            setMedicines(await fetchMedicines());
        } catch (e) {
            reportError(e);
        } finally {
            setShowSpinner(false);
        }
    }, [reportError]);

    const saveMedicine = useCallback(async (id: string, params: Partial<IMedicine>) => {
        const current = medicines.find(m => m.id === id);
        if (!current) return;
        const next: IMedicine = { ...current, ...params };
        setMedicines(prev => prev.map(m => (m.id === id ? next : m)));
        try {
            await updateMedicine(next);
            await refreshOverdue();
        } catch (e) {
            reportError(e);
        }
    }, [medicines, refreshOverdue, reportError]);

    const removeMedicine = useCallback(async (id: string) => {
        setShowSpinner(true);
        try {
            await deleteMedicine(id);
            setMedicines(prev => prev.filter(m => m.id !== id));
            await refreshOverdue();
        } catch (e) {
            setErrorMessage('Błąd podczas usuwania leku');
            console.error(e);
            setTimeout(() => setErrorMessage(''), ERROR_MESSAGE_TIMEOUT_MS);
        } finally {
            setShowSpinner(false);
        }
    }, [refreshOverdue]);

    return {
        medicines,
        overdueGroups,
        errorMessage,
        showSpinner,
        refresh,
        refreshOverdue,
        addNewMedicine,
        saveMedicine,
        removeMedicine,
        setMedicines,
        setOverdueGroups,
    };
}
