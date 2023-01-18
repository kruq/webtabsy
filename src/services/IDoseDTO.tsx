export default interface IDoseDTO
 {
    id: string,
    time: string,
    amount: number,
    numberOfDays: number,
    nextDoseDate: string,
    endDate: string | null
}