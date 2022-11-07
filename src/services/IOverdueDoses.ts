export default interface IOverdueDose {
    id: string;
    amount: number;
    nextDoseDate: string;
    endDate: string | null;
    medicineName: string;
    time: string;
}