import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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
        };

        const { container } = render(<MedicineCard {...props} />);
        const text = container.textContent ?? '';

        expect(text).toMatch(/Posiadane\(14\) 70\d{2}\.\d{2}\.\d{2}20 dni/);
        expect(text).toMatch(/Z receptami378\d{2}\.\d{2}\.\d{2}108 dni/);
    });
});
