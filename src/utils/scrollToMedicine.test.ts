import { medicineCardElementId, scrollToMedicineCard } from './scrollToMedicine';

function visible(el: HTMLElement, height: number) {
    Object.defineProperty(el, 'offsetParent', { configurable: true, get: () => document.body });
    Object.defineProperty(el, 'offsetHeight', { configurable: true, get: () => height });
}

afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
});

describe('scrollToMedicineCard', () => {
    it('scrolls the card just below the visible sticky bars', () => {
        const header = document.createElement('div');
        header.className = 'sticky-top';
        visible(header, 60);
        const search = document.createElement('div');
        search.className = 'sticky-top';
        search.style.top = '45px';
        visible(search, 70);
        const hiddenSticky = document.createElement('div'); // w niewidocznej zakładce: offsetParent = null
        hiddenSticky.className = 'sticky-top';
        const card = document.createElement('div');
        card.id = medicineCardElementId('m1');
        visible(card, 100);
        card.getBoundingClientRect = () => ({ top: 900 } as DOMRect);
        document.body.append(header, search, hiddenSticky, card);
        const scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

        scrollToMedicineCard('m1');

        // 900 (karta) + 0 (scrollY) - (45 + 70, najniższy pasek) - 8 (margines)
        expect(scrollTo).toHaveBeenCalledWith({ top: 777, behavior: 'smooth' });
    });
});
