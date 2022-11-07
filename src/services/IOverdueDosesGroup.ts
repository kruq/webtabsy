import OverdueDose from "./IOverdueDoses";

export default interface IOverdueDoseGroup {
    time: string;
    doses: OverdueDose[];
}