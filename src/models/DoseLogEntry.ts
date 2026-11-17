export type DoseLogAction = 'taken' | 'skipped';

export default interface DoseLogEntry {
    id: string;
    medicineId: string;
    /** Nazwa leku w chwili zdarzenia - wpis pozostaje czytelny po zmianie nazwy lub usunięciu leku. */
    medicineName: string;
    /** null dla leku wziętego poza grafikiem. */
    doseId: string | null;
    action: DoseLogAction;
    amount: number;
    /** Zaplanowana data i godzina dawki; dla leku wziętego poza grafikiem - moment wzięcia. */
    scheduledAt: Date;
    /** Moment zapisania wpisu. */
    loggedAt: Date;
    unscheduled: boolean;
}

export type NewDoseLogEntry = Omit<DoseLogEntry, 'id' | 'loggedAt'>;
