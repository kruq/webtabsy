import IMedicine from "../models/IMedicine";
import axios from "axios";

const apiUrl = 'https://webtabsyapi.azurewebsites.net/medicine';

export const fetchMedicines = async () => {
    try {
        var res = await axios.get(apiUrl);
        // var res = await fetch(apiUrl, { mode: 'cors' });
        console.log(res);
        return res.data;
    } catch (error) {
        alert(error);
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