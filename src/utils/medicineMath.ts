import IMedicine from '../models/IMedicine';
import Dose from '../models/Dose';
import { roundAmount, subtractAmount } from './fraction';

const ZERO_TOLERANCE = 1e-6;

// Dawki bez daty końca trwają w nieskończoność - po tym horyzoncie uznajemy, że zapas wystarcza.
const FORECAST_HORIZON_DAYS = 5 * 365;

export function countAmountInCurrentPackage(medicine: IMedicine | undefined): number | undefined {
    if (!medicine) return undefined;
    const lastPackageSize = medicine.purchases.at(-1)?.numberOfTablets;
    if (!lastPackageSize) return undefined;

    const remainder = roundAmount(medicine.count % lastPackageSize);
    if (Math.abs(remainder) > ZERO_TOLERANCE) return remainder;
    if (medicine.count === 0) return undefined;
    return lastPackageSize;
}

export interface StockForecast {
    /** Liczba dni od dziś do ostatniego dnia, w którym zapas pozwala przyjąć dawkę. */
    days: number;
    /** Data tego ostatniego dnia. */
    lastDay: Date;
    /** true, gdy zapas pokrywa cały plan dawkowania i się nie skończy. */
    coversWholePlan: boolean;
}

function startOfDay(date: Date): Date {
    const result = new Date(date.getTime());
    result.setHours(0, 0, 0, 0);
    return result;
}

function daysFromToday(today: Date, date: Date): number {
    return Math.round((startOfDay(date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

interface Schedule {
    amount: number;
    /** Pierwszy dzień (licząc od dziś), w którym dawka jest przyjmowana. */
    firstDay: number;
    /** Ostatni dzień, w którym dawka jest przyjmowana; undefined = bez końca. */
    lastDay: number | undefined;
    interval: number;
}

function toSchedule(dose: Dose, today: Date): Schedule | undefined {
    const amount = dose.amount ?? 0;
    if (amount <= 0) return undefined;

    // Zaległe dawki (data w przeszłości) i tak trzeba przyjąć, więc liczymy je od dziś.
    const firstDay = Math.max(0, daysFromToday(today, dose.nextDoseDate));
    const lastDay = dose.endDate ? daysFromToday(today, dose.endDate) : undefined;
    if (lastDay !== undefined && lastDay < firstDay) return undefined;

    return { amount, firstDay, lastDay, interval: dose.numberOfDays > 0 ? dose.numberOfDays : 1 };
}

function amountDueOn(schedules: Schedule[], day: number): number {
    return schedules.reduce((total, s) => {
        if (day < s.firstDay) return total;
        if (s.lastDay !== undefined && day > s.lastDay) return total;
        if ((day - s.firstDay) % s.interval !== 0) return total;
        return total + s.amount;
    }, 0);
}

/**
 * Symuluje dzień po dniu przyjmowanie dawek, uwzględniając ich datę początku, końca
 * i częstotliwość, i zwraca informację, na jak długo wystarczy aktualny zapas.
 * Zwraca undefined, gdy nie ma zapasu albo nie ma już żadnych dawek do przyjęcia.
 */
export function forecastStock(medicine: IMedicine): StockForecast | undefined {
    if (!medicine.count || medicine.count <= 0) return undefined;

    const today = startOfDay(new Date());
    const schedules = (medicine.doses ?? [])
        .map(dose => toSchedule(dose, today))
        .filter((s): s is Schedule => s !== undefined);
    if (schedules.length === 0) return undefined;

    const horizon = schedules.every(s => s.lastDay !== undefined)
        ? Math.max(...schedules.map(s => s.lastDay as number))
        : FORECAST_HORIZON_DAYS;

    let remaining = medicine.count;
    let lastCoveredDay = -1;
    let ranOut = false;

    for (let day = 0; day <= horizon; day++) {
        const due = amountDueOn(schedules, day);
        if (due === 0) continue;
        if (remaining - due < -ZERO_TOLERANCE) {
            ranOut = true;
            break;
        }
        remaining = subtractAmount(remaining, due);
        lastCoveredDay = day;
    }

    if (lastCoveredDay < 0 && !ranOut) return undefined;

    const days = Math.max(0, lastCoveredDay);
    const lastDay = new Date(today.getTime());
    lastDay.setDate(lastDay.getDate() + days);
    return { days, lastDay, coversWholePlan: !ranOut };
}
