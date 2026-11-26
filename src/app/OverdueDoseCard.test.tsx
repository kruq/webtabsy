import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import IMedicine from '../models/IMedicine';
import OverdueDose from '../models/OverdueDoses';
import { newPurchase } from '../utils/purchases';
import OverdueDoseCard from './OverdueDoseCard';

function med(extra: Partial<IMedicine>): IMedicine {
    return { id: 'm', name: 'Asentra', meal: '', description: '', count: 70, isVisible: true, hideWhenEmpty: false, doses: [], purchases: [], ...extra };
}

const dose = new OverdueDose({ id: 'd', amount: 1, numberOfDays: 1, nextDoseDate: new Date(), medicineName: 'Asentra', meal: '', time: '08:00', endDate: null });

function renderCard(medicine: IMedicine) {
    render(<OverdueDoseCard dose={dose} medicines={[medicine]} onSkip={jest.fn()} onConfirm={jest.fn()} onOpenMedicine={jest.fn()} />);
    return screen.queryAllByTitle(/^(W aktualnym opakowaniu|Razem)$/).map(e => e.textContent);
}

describe('OverdueDoseCard stock', () => {
    it('shows the current package and the total in separate fields', () => {
        // Na telefonie same liczby, od tabletu z opisem (widoczność przełącza CSS: d-md-none / d-md-inline).
        // Telefon: same liczby; tablet: opis ze skrótem; od 992px opis z pełną nazwą (przełącza CSS).
        expect(renderCard(med({ purchases: [newPurchase('p', new Date(), 3, 28, 10)] })))
            .toEqual(['14W opakowaniu: 14 tab.14 tabletek', '70Wszystkich: 70 tab.70 tabletek']);
        expect(screen.getByText('14')).toHaveClass('d-md-none');
        expect(screen.getByText('14 tab.')).toHaveClass('d-lg-none');
        expect(screen.getByText('14 tabletek')).toHaveClass('d-none', 'd-lg-inline');
    });

    it('shows one field without a current package', () => {
        expect(renderCard(med({}))).toEqual(['70Masz: 70 tab.70 tabletek']);
    });

    it('shows a dash without quantity control', () => {
        expect(renderCard(med({ ignoreQuantity: true }))).toEqual(['-']);
    });
});

describe('OverdueDoseCard info', () => {
    it('hides the question mark without meal and description', () => {
        renderCard(med({}));
        expect(screen.queryByRole('button', { name: 'Informacje o leku' })).toBeNull();
    });

    it('shows meal and description in a dialog closed with "Zamknij"', async () => {
        renderCard(med({ meal: 'po jedzeniu', description: 'nie łączyć z alkoholem' }));
        expect(screen.queryByText('po jedzeniu')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'Informacje o leku' }));

        expect(await screen.findByText('po jedzeniu')).toBeInTheDocument();
        expect(screen.getByText('Przyjmowanie z posiłkiem')).toBeInTheDocument();
        expect(screen.getByText('Opis')).toBeInTheDocument();
        expect(screen.getByText('nie łączyć z alkoholem')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Zamknij' }));
        await waitFor(() => expect(screen.queryByText('po jedzeniu')).toBeNull());
    });
});

describe('OverdueDoseCard without the current package', () => {
    it('shows only the total when the profile hides the current package', () => {
        render(
            <OverdueDoseCard
                dose={dose}
                medicines={[med({ purchases: [newPurchase('p', new Date(), 3, 28, 10)] })]}
                onSkip={jest.fn()}
                onConfirm={jest.fn()}
                showCurrentPackage={false}
            />,
        );
        expect(screen.queryAllByTitle(/^(W aktualnym opakowaniu|Razem)$/).map(e => e.textContent)).toEqual(['Masz: 70 tab.70 tabletek']);
    });
});

describe('OverdueDoseCard total only', () => {
    function renderTotal(medicine: IMedicine) {
        render(<OverdueDoseCard dose={dose} medicines={[medicine]} onSkip={jest.fn()} onConfirm={jest.fn()} showCurrentPackage={false} />);
    }

    it('says how much is left', () => {
        renderTotal(med({ count: 70 }));
        expect(screen.getByTitle('Razem')).toHaveTextContent('Masz: 70 tab.');
    });

    it('says the medicine is missing at 0', () => {
        renderTotal(med({ count: 0 }));
        expect(screen.getByTitle('Razem')).toHaveTextContent('Brak tabletek');
        expect(screen.getByTitle('Razem')).toHaveClass('text-danger');
    });
});

describe('OverdueDoseCard colors', () => {
    it('colors both fields by how long the stock lasts', () => {
        renderCard(med({ count: 0, purchases: [newPurchase('p', new Date(), 1, 28, 10)] }));
        screen.queryAllByTitle(/^(W aktualnym opakowaniu|Razem)$/).forEach(field => expect(field).toHaveClass('text-danger'));
    });
});

describe('OverdueDoseCard meal', () => {
    it('shows the meal next to the name from tablets only', () => {
        const withMeal = new OverdueDose({ id: 'd', amount: 1, numberOfDays: 1, nextDoseDate: new Date(), medicineName: 'Asentra', meal: 'po jedzeniu', time: '08:00', endDate: null });
        render(<OverdueDoseCard dose={withMeal} medicines={[med({ meal: 'po jedzeniu' })]} onSkip={jest.fn()} onConfirm={jest.fn()} />);
        expect(screen.getByText('po jedzeniu')).toHaveClass('d-none', 'd-md-inline');
    });
});

describe('OverdueDoseCard dose label', () => {
    it('shows the abbreviation below 992px and the full unit name above', () => {
        const half = new OverdueDose({ id: 'd', amount: 3.5, numberOfDays: 1, nextDoseDate: new Date(), medicineName: 'Asentra', meal: '', time: '08:00', endDate: null });
        render(<OverdueDoseCard dose={half} medicines={[med({})]} onSkip={jest.fn()} onConfirm={jest.fn()} />);
        expect(screen.getByText('3½ tab.')).toHaveClass('d-lg-none');
        expect(screen.getByText('3½ tabletki')).toHaveClass('d-none', 'd-lg-inline');
    });
});
