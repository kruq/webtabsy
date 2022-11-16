export default class OverdueDose {
    id: string;
    amount: number;
    nextDoseDate: Date;
    endDate: Date | null;
    medicineName: string;
    time: string;

    constructor(dose: {id: string,
        amount: number,
        nextDoseDate: Date,
        medicineName: string,
        time: string,
        endDate: Date | null}) {

        this.id = dose.id;
        this.amount = dose.amount;
        this.nextDoseDate = dose.nextDoseDate;
        this.endDate = dose.endDate;
        this.medicineName = dose.medicineName;
        this.time = dose.time;
    }
}