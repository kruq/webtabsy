import DoseLogEntry, { NewDoseLogEntry } from '../models/DoseLogEntry';
import API_HOST from './api.constants';
import { getJson, postJson } from './http';
import IDoseLogEntryDTO from './IDoseLogEntryDTO';
import { doseLogEntryFromDTO } from './mappers';

const API_URL = API_HOST + '/doseLog';

export async function addDoseLogEntry(entry: NewDoseLogEntry): Promise<void> {
    await postJson(API_URL, entry);
}

/** Wpisy z ostatnich `months` miesięcy, od najnowszego. */
export async function fetchDoseLog(months: number): Promise<DoseLogEntry[]> {
    const data = await getJson<IDoseLogEntryDTO[]>(`${API_URL}?months=${encodeURIComponent(months)}`);
    return data.map(doseLogEntryFromDTO);
}

/** Zapis logu nie może zablokować ani wycofać samego oznaczenia dawki - błąd tylko trafia do konsoli. */
export async function tryAddDoseLogEntry(entry: NewDoseLogEntry): Promise<void> {
    try {
        await addDoseLogEntry(entry);
    } catch (e) {
        console.error('Nie udało się zapisać wpisu w historii dawek', e);
    }
}
