import IDoseDTO from "../services/IDoseDTO";

export default class Dose {
    id: string;
    time: string;
    amount: number;
    nextDoseDate: Date;
    endDate: Date | null;
    numberOfDays: number;

    constructor(id: string,
        time: string,
        amount: number,
        numberOfDays: number,
        nextDoseDate: Date,
        endDate: Date | null = null) {
        this.id = id;
        this.time = time;
        this.amount = amount;
        this.numberOfDays = numberOfDays;
        this.nextDoseDate = nextDoseDate;
        this.endDate = endDate;
    }

    public static fromDTO(dtoObj: IDoseDTO) {
        return new Dose(
            dtoObj.id,
            dtoObj.time,
            dtoObj.amount,
            dtoObj.numberOfDays,
            new Date(dtoObj.nextDoseDate.toString()),
            (dtoObj.endDate && new Date(dtoObj.endDate?.toString())) || null
        )
    }
}