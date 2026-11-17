export type PrescriptionValidity = '30days' | 'annual';

export type PrescriptionStatus = 'new' | 'partiallyPurchased' | 'fullyPurchased' | 'expired';

export interface PrescriptionItem {
    id: string;
    medicineId: string;
    /** Nazwa leku w chwili zapisu - pozycja pozostaje czytelna po usunięciu leku. */
    medicineName: string;
    packages: number;
    /** Liczba tabletek w opakowaniu. */
    packageSize: number;
    /** Pozostałe opakowania = packages - purchasedPackages. */
    purchasedPackages: number;
}

export default interface Prescription {
    id: string;
    /** Data wystawienia, "yyyy-MM-dd" - celowo bez godziny i strefy czasowej. */
    issueDate: string;
    validity: PrescriptionValidity;
    /** 4-cyfrowy kod e-recepty; pusty, gdy nie podano. */
    code: string;
    doctor: string;
    specialization: string;
    note: string;
    items: PrescriptionItem[];
}

export interface Doctor {
    id: string;
    name: string;
    /** Specjalizacja wpisywana na receptę po wybraniu lekarza; może jej nie być. */
    specialization?: string | null;
}

export interface Specialization {
    id: string;
    name: string;
}
