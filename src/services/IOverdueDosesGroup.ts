import OverdueDose from "./IOverdueDoses";

export default interface IOverdueDoseGroup {
    date: string;
    doses: OverdueDose[];
}