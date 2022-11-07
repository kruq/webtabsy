export default interface IDoseDTO
 {
    id: string,
    time: string,
    amount: number,
    nextDoseDate: string,
    endDate: string | null
}