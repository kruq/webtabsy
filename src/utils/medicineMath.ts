import IMedicine from '../models/IMedicine';
import { roundAmount } from './fraction';

const ZERO_TOLERANCE = 1e-6;

export function countAmountInCurrentPackage(medicine: IMedicine | undefined): number | undefined {
    if (!medicine) return undefined;
    const lastPackageSize = medicine.purchases.at(-1)?.numberOfTablets;
    if (!lastPackageSize) return undefined;

    const remainder = roundAmount(medicine.count % lastPackageSize);
    if (Math.abs(remainder) > ZERO_TOLERANCE) return remainder;
    if (medicine.count === 0) return undefined;
    return lastPackageSize;
}

export function countDaysOfStock(medicine: IMedicine): number {
    if (!medicine.count) return 0;
    const today = new Date();
    const activeDoses = medicine.doses.filter(d => !d.endDate || d.endDate > today);
    if (activeDoses.length === 0) return -1;

    const sumDaily = activeDoses.reduce((acc, d) => acc + (d.amount ?? 0), 0);
    if (!sumDaily) return 0;
    return Math.floor(medicine.count / sumDaily);
}
