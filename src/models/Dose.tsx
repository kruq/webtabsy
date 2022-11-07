import IDoseDTO from "../services/IDoseDTO";

export default class Dose {
    id: string;
    time: string;
    amount: number;
    nextDoseDate: Date;
    endDate: Date | null;

    constructor(id: string,
        time: string,
        amount: number,
        nextDoseDate: Date,
        endDate: Date | null = null) {
        this.id = id;
        this.time = time;
        this.amount = amount;
        this.nextDoseDate = nextDoseDate;
        this.endDate = endDate;
    }

    public static fromDTO(dtoObj: IDoseDTO) {
        console.log(dtoObj.nextDoseDate);
        return new Dose(
            dtoObj.id,
            dtoObj.time,
            dtoObj.amount,
            new Date(dtoObj.nextDoseDate.toString()),
            (dtoObj.endDate && new Date(dtoObj.endDate?.toString())) || null
        )
    }
}