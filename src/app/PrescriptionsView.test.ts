import Prescription from '../models/Prescription';
import { addDaysYmd, todayYmd } from '../utils/prescriptionStatus';
import { isShown } from './PrescriptionsView';

function prescription(issueDate: string, packages: number, purchasedPackages: number): Prescription {
    return {
        id: 'p',
        issueDate,
        validity: '30days',
        code: '',
        doctor: '',
        specialization: '',
        note: '',
        items: [{ id: 'i', medicineId: 'm', medicineName: 'm', packages, packageSize: 30, purchasedPackages }],
    };
}

const issued = prescription(todayYmd(), 2, 0);
const partial = prescription(todayYmd(), 2, 1);
const fulfilled = prescription(todayYmd(), 2, 2);
const expired = prescription(addDaysYmd(todayYmd(), -60), 2, 0);

describe('isShown', () => {
    it('always shows issued and partially fulfilled prescriptions', () => {
        expect(isShown(issued, false, false)).toBe(true);
        expect(isShown(partial, false, false)).toBe(true);
    });

    it('shows expired prescriptions only with the "przeterminowane" switch', () => {
        expect(isShown(expired, false, true)).toBe(false);
        expect(isShown(expired, true, false)).toBe(true);
    });

    it('shows fulfilled prescriptions only with the "zrealizowane" switch', () => {
        expect(isShown(fulfilled, true, false)).toBe(false);
        expect(isShown(fulfilled, false, true)).toBe(true);
    });
});
