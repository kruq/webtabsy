import Prescription, { Doctor, Specialization } from '../models/Prescription';
import API_HOST from './api.constants';
import { deleteResource, getJson, postJsonForResult, putJson } from './http';

const PRESCRIPTION_URL = API_HOST + '/prescription';
const SPECIALIZATION_URL = API_HOST + '/specialization';
const DOCTOR_URL = API_HOST + '/doctor';

/** Starsze/niepełne dokumenty mogą nie mieć pól tekstowych - uzupełniamy je pustymi. */
function prescriptionFromDTO(p: Prescription): Prescription {
    return {
        ...p,
        code: p.code ?? '',
        doctor: p.doctor ?? '',
        specialization: p.specialization ?? '',
        note: p.note ?? '',
        items: p.items ?? [],
    };
}

export async function fetchPrescriptions(): Promise<Prescription[]> {
    const data = await getJson<Prescription[]>(PRESCRIPTION_URL);
    return data.map(prescriptionFromDTO);
}

export async function createPrescription(prescription: Prescription): Promise<Prescription> {
    const created = await postJsonForResult<Prescription, Prescription>(PRESCRIPTION_URL, { ...prescription, id: '' });
    return prescriptionFromDTO(created);
}

export async function updatePrescription(prescription: Prescription): Promise<void> {
    await putJson(PRESCRIPTION_URL, prescription);
}

export async function deletePrescription(id: string): Promise<void> {
    await deleteResource(`${PRESCRIPTION_URL}/${encodeURIComponent(id)}`);
}

export async function fetchSpecializations(): Promise<Specialization[]> {
    return getJson<Specialization[]>(SPECIALIZATION_URL);
}

export async function createSpecialization(name: string): Promise<Specialization> {
    return postJsonForResult<Pick<Specialization, 'name'>, Specialization>(SPECIALIZATION_URL, { name });
}

export async function fetchDoctors(): Promise<Doctor[]> {
    return getJson<Doctor[]>(DOCTOR_URL);
}

export async function createDoctor(doctor: Omit<Doctor, 'id'>): Promise<Doctor> {
    return postJsonForResult<Omit<Doctor, 'id'>, Doctor>(DOCTOR_URL, doctor);
}
