import { DoseDetails } from "./types";
import { fetchMedicines, updateMedicine } from './services/medicine.service';


export const countDays = (date1: Date, date2: Date) => {
    const date11 = new Date(date1);
    const date22 = new Date(date2);
    date11.setHours(0, 0, 0, 0);
    date22.setHours(0, 0, 0, 0);
    const diff = date11.getTime() - date22.getTime();
    const noOfDays = Math.floor(diff / (1000 * 3600 * 24));
    return noOfDays;
}

export const takeMedicinesAction = async (doses: DoseDetails[]) => {
    const today = new Date();
    console.log(doses.map(d => d.medicine?.name + ' ' + d.time + ' ' + d.doseAmount).reduce((prev, curr) => prev + curr + ';\r\n', ''));

    for (const dose of doses) {
        let noOfDays = countDays(today, new Date(dose.dose.nextDoseDate));
        for (let i = noOfDays; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const hourAndMinute = dose.time.split(":");
            date.setHours(parseInt(hourAndMinute[0]), parseInt(hourAndMinute[1]), 0, 0);
            if (date > new Date(dose.dose.nextDoseDate.toString()) && date < today && dose.medicine !== undefined) {
                const totalDose = dose.dose.amount ?? 0;
                const med = { ...dose.medicine };
                med.count -= totalDose;
                await updateMedicine(med);
            }
        }
    };
};

export const refreshNotTakenDoses = async () => {

    const today = new Date();

    const meds = await fetchMedicines();

    const elements = meds.reduce((collection: string[], x) => {
        const newDosesArray = x.doses.flatMap(dose => {

            let noOfDays = countDays(today, new Date(dose.nextDoseDate));
            if (noOfDays > 100) {
                noOfDays = 0;
            }

            const days = [...Array.from(Array(noOfDays + 1).keys())];

            return days.reverse().reduce((foundDoses, dayNo) => {
                const date = new Date(today);
                date.setDate(date.getDate() - dayNo);

                const hourAndMinute = dose.time.split(":");
                date.setHours(parseInt(hourAndMinute[0]), parseInt(hourAndMinute[1]), 0, 0);
                if ((date > new Date(dose.nextDoseDate.toString())) && (date < today)) {
                    foundDoses.push(`${formatDate(new Date(dose.nextDoseDate.toString()))}, ${dose.time}`);
                }
                return foundDoses;
            }, new Array<string>());
        });
        return collection.concat(newDosesArray);
    }, new Array<string>());


    return elements.filter((value, index, array) => array.indexOf(value) === index);
    //        .sort((a, b) => { return a.time > b.time ? 1 : -1 });
};


const weekDays = [
    'Nd',
    'Pn',
    'Wt',
    'Śr',
    'Czw',
    'Pt',
    'Sb'
]

const formatDate = (date: Date) => {
    let d = weekDays[date.getDay()];
    d = `${d}. ${date.getDate()}`;
    if (date.getDate() === (new Date()).getDate()) {
        d = "dziś";
    }
    return d;
}