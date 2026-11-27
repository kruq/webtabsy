import { useCallback, useEffect, useState } from 'react';
import Prescription, { Doctor, Specialization } from '../models/Prescription';
import {
    createDoctor,
    createPrescription,
    createSpecialization,
    deleteDoctor,
    deletePrescription,
    fetchDoctors,
    fetchPrescriptions,
    fetchSpecializations,
    updatePrescription,
} from '../services/prescription.service';

export interface UsePrescriptionsResult {
    prescriptions: Prescription[];
    specializations: Specialization[];
    doctors: Doctor[];
    /** Zapisuje receptę: bez id tworzy nową, z id aktualizuje istniejącą. */
    savePrescription: (prescription: Prescription) => Promise<void>;
    removePrescription: (id: string) => Promise<void>;
    addSpecialization: (name: string) => Promise<Specialization>;
    addDoctor: (doctor: Omit<Doctor, 'id'>) => Promise<Doctor>;
    removeDoctor: (id: string) => Promise<void>;
}

export function usePrescriptions(): UsePrescriptionsResult {
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [specializations, setSpecializations] = useState<Specialization[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);

    useEffect(() => {
        Promise.all([fetchPrescriptions(), fetchSpecializations(), fetchDoctors()])
            .then(([p, s, d]) => {
                setPrescriptions(p);
                setSpecializations(s);
                setDoctors(d);
            })
            .catch(e => console.error('Nie udało się pobrać recept', e));
    }, []);

    const savePrescription = useCallback(async (prescription: Prescription) => {
        if (prescription.id) {
            await updatePrescription(prescription);
            setPrescriptions(prev => prev.map(p => (p.id === prescription.id ? prescription : p)));
        } else {
            const created = await createPrescription(prescription);
            setPrescriptions(prev => [...prev, created]);
        }
    }, []);

    const removePrescription = useCallback(async (id: string) => {
        await deletePrescription(id);
        setPrescriptions(prev => prev.filter(p => p.id !== id));
    }, []);

    const addSpecialization = useCallback(async (name: string) => {
        const created = await createSpecialization(name);
        setSpecializations(prev => (prev.some(s => s.id === created.id) ? prev : [...prev, created]));
        return created;
    }, []);

    const addDoctor = useCallback(async (doctor: Omit<Doctor, 'id'>) => {
        const created = await createDoctor(doctor);
        setDoctors(prev => (prev.some(d => d.id === created.id) ? prev : [...prev, created]));
        return created;
    }, []);

    const removeDoctor = useCallback(async (id: string) => {
        await deleteDoctor(id);
        setDoctors(prev => prev.filter(d => d.id !== id));
    }, []);

    return { prescriptions, specializations, doctors, savePrescription, removePrescription, addSpecialization, addDoctor, removeDoctor };
}
