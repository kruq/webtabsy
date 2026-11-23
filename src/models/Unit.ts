/** Jednostka leku (tabletka, kapsułka, ml...). Jedna lista wspólna dla wszystkich użytkowników. */
export default interface Unit {
    id: string;
    nominativeSingular: string;
    nominativePlural: string;
    genitiveSingular: string;
    genitivePlural: string;
    abbreviation: string;
}
