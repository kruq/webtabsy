import OverdueDose from "./OverdueDoses";

export default class OverdueDoseGroup {
    date: Date;
    doses: OverdueDose[];

    constructor(group: {time: Date, doses: OverdueDose[] | null}) {
        this.date = group.time;
        this.doses = group.doses ?? new Array<OverdueDose>();
    }
}