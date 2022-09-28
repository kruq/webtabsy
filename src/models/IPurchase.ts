export default interface IPurchase {
    id: string;
    price: number | undefined;
    numberOfTablets: number;
    date: Date;
}