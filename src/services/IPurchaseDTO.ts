export default interface IPurchaseDTO {
    id: string;
    /** null albo 0 (zapis sprzed migracji) = nie podano. */
    price: number | null | undefined;
    numberOfTablets: number;
    /** Brak w zapisach sprzed migracji - wtedy jedno opakowanie. */
    packages?: number | null;
    totalPrice?: number | null;
    date: string;
}
