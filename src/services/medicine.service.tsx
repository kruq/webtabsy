import IMedicine from "../models/IMedicine";

// const apiUrl = 'https://webtabsyapi.execa.pl/medicine'
// const apiUrl = 'https://localhost:7078/medicine'
const apiUrl = 'https://webtabsyapi.azurewebsites.net/medicine';

export const fetchMedicines = async (): Promise<IMedicine[]> => {
    var res = await fetch(apiUrl, { mode: 'cors' });
    var text = res.json();
    return text;
}


export const addMedicine = async (newMedicineName: string) => {
    await fetch(apiUrl, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newMedicineName })
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