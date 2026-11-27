import Prescription, { PrescriptionItem, PrescriptionValidity } from '../models/Prescription';
import {
    addDaysYmd,
    expiryDate,
    formatYmdForDisplay,
    itemStatus,
    packagesOnPrescriptions,
    prescriptionsOfDoctor,
    prescriptionSummary,
    PrescriptionEntry,
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

describe('packagesOnPrescriptions', () => {
    it('sums remaining packages per medicine and package size, smallest size first', () => {
        const prescriptions = [
            prescription('annual', [item(1, 3, 'med-1', 60), item(0, 1, 'med-2', 20)]),
            prescription('annual', [item(0, 2, 'med-1', 30), item(0, 1, 'med-1', 60)]),
        ];

        const result = packagesOnPrescriptions(prescriptions, '2026-01-15');

        expect(result.get('med-1')).toEqual([{ packages: 2, packageSize: 30 }, { packages: 3, packageSize: 60 }]);
        expect(result.get('med-2')).toEqual([{ packages: 1, packageSize: 20 }]);
    });

    it('skips expired and fully purchased items', () => {
        const prescriptions = [prescription('annual', [item(0, 2, 'med-1'), item(2, 2, 'med-2')])];

        const result = packagesOnPrescriptions(prescriptions, '2026-03-01');

        expect(result.size).toBe(0);
    });
});

describe('prescriptionsOfDoctor', () => {
    it('counts prescriptions by doctor name, ignoring case and surrounding spaces', () => {
        const prescriptions = [
            { ...prescription('annual', []), doctor: 'Jan Kowalski' },
            { ...prescription('30days', []), doctor: ' jan kowalski ' },
            { ...prescription('30days', []), doctor: 'Anna Nowak' },
        ];

        expect(prescriptionsOfDoctor(prescriptions, 'Jan Kowalski')).toBe(2);
        expect(prescriptionsOfDoctor(prescriptions, 'Ewa Zając')).toBe(0);
    });
});

describe('prescriptionSummary', () => {
    const entry = (prescriptionId: string, code: string, packages: number, packageSize = 30): PrescriptionEntry =>
        ({ prescriptionId, issueDate: ISSUED, code, packages, packageSize, deadline: '2026-02-09' });

    it('describes one prescription with its code', () => {
        expect(prescriptionSummary([entry('p1', '1234', 3)], 'tab.')).toBe('Recepta: 3 op. × 30 tab., kod 1234');
    });

    it('groups several prescriptions of one medicine and lists every code, also a missing one', () => {
        expect(prescriptionSummary([entry('p1', '1234', 1, 28), entry('p2', '', 1, 28)], 'tab.'))
            .toBe('Recepty: 2 op. × 28 tab., kody 1234, bez kodu');
    });

    it('shows packages only for a medicine without quantity control', () => {
        expect(prescriptionSummary([entry('p1', '', 2, 0)], 'tab.')).toBe('Recepta: 2 op., bez kodu');
    });
});

describe('formatYmdForDisplay', () => {
    it('formats a stored date in Polish order', () => {
        expect(formatYmdForDisplay('2026-02-09')).toBe('09.02.26');
    });
});

describe('upcomingPurchaseDeadlines', () => {
    it('warns about an unstarted item on an annual prescription 14 days before its deadline (30 days after issue)', () => {
        expect(upcomingPurchaseDeadlines([prescription('annual', [item(0)])], '2026-01-25')).toHaveLength(0);
        const result = upcomingPurchaseDeadlines([prescription('annual', [item(0)])], '2026-01-26');

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({ deadline: '2026-02-09', daysLeft: 14, started: false, remainingPackages: 2 });
    });

    it('warns about a 30-day prescription until its expiry, also once started', () => {
        const result = upcomingPurchaseDeadlines([prescription('30days', [item(1)])], '2026-02-09');

        expect(result[0]).toMatchObject({ deadline: '2026-02-09', daysLeft: 0, started: true });
    });

    it('warns about a started annual item only in the last 14 days of validity', () => {
        const p = prescription('annual', [item(1)]);

        expect(upcomingPurchaseDeadlines([p], '2026-12-26')).toHaveLength(0);
        expect(upcomingPurchaseDeadlines([p], '2026-12-27')[0]).toMatchObject({ deadline: '2027-01-10', daysLeft: 14 });
    });

    it('skips expired and fully purchased items', () => {
        const result = upcomingPurchaseDeadlines([prescription('annual', [item(0), item(2)])], '2026-03-01');

        expect(result).toHaveLength(0);
    });

    it('sorts the most urgent deadline first', () => {
        const older = { ...prescription('30days', [item(0, 1, 'B')]), issueDate: '2026-01-01' };
        const newer = prescription('30days', [item(0, 1, 'A')]);

        const result = upcomingPurchaseDeadlines([newer, older], '2026-01-28');

        expect(result.map(r => r.medicineName)).toEqual(['B', 'A']);
    });
});
