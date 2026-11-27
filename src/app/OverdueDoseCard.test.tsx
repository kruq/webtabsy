import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import IMedicine from '../models/IMedicine';
import OverdueDose from '../models/OverdueDoses';
import { newPurchase } from '../utils/purchases';
import OverdueDoseCard from './OverdueDoseCard';
import { PrescriptionEntry } from '../utils/prescriptionStatus';

function med(extra: Partial<IMedicine>): IMedicine {
    return { id: 'm', name: 'Asentra', meal: '', description: '', count: 70, isVisible: true, hideWhenEmpty: false, doses: [], purchases: [], ...extra };
}

const dose = new OverdueDose({ id: 'd', amount: 1, numberOfDays: 1, nextDoseDate: new Date(), medicineName: 'Asentra', meal: '', time: '08:00', endDate: null });

/** Pozycje recept na lek 'm' z podanych par [opakowania, wielkość opakowania]. */
function entries(...packages: [number, number][]): Map<string, PrescriptionEntry[]> {
    return new Map([['m', packages.map(([p, size], i) => ({
        prescriptionId: `p${i}`, issueDate: '2026-11-01', code: i === 0 ? '1234' : '', packages: p, packageSize: size, deadline: '2026-12-01',
    }))]]);
}

function renderCard(medicine: IMedicine, prescriptionEntries?: Map<string, PrescriptionEntry[]>, showCurrentPackage = true, onSetRunningOut = jest.fn()) {
    render(
        <OverdueDoseCard
            dose={dose}
            medicines={[medicine]}
            onSkip={jest.fn()}
            onConfirm={jest.fn()}
            onOpenMedicine={jest.fn()}
            prescriptionEntries={prescriptionEntries}
            onSetRunningOut={onSetRunningOut}
            showCurrentPackage={showCurrentPackage}
        />,
    );
    return screen.queryAllByTitle(/^(W aktualnym opakowaniu|Razem|Do wykupienia z recepty)$/).map(e => e.textContent);
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

    it('shows packages on a valid prescription in orange instead of "Brak" when the medicine has run out', () => {
        const packages = entries([2, 30], [1, 60]);
        // Telefon: suma opakowań; tablet: skrót jednostki; od 992px pełna nazwa.
        expect(renderCard(med({ count: 0 }), packages))
            .toEqual(['3 op.Na recepcie: 2 op. × 30 tab.30 tabletek + 1 op. × 60 tab.60 tabletek']);
        expect(screen.getByTitle('Do wykupienia z recepty')).toHaveClass('text-orange');
    });

    it('shows the prescription also with the single-field profile setting', () => {
        const packages = entries([2, 30]);
        expect(renderCard(med({ count: 0 }), packages, false)).toEqual(['2 op.Na recepcie: 2 op. × 30 tab.30 tabletek']);
    });

    it('keeps the red "Brak" without a prescription', () => {
        expect(renderCard(med({ count: 0 }), new Map(), false)).toEqual(['Brak tabletek']);
        expect(screen.getByTitle('Razem')).toHaveClass('text-danger');
    });

    it('ignores prescriptions while the medicine is in stock', () => {
        const packages = entries([2, 30]);
        expect(renderCard(med({}), packages)).toEqual(['70Masz: 70 tab.70 tabletek']);
    });

    it('shows a "Kończy się" switch instead of the stock without quantity control', () => {
        const onSetRunningOut = jest.fn();
        expect(renderCard(med({ ignoreQuantity: true }), undefined, true, onSetRunningOut)).toEqual([]);
        fireEvent.click(screen.getByLabelText('Kończy się'));
        expect(onSetRunningOut).toHaveBeenCalledWith('m', true);
    });
});

describe('OverdueDoseCard prescription label', () => {
    it('is hidden without a valid prescription', () => {
        renderCard(med({}), new Map());
        expect(screen.queryByRole('button', { name: 'Recepta na lek' })).toBeNull();
    });

    it('shows all prescriptions of the medicine together in a dialog', async () => {
        renderCard(med({}), entries([2, 30], [1, 30]));

        fireEvent.click(screen.getByRole('button', { name: 'Recepta na lek' }));

        expect(await screen.findByText('Do wykupienia z recept')).toBeInTheDocument();
        expect(screen.getByText('3 op. × 30 tab.')).toBeInTheDocument();
        expect(screen.getByText('· kod 1234')).toBeInTheDocument();
        expect(screen.getByText('· bez kodu')).toBeInTheDocument();
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
