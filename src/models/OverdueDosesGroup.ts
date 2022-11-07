import OverdueDose from "./OverdueDoses";

export default class OverdueDoseGroup {
    time: string;
    doses: OverdueDose[];

    constructor(group: {time: string, doses: OverdueDose[] | null}) {
        this.time = group.time;
        this.doses = group.doses ?? new Array<OverdueDose>();
    }
}