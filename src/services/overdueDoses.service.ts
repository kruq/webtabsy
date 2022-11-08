import OverdueDose from "../models/OverdueDoses";
import OverdueDoseGroup from "../models/OverdueDosesGroup";
import IOverdueDoseGroup from "./IOverdueDosesGroup";
import API_HOST from "./api.constants";

const API_URL = API_HOST + "/overdueDoses";

export async function findOverdueDoses(): Promise<OverdueDoseGroup[]> {
    try {
        const timezoneOffset = (new Date()).getTimezoneOffset() / 60;
        var response = await fetch(API_URL + '/' + timezoneOffset, { mode: 'cors', });
        const data: IOverdueDoseGroup[] = await response.json();
        const result: OverdueDoseGroup[] = data.map(item => new OverdueDoseGroup({
            time: new Date(item.date),
            doses: item.doses.map(dose => new OverdueDose({
                ...dose,
                nextDoseDate: new Date(dose.nextDoseDate),
                time: dose.time,
                endDate: (dose.endDate ? new Date(dose.endDate) : null)
            }))
        }));
        return result;
    } catch (error) {
        console.log(error);
        throw error;
    }
}