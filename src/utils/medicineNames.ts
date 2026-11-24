import IMedicine from '../models/IMedicine';

/** Podpowiedzi pokazujemy, gdy wpisano więcej niż tyle znaków. */
export const NAME_HINT_MIN_LENGTH = 3;

function normalize(name: string): string {
    return name.trim().toLocaleLowerCase('pl');
}

/** Ta sama nazwa leku: bez względu na wielkość liter i spacje na początku i końcu (tak samo sprawdza API). */
export function sameMedicineName(a: string, b: string): boolean {
    return normalize(a) === normalize(b);
}

/** Czy inny lek (poza exceptId) ma już tę nazwę. */
export function isMedicineNameTaken(name: string, medicines: IMedicine[], exceptId?: string): boolean {
    return name.trim().length > 0 && medicines.some(m => m.id !== exceptId && sameMedicineName(m.name, name));
}

/**
 * Leki, których nazwa zawiera wpisaną frazę (bez względu na wielkość liter), alfabetycznie -
 * dopiero gdy fraza ma więcej niż NAME_HINT_MIN_LENGTH znaków.
 */
export function medicinesContaining(phrase: string, medicines: IMedicine[], exceptId?: string): IMedicine[] {
    const needle = normalize(phrase);
    if (needle.length <= NAME_HINT_MIN_LENGTH) return [];
    return medicines
        .filter(m => m.id !== exceptId && normalize(m.name).includes(needle))
        .sort((a, b) => a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' }));
}
