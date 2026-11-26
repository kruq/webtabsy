import IPurchase from '../models/IPurchase';

/** Kwota zaokrąglona do groszy. */
export function roundPrice(value: number): number {
    return Math.round(value * 100) / 100;
}

/** „25,99 zł” - zawsze dwa miejsca po przecinku. */
export function formatPrice(value: number): string {
    return `${value.toFixed(2).replace('.', ',')} zł`;
}

/** Nowy zakup kilku opakowań; cena wszystkich = cena opakowania × liczba opakowań. */
export function newPurchase(id: string, date: Date, packages: number, numberOfTablets: number, price: number | undefined): IPurchase {
    return {
        id,
        date,
        packages,
        numberOfTablets,
        price,
        totalPrice: price === undefined ? undefined : roundPrice(price * packages),
    };
}

/** Średnia cena opakowania ze wszystkich kupionych opakowań z ceną; undefined, gdy żaden zakup nie ma ceny. */
export function averagePackagePrice(purchases: IPurchase[]): number | undefined {
    const priced = purchases.filter(p => p.totalPrice !== undefined && p.packages > 0);
    const packages = priced.reduce((sum, p) => sum + p.packages, 0);
    if (packages === 0) return undefined;
    return roundPrice(priced.reduce((sum, p) => sum + (p.totalPrice as number), 0) / packages);
}
