import IMedicine from "../models/IMedicine";
import IMedicineDTO from "./IMedicineDTO";

const apiUrl = 'https://webtabsyapi.azurewebsites.net/medicine';

export const fetchMedicines = async (): Promise<IMedicine[]> => {
    try {
        var res2 = await fetch(apiUrl, { mode: 'cors' });
        const data: IMedicineDTO[] = await res2.json();
        const result: IMedicine[] = data.map(m => {
            return {
                ...m,
                doses: m.doses.map(d => {
                    return {
                        ...d,
                        takingDate: new Date(d.takingDate.toString()),
                        endDate: (d.endDate && new Date(d.endDate?.toString())) || null
                    }
                }),
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
    await fetch(apiUrl, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medicine)
    })
}

export const updateMedicine = async (medicine: IMedicine) => {
    await fetch(apiUrl, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medicine)
    })
}

export const deleteMedicine = async (medicine: IMedicine) => {
    await fetch(apiUrl, {
        method: "DELETE",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medicine)
    })
}