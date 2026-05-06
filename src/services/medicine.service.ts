import IMedicine from '../models/IMedicine';
import IMedicineDTO from './IMedicineDTO';
import API_HOST from './api.constants';
import { deleteResource, getJson, postJson, putJson } from './http';
import { medicineFromDTO } from './mappers';

const API_URL = API_HOST + '/medicine';

export async function fetchMedicines(): Promise<IMedicine[]> {
    const data = await getJson<IMedicineDTO[]>(API_URL);
    return data.map(medicineFromDTO);
}

export async function addMedicine(medicine: IMedicine): Promise<void> {
    await postJson(API_URL, medicine);
}

export async function updateMedicine(medicine: IMedicine): Promise<void> {
    await putJson(API_URL, medicine);
}

export async function deleteMedicine(id: string): Promise<void> {
    await deleteResource(`${API_URL}/${encodeURIComponent(id)}`);
}
