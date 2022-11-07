import Dose from "../models/Dose";
import IMedicine from "../models/IMedicine";
import IMedicineDTO from "./IMedicineDTO";
import API_HOST from "./api.constants";

const API_URL = API_HOST + "/medicine";

export const fetchMedicines = async (): Promise<IMedicine[]> => {
    try {
        var res2 = await fetch(API_URL, { mode: 'cors', });
        const data: IMedicineDTO[] = await res2.json();
        const result: IMedicine[] = data.map(m => {
            return {
                ...m,
                doses: m.doses.map(d => Dose.fromDTO(d)),
                purchases: m.purchases.map(p => {
                    return {
                        ...p,
                        date: new Date(p.date.toString())
                    }
                })
            }
        });
        return result;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const addMedicine = async (medicine: IMedicine) => {
    await fetch(API_URL, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medicine)
    })
}

export const updateMedicine = async (medicine: IMedicine) => {
    await fetch(API_URL, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medicine)
    })
}

export const deleteMedicine = async (medicine: IMedicine) => {
    await fetch(API_URL, {
        method: "DELETE",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medicine)
    })
}