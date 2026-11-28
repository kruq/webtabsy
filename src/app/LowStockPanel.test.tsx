import React from 'react';
import { render, screen } from '@testing-library/react';
import IMedicine from '../models/IMedicine';
import LowStockPanel from './LowStockPanel';

/** Lek doraźny bez zapasu - zawsze trafia do kończących się. */
function med(name: string, extra: Partial<IMedicine> = {}): IMedicine {
    return { id: name, name, meal: '', description: '', count: 0, asNeeded: true, isVisible: true, hideWhenEmpty: false, doses: [], purchases: [], ...extra };
}

function renderPanel(medicines: IMedicine[]) {
    render(<LowStockPanel medicines={medicines} prescriptionEntries={new Map()} onOpenPrescriptions={jest.fn()} />);
}

describe('LowStockPanel', () => {
    it('shows the missing prescription on the same line as the name', () => {
        renderPanel([med('Apap')]);

        // Wiersz leku: nazwa, stan zapasu i brak recepty w jednym elemencie, bez osobnej linii pod spodem.
        const line = screen.getByText((_, element) => element?.tagName === 'SMALL' && /^Apap — .* · brak recepty$/.test(element.textContent ?? ''));
        expect(line).toBeInTheDocument();
    });

    it('shows no missing prescription for a medicine available without one', () => {
        renderPanel([med('Apap', { noPrescriptionNeeded: true })]);

        expect(screen.getByText('Apap')).toBeInTheDocument();
        expect(screen.queryByText(/brak recepty/)).toBeNull();
    });
});
