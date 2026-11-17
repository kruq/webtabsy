import { DoseLogAction } from '../models/DoseLogEntry';

export default interface IDoseLogEntryDTO {
    id: string;
    medicineId: string;
    medicineName: string;
    doseId: string | null;
    action: DoseLogAction;
    amount: number;
    scheduledAt: string;
    loggedAt: string;
    unscheduled: boolean;
}
