import IPurchase from '../models/IPurchase';
import { purchaseFromDTO } from '../services/mappers';
import { averagePackagePrice, formatPrice, newPurchase } from './purchases';

describe('purchases', () => {
    it('formats prices with a comma and two decimals', () => {
        expect(formatPrice(26)).toBe('26,00 zł');
        expect(formatPrice(25.99)).toBe('25,99 zł');
    });

    it('builds one record for several packages', () => {
        expect(newPurchase('p', new Date(0), 3, 30, 10.33)).toMatchObject({ packages: 3, numberOfTablets: 30, price: 10.33, totalPrice: 30.99 });
        expect(newPurchase('p', new Date(0), 2, 30, undefined).totalPrice).toBeUndefined();
    });

    it('averages the price over all priced packages', () => {
        const purchases = [
            newPurchase('a', new Date(0), 3, 30, 10),
            newPurchase('b', new Date(0), 1, 30, 30),
            newPurchase('c', new Date(0), 5, 30, undefined),
        ];
        expect(averagePackagePrice(purchases)).toBe(15);
        expect(averagePackagePrice([purchases[2]] as IPurchase[])).toBeUndefined();
    });

    it('reads records written before the migration as one package, with 0 as no price', () => {
        expect(purchaseFromDTO({ id: 'x', date: '2026-01-01T00:00:00Z', numberOfTablets: 30, price: 25.99 }))
            .toMatchObject({ packages: 1, price: 25.99, totalPrice: 25.99 });
        expect(purchaseFromDTO({ id: 'y', date: '2026-01-01T00:00:00Z', numberOfTablets: 30, price: 0 }))
            .toMatchObject({ packages: 1, price: undefined, totalPrice: undefined });
        expect(purchaseFromDTO({ id: 'z', date: '2026-01-01T00:00:00Z', numberOfTablets: 30, packages: 2, price: null, totalPrice: null }))
            .toMatchObject({ packages: 2, price: undefined, totalPrice: undefined });
    });
});
