/** Id elementu DOM karty leku na liście leków. */
export function medicineCardElementId(medicineId: string): string {
    return `medicine-card-${medicineId}`;
}

/** Dolna krawędź przyklejonych pasków (nagłówek, wyszukiwanie), gdy są przyklejone - pod nimi ma stanąć karta. */
function stickyHeadersBottom(): number {
    return Array.from(document.querySelectorAll<HTMLElement>('.sticky-top'))
        .filter(el => el.offsetParent !== null) // pomija paski w niewidocznych zakładkach
        .reduce((bottom, el) => Math.max(bottom, (parseFloat(getComputedStyle(el).top) || 0) + el.offsetHeight), 0);
}

const MARGIN_PX = 8;
const MAX_FRAMES = 20;

/**
 * Przewija stronę tak, żeby karta leku stała tuż pod przyklejonymi paskami. Czeka kilka klatek, aż zakładka
 * z listą leków się pokaże, a karta rozwinie.
 */
export function scrollToMedicineCard(medicineId: string, frame = 0): void {
    const element = document.getElementById(medicineCardElementId(medicineId));
    if (!element || element.offsetParent === null) {
        if (frame < MAX_FRAMES) requestAnimationFrame(() => scrollToMedicineCard(medicineId, frame + 1));
        return;
    }
    const top = element.getBoundingClientRect().top + window.scrollY - stickyHeadersBottom() - MARGIN_PX;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}
