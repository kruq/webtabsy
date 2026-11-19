import IMedicine from '../models/IMedicine';
import OverdueDoseGroup from '../models/OverdueDosesGroup';
import IOverdueDoseGroup from './IOverdueDosesGroup';
import API_HOST from './api.constants';
import { getJson, postJsonForResult } from './http';
import IMedicineDTO from './IMedicineDTO';
import { medicineFromDTO, overdueDoseGroupFromDTO } from './mappers';

const API_URL = API_HOST + '/overdueDoses';

function timezoneOffsetHours(): number {
    return (new Date()).getTimezoneOffset() / 60;
}

export async function findOverdueDoses(): Promise<OverdueDoseGroup[]> {
    const data = await getJson<IOverdueDoseGroup[]>(`${API_URL}/${timezoneOffsetHours()}`);
    return data.map(overdueDoseGroupFromDTO);
}

/**
 * Potwierdza albo pomija jedno wystąpienie dawki. API wykonuje to najwyżej raz: gdy to wystąpienie zostało już
 * obsłużone (np. drugie kliknięcie, inne urządzenie), odpowiada 409 i niczego nie zmienia. Wpis w historii
 * zapisuje samo API. Zwraca lek po zmianie.
 */
export async function recordDose(
    doseId: string,
    action: 'confirm' | 'skip',
    occurrence: Date,
    amount?: number,
): Promise<IMedicine> {
    const data = await postJsonForResult<object, IMedicineDTO>(
        `${API_URL}/${encodeURIComponent(doseId)}/${action === 'confirm' ? 'take' : 'skip'}`,
        { occurrence: occurrence.toISOString(), amount: action === 'confirm' ? amount : undefined, timezoneOffsetInHours: timezoneOffsetHours() },
    );
    return medicineFromDTO(data);
}
