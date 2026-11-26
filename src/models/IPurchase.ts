/** Jeden zakup: kilka opakowań tego samego rozmiaru i w tej samej cenie. */
export default interface IPurchase {
    id: string;
    /** Cena jednego opakowania; undefined = nie podano. */
    price: number | undefined;
    /** Ilość w jednym opakowaniu (w jednostce leku). */
    numberOfTablets: number;
    /** Liczba opakowań. */
    packages: number;
    /** Cena wszystkich opakowań; undefined = nie podano. */
    totalPrice: number | undefined;
    date: Date;
}
