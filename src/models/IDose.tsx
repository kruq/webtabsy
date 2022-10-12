export default interface IDose {
    id: string,
    time: string,
    amount: number | undefined,
    takingDate: Date,
    endDate: Date | null
}