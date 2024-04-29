export default class OverdueDose {
    id: string;
    amount: number;
    numberOfDays: number;
    nextDoseDate: Date;
    endDate: Date | null;
    medicineName: string;
    time: string;
    disabled: boolean;

        public get hour() : number {
        return parseInt(this.time.substring(0,2));
    }

    public get minute() : number {
        return parseInt(this.time.substring(3,5));
    }

    public get todaysDate(): Date {
        var date = new Date();
        date.setHours(this.hour);
        date.setMinutes(this.minute);
        return date;
    }

    constructor(dose: {id: string,
        amount: number,
        numberOfDays: number,
        nextDoseDate: Date,
        medicineName: string,
        time: string,
        endDate: Date | null}) {

        this.id = dose.id;
        this.amount = dose.amount;
        this.numberOfDays = dose.numberOfDays > 0 ? dose.numberOfDays : 1;
        this.nextDoseDate = dose.nextDoseDate;
        this.endDate = dose.endDate;
        this.medicineName = dose.medicineName;
        this.time = dose.time;
        this.disabled = false;
    }
}