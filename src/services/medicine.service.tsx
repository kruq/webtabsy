import IMedicine from "../models/IMedicine";

const apiUrl = 'https://webtabsyapi.azurewebsites.net/medicine';

export const fetchMedicines = async (): Promise<IMedicine[]> => {
    try {
        var res2 = await fetch(apiUrl, { mode: 'cors' });
        return res2.json();
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