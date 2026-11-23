import { useCallback, useEffect, useRef, useState } from 'react';
import { ERROR_MESSAGE_TIMEOUT_MS } from '../constants';
import IMedicine from '../models/IMedicine';
import OverdueDoseGroup from '../models/OverdueDosesGroup';
import { ApiError } from '../services/http';
import { addMedicine, deleteMedicine, fetchMedicines, newMedicine, updateMedicine } from '../services/medicine.service';
import { findOverdueDoses } from '../services/overdueDoses.service';

interface UseMedicinesResult {
    medicines: IMedicine[];
    overdueGroups: OverdueDoseGroup[];
    /** Dane zostały wczytane z API przynajmniej raz (lista leków może być pusta - np. nowy użytkownik). */
    loaded: boolean;
    errorMessage: string;
    showSpinner: boolean;
    refresh: () => Promise<void>;
    addNewMedicine: (name: string, ignoreQuantity: boolean) => Promise<void>;
    saveMedicine: (id: string, params: Partial<IMedicine>) => Promise<void>;
    removeMedicine: (id: string) => Promise<void>;
    setMedicines: (next: IMedicine[] | ((prev: IMedicine[]) => IMedicine[])) => void;
    setOverdueGroups: (next: OverdueDoseGroup[]) => void;
    /**
     * Opakowuje każdy zapis do API. Odświeżenie, które trwało w czasie zapisu albo zaczęło się przed jego końcem,
     * jest odrzucane - mogłoby przywrócić stan sprzed zapisu (np. potwierdzona dawka wróciłaby na ekran).
     * Po zakończeniu ostatniego zapisu dane są odświeżane jeszcze raz.
     */
    trackWrite: <T>(write: () => Promise<T>) => Promise<T>;
    reportError: (error: unknown) => void;
}

export function useMedicines(): UseMedicinesResult {
    const [medicines, setMedicines] = useState<IMedicine[]>([]);
    const [overdueGroups, setOverdueGroups] = useState<OverdueDoseGroup[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showSpinner, setShowSpinner] = useState(false);
    // pending: zapisy w toku; version: zmienia się na początku i na końcu każdego zapisu.
    const writes = useRef({ pending: 0, version: 0 });

    const reportError = useCallback((error: unknown) => {
        const isNetwork = error instanceof TypeError || (error instanceof ApiError && error.status >= 500);
        setErrorMessage(isNetwork ? 'Bład połączenia!' : 'Wystąpił nieznany błąd');
        console.error(error);
        setTimeout(() => setErrorMessage(''), ERROR_MESSAGE_TIMEOUT_MS);
    }, []);

    const refresh = useCallback(async () => {
        // Po zakończeniu zapisów odświeżenie i tak nastąpi.
        if (writes.current.pending > 0) return;
        const startedAt = writes.current.version;
        try {
            const [meds, groups] = await Promise.all([fetchMedicines(), findOverdueDoses()]);
            // W międzyczasie zaczął się albo skończył zapis - te dane mogą być sprzed niego.
            if (writes.current.pending > 0 || writes.current.version !== startedAt) return;
            setMedicines(meds);
            setOverdueGroups(groups);
            setLoaded(true);
        } catch (e) {
            reportError(e);
        }
    }, [reportError]);

    const refreshRef = useRef(refresh);
    useEffect(() => {
        refreshRef.current = refresh;
    }, [refresh]);

    const trackWrite = useCallback(async <T,>(write: () => Promise<T>): Promise<T> => {
        writes.current.pending++;
        writes.current.version++;
        try {
            return await write();
        } finally {
            writes.current.pending--;
            writes.current.version++;
            if (writes.current.pending === 0) refreshRef.current();
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const addNewMedicine = useCallback(async (name: string, ignoreQuantity: boolean) => {
        setShowSpinner(true);
        try {
            await trackWrite(() => addMedicine(newMedicine(name, ignoreQuantity)));
        } catch (e) {
            reportError(e);
        } finally {
            setShowSpinner(false);
        }
    }, [reportError, trackWrite]);

    const saveMedicine = useCallback(async (id: string, params: Partial<IMedicine>) => {
        const current = medicines.find(m => m.id === id);
        if (!current) return;
        const next: IMedicine = { ...current, ...params };
        setMedicines(prev => prev.map(m => (m.id === id ? next : m)));
        try {
            await trackWrite(() => updateMedicine(next));
        } catch (e) {
            reportError(e);
        }
    }, [medicines, reportError, trackWrite]);

    const removeMedicine = useCallback(async (id: string) => {
        setShowSpinner(true);
        try {
            await trackWrite(() => deleteMedicine(id));
            setMedicines(prev => prev.filter(m => m.id !== id));
        } catch (e) {
            setErrorMessage('Błąd podczas usuwania leku');
            console.error(e);
            setTimeout(() => setErrorMessage(''), ERROR_MESSAGE_TIMEOUT_MS);
        } finally {
            setShowSpinner(false);
        }
    }, [trackWrite]);

    return {
        medicines,
        overdueGroups,
        loaded,
        errorMessage,
        showSpinner,
        refresh,
        addNewMedicine,
        saveMedicine,
        removeMedicine,
        setMedicines,
        setOverdueGroups,
        trackWrite,
        reportError,
    };
}
