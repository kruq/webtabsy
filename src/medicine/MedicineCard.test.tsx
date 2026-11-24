import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { UnitsProvider } from '../app/UnitsContext';
import MedicineCard, { IMedicineProps } from './MedicineCard';

function setupCard(open: boolean) {
    const medicineClick = jest.fn();
    const props: IMedicineProps = {
        id: 'med-1',
        name: 'Metformina',
        meal: '',
        description: '',
        count: 10,
        isVisible: true,
        hideWhenEmpty: false,
        doses: [],
        purchases: [],
        idOfMedicineDetails: open ? 'med-1' : '',
        medicineClick,
        updateMedicine: jest.fn(async () => undefined),
        deleteMedicine: jest.fn(async () => undefined),
        tabletsOnPrescriptions: 0,
        allMedicines: [],
    };
    render(<MedicineCard {...props} />);
    return medicineClick;
}

describe('MedicineCard toggling', () => {
    it('toggles when clicking anywhere on the summary, e.g. the medicine name', () => {
        const medicineClick = setupCard(false);

        fireEvent.click(screen.getByText('Metformina'));

        expect(medicineClick).toHaveBeenCalledWith('med-1');
    });

    it('does not toggle when clicking a button on the card', () => {
        const medicineClick = setupCard(false);

        fireEvent.click(screen.getByRole('button', { name: 'Take a dose' }));

        expect(medicineClick).not.toHaveBeenCalled();
    });

    it('does not collapse when clicking inside the expanded settings', () => {
        const medicineClick = setupCard(true);

        fireEvent.click(screen.getByText('Ustawienia'));

        expect(medicineClick).not.toHaveBeenCalled();
    });
});

describe('MedicineCard summary', () => {
    it('groups owned tablets and the total with prescriptions, each with its forecast', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        const props: IMedicineProps = {
            id: 'med-1',
            name: 'Asentra 50mg',
            meal: '',
            description: '',
            count: 70,
            isVisible: true,
            hideWhenEmpty: false,
            doses: [{ id: 'd', time: '09:00', amount: 3.5, numberOfDays: 1, nextDoseDate: tomorrow, endDate: null }],
            purchases: [{ id: 'p', date: new Date(), numberOfTablets: 28, price: undefined }],
            idOfMedicineDetails: '',
            medicineClick: jest.fn(),
            updateMedicine: jest.fn(async () => undefined),
            deleteMedicine: jest.fn(async () => undefined),
            tabletsOnPrescriptions: 308,
            allMedicines: [],
        };

        const { container } = render(<MedicineCard {...props} />);
        const text = container.textContent ?? '';

        expect(text).toMatch(/Posiadane\(14\) 70 tab\.\d{2}\.\d{2}\.\d{2}20 dni/);
        expect(text).toMatch(/Z receptami378 tab\.\d{2}\.\d{2}\.\d{2}108 dni/);
    });
});

describe('MedicineCard in another unit', () => {
    it('shows amounts with the abbreviation of the medicine unit', async () => {
        const ml = { id: 'ml', nominativeSingular: 'mililitr', nominativePlural: 'mililitry', genitiveSingular: 'mililitra', genitivePlural: 'mililitrów', abbreviation: 'ml' };
        global.fetch = jest.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([ml]) })) as unknown as typeof fetch;
        const props: IMedicineProps = {
            id: 'syrop', name: 'Syrop', meal: '', description: '', count: 120, unitId: 'ml', isVisible: true, hideWhenEmpty: false,
            doses: [], purchases: [], idOfMedicineDetails: 'syrop', medicineClick: jest.fn(),
            updateMedicine: jest.fn(async () => undefined), deleteMedicine: jest.fn(async () => undefined), tabletsOnPrescriptions: 0, allMedicines: [],
        };

        const { container } = render(<UnitsProvider medicines={[props]}><MedicineCard {...props} /></UnitsProvider>);

        await waitFor(() => expect(container.textContent).toContain('120 ml'));
        // Pole ustawień i (ukryte) okienko edycji dawki.
        expect(screen.getAllByText('Ilość mililitrów:').length).toBeGreaterThan(0);
        expect(screen.getByText('mililitr (ml)')).toBeInTheDocument();
    });
});

describe('MedicineCard without quantity control', () => {
    function renderUntracked(extra: Partial<IMedicineProps>) {
        const props: IMedicineProps = {
            id: 'med-1',
            name: 'Aerozol do nosa',
            meal: '',
            description: '',
            count: 12,
            isVisible: true,
            hideWhenEmpty: false,
            ignoreQuantity: true,
            doses: [{ id: 'd', time: '09:00', amount: 1, numberOfDays: 1, nextDoseDate: new Date(), endDate: null }],
            purchases: [{ id: 'p', date: new Date(), numberOfTablets: 0, price: 20 }],
            idOfMedicineDetails: 'med-1',
            medicineClick: jest.fn(),
            updateMedicine: jest.fn(async () => undefined),
            deleteMedicine: jest.fn(async () => undefined),
            tabletsOnPrescriptions: 0,
            allMedicines: [],
            ...extra,
        };
        render(<MedicineCard {...props} />);
    }

    it('hides the stock, taking, amounts, unit and hide-when-empty', () => {
        renderUntracked({});

        expect(screen.queryByRole('button', { name: 'Take a dose' })).toBeNull();
        expect(screen.queryByText('Posiadane')).toBeNull();
        expect(screen.queryByText('Ilość tabletek')).toBeNull();
        expect(screen.queryByText('Jednostka')).toBeNull();
        expect(screen.queryByLabelText('Ukryj jeśli brakuje leku')).toBeNull();
        expect(screen.queryByText(/tab\./)).toBeNull();
        expect(screen.getByLabelText('Lek doraźny')).toBeDisabled();
        expect(screen.getByLabelText('Ignoruj kontrolę ilości')).toBeChecked();
    });

    it('greys out quantity control for an as-needed medicine', () => {
        renderUntracked({ ignoreQuantity: false, asNeeded: true });

        expect(screen.getByLabelText('Ignoruj kontrolę ilości')).toBeDisabled();
        expect(screen.getByLabelText('Lek doraźny')).not.toBeDisabled();
    });
});

describe('MedicineCard rename', () => {
    it('does not save the name of another medicine and lists similar ones', () => {
        jest.useFakeTimers();
        const updateMedicine = jest.fn(async () => undefined);
        const others = [
            { id: 'other', name: 'Metformina XR', meal: '', description: '', count: 0, isVisible: true, hideWhenEmpty: false, doses: [], purchases: [] },
        ];
        render(
            <MedicineCard
                id="med-1" name="Metformina" meal="" description="" count={10} isVisible hideWhenEmpty={false} doses={[]} purchases={[]}
                idOfMedicineDetails="med-1" medicineClick={jest.fn()} updateMedicine={updateMedicine} deleteMedicine={jest.fn(async () => undefined)}
                tabletsOnPrescriptions={0} allMedicines={others}
            />,
        );
        fireEvent.click(screen.getAllByRole('button')[1]);
        const input = screen.getByDisplayValue('Metformina');

        fireEvent.change(input, { target: { value: 'Metformina X' } });
        fireEvent.change(input, { target: { value: 'metformina xr ' } });
        jest.runAllTimers();

        expect(screen.getByText('Lek o tej nazwie już istnieje')).toBeInTheDocument();
        expect(screen.getByText('Metformina XR')).toBeInTheDocument();
        expect(updateMedicine).not.toHaveBeenCalled();
        jest.useRealTimers();
    });
});
