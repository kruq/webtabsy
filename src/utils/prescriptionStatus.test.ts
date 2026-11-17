import Prescription, { PrescriptionItem, PrescriptionValidity } from '../models/Prescription';
import {
    addDaysYmd,
    expiryDate,
    formatYmdForDisplay,
    itemStatus,
    prescriptionStatus,
    tabletsOnPrescriptions,
    upcomingPurchaseDeadlines,
} from './prescriptionStatus';

const ISSUED = '2026-01-10';

function item(purchasedPackages: number, packages = 2, medicineId = 'med-1', packageSize = 30): PrescriptionItem {
    return {
        id: `item-${Math.random()}`,
        medicineId,
        medicineName: medicineId,
        packages,
        packageSize,
        purchasedPackages,
    };
}

function prescription(validity: PrescriptionValidity, items: PrescriptionItem[]): Prescription {
    return { id: 'p', issueDate: ISSUED, validity, code: '', doctor: '', specialization: '', note: '', items };
}

describe('addDaysYmd / expiryDate', () => {
    it('crosses month and year boundaries', () => {
        expect(addDaysYmd('2026-12-20', 30)).toBe('2027-01-19');
    });

    it('computes 30-day and annual expiry from the issue date', () => {
        expect(expiryDate({ issueDate: ISSUED, validity: '30days' })).toBe('2026-02-09');
        expect(expiryDate({ issueDate: ISSUED, validity: 'annual' })).toBe('2027-01-10');
    });
});

describe('itemStatus', () => {
    const p30 = prescription('30days', []);
    const pYear = prescription('annual', []);

    it('is new until something is purchased', () => {
        expect(itemStatus(p30, item(0), '2026-01-15')).toBe('new');
    });

    it('is partially purchased while packages remain', () => {
        expect(itemStatus(p30, item(1), '2026-01-15')).toBe('partiallyPurchased');
    });

    it('is fully purchased when no packages remain, even after expiry', () => {
        expect(itemStatus(p30, item(2), '2027-06-01')).toBe('fullyPurchased');
    });

    it('is still valid on the last day and expired the day after', () => {
        expect(itemStatus(p30, item(0), '2026-02-09')).toBe('new');
        expect(itemStatus(p30, item(1), '2026-02-10')).toBe('expired');
    });

    it('expires on an annual prescription when nothing was purchased in the first 30 days', () => {
        expect(itemStatus(pYear, item(0), '2026-02-09')).toBe('new');
        expect(itemStatus(pYear, item(0), '2026-02-10')).toBe('expired');
    });

    it('stays valid on an annual prescription after the first 30 days once a package was purchased', () => {
        expect(itemStatus(pYear, item(1), '2026-06-01')).toBe('partiallyPurchased');
        expect(itemStatus(pYear, item(1), '2027-01-11')).toBe('expired');
    });
});

describe('prescriptionStatus', () => {
    const day = '2026-01-15';

    it('is new when every item is new', () => {
        expect(prescriptionStatus(prescription('30days', [item(0), item(0)]), day)).toBe('new');
    });

    it('is fully purchased when every item is', () => {
        expect(prescriptionStatus(prescription('30days', [item(2), item(2)]), day)).toBe('fullyPurchased');
    });

    it('is partially purchased when some items are bought and some remain', () => {
        expect(prescriptionStatus(prescription('30days', [item(2), item(0)]), day)).toBe('partiallyPurchased');
    });

    it('is expired when every item is expired', () => {
        expect(prescriptionStatus(prescription('annual', [item(0), item(0)]), '2026-03-01')).toBe('expired');
    });

    it('is expired when nothing can be purchased anymore', () => {
        expect(prescriptionStatus(prescription('annual', [item(2), item(0)]), '2026-03-01')).toBe('expired');
    });

    it('is partially purchased when one item expired but another can still be purchased', () => {
        expect(prescriptionStatus(prescription('annual', [item(1), item(0)]), '2026-03-01')).toBe('partiallyPurchased');
    });

    it('treats an empty prescription as new until it expires', () => {
        expect(prescriptionStatus(prescription('30days', []), day)).toBe('new');
        expect(prescriptionStatus(prescription('30days', []), '2026-03-01')).toBe('expired');
    });
});

describe('tabletsOnPrescriptions', () => {
    it('sums remaining tablets of purchasable items per medicine', () => {
        const prescriptions = [
            prescription('annual', [item(1, 3, 'med-1', 30), item(0, 1, 'med-2', 20)]),
            prescription('annual', [item(0, 2, 'med-1', 28)]),
        ];

        const result = tabletsOnPrescriptions(prescriptions, '2026-01-15');

        expect(result.get('med-1')).toBe(2 * 30 + 2 * 28);
        expect(result.get('med-2')).toBe(20);
    });

    it('skips expired and fully purchased items', () => {
        const prescriptions = [prescription('annual', [item(0, 2, 'med-1'), item(2, 2, 'med-2')])];

        const result = tabletsOnPrescriptions(prescriptions, '2026-03-01');

        expect(result.has('med-1')).toBe(false);
        expect(result.has('med-2')).toBe(false);
    });
});

describe('formatYmdForDisplay', () => {
    it('formats a stored date in Polish order', () => {
        expect(formatYmdForDisplay('2026-02-09')).toBe('09.02.2026');
    });
});

describe('upcomingPurchaseDeadlines', () => {
    it('warns about an unstarted item on an annual prescription with a deadline 30 days after issue', () => {
        const result = upcomingPurchaseDeadlines([prescription('annual', [item(0)])], '2026-01-15');

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({ deadline: '2026-02-09', daysLeft: 25, started: false, remainingPackages: 2 });
    });

    it('warns about a 30-day prescription until its expiry, also once started', () => {
        const result = upcomingPurchaseDeadlines([prescription('30days', [item(1)])], '2026-02-09');

        expect(result[0]).toMatchObject({ deadline: '2026-02-09', daysLeft: 0, started: true });
    });

    it('warns about a started annual item only in the last 30 days of validity', () => {
        const p = prescription('annual', [item(1)]);

        expect(upcomingPurchaseDeadlines([p], '2026-12-10')).toHaveLength(0);
        expect(upcomingPurchaseDeadlines([p], '2026-12-11')[0]).toMatchObject({ deadline: '2027-01-10', daysLeft: 30 });
    });

    it('skips expired and fully purchased items', () => {
        const result = upcomingPurchaseDeadlines([prescription('annual', [item(0), item(2)])], '2026-03-01');

        expect(result).toHaveLength(0);
    });

    it('sorts the most urgent deadline first', () => {
        const older = { ...prescription('30days', [item(0, 1, 'B')]), issueDate: '2026-01-01' };
        const newer = prescription('30days', [item(0, 1, 'A')]);

        const result = upcomingPurchaseDeadlines([newer, older], '2026-01-15');

        expect(result.map(r => r.medicineName)).toEqual(['B', 'A']);
    });
});
