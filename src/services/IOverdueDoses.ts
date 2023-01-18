export default interface IOverdueDose {
    id: string;
    amount: number;
    numberOfDays: number;
    nextDoseDate: string;
    endDate: string | null;
    medicineName: string;
    time: string;
}