import { DoseDetails } from "./types";

export const countDays = (date1: Date, date2: Date) => {
    const date11 = new Date(date1);
    const date22 = new Date(date2);
    date11.setHours(0, 0, 0, 0);
    date22.setHours(0, 0, 0, 0);
    const diff = date11.getTime() - date22.getTime();
    const noOfDays = Math.floor(diff / (1000 * 3600 * 24));
    return noOfDays;
  }

export const takeMedicinesAction = (doses: DoseDetails[]) => {
    const today = new Date();
    doses.reduce((prevValue, dose) => {
        let noOfDays = countDays(today, new Date(dose.dose.takingDate));
        for (let i = noOfDays; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const hourAndMinute = dose.time.split(":");
            date.setHours(parseInt(hourAndMinute[0]), parseInt(hourAndMinute[1]), 0, 0);
            if (date > new Date(dose.dose.takingDate.toString()) && date < today) {
                const totalDose = dose.dose.amount ?? 0;
                return prevValue + totalDose;
            }
        }
        return prevValue;
    }, 0);

    alert(doses.map(d => d.medicine?.name + ' ' + d.time + ' ' + d.doseAmount).reduce((prev, curr) => prev + curr + ';\r\n', ''));

    // const newDateTaken = today;
    // med.doses.forEach(d => d.takingDate = new Date(newDateTaken));
    //newm.push(med);

    // newm.forEach(async (x) => await updateMedicine(x));

};