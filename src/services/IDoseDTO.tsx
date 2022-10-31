export default interface IDoseDTO
 {
    id: string,
    time: string,
    amount: number | undefined,
    takingDate: string,
    endDate: string | null
}