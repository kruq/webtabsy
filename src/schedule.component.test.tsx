import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Dose from './models/Dose';
import IMedicine from './models/IMedicine';
import Schedule from './schedule.component';

function tomorrowAt(hours: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(hours, 0, 0, 0);
    return date;
}

const dose: Dose = { id: 'd1', time: '09:00', amount: 1, numberOfDays: 1, nextDoseDate: tomorrowAt(9), endDate: null };
const medicine: IMedicine = {
    id: 'm1', name: 'Euthyrox', meal: '', description: '', count: 40, isVisible: true, hideWhenEmpty: false,
    doses: [dose], purchases: [],
};

describe('Schedule', () => {
    it('opens the dose editor for the clicked medicine and saves the changed dose', async () => {
        const onSaveDose = jest.fn(async () => undefined);
        render(<Schedule medicines={[medicine]} onSaveDose={onSaveDose} />);
        expect(screen.queryByText('Edycja dawki')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: '1 x Euthyrox' }));
        expect(screen.getByText('Edycja dawki')).toBeInTheDocument();

        // Pole ilości tabletek (tekstowe); „Co ile dni” też ma wartość 1, ale jest polem liczbowym.
        const amountInput = screen.getAllByDisplayValue('1').find(input => input.getAttribute('type') === 'text') as HTMLElement;
        fireEvent.change(amountInput, { target: { value: '1/2' } });
        fireEvent.click(screen.getByRole('button', { name: 'Zapisz dawkę' }));

        await waitFor(() => expect(onSaveDose).toHaveBeenCalledWith('m1', expect.objectContaining({ id: 'd1', amount: 0.5 })));
        await waitFor(() => expect(screen.queryByText('Edycja dawki')).not.toBeInTheDocument());
    });

    it('closes the editor without saving on cancel', () => {
        const onSaveDose = jest.fn();
        render(<Schedule medicines={[medicine]} onSaveDose={onSaveDose} />);

        fireEvent.click(screen.getByRole('button', { name: '1 x Euthyrox' }));
        fireEvent.click(screen.getByRole('button', { name: 'Anuluj' }));

        expect(screen.queryByText('Edycja dawki')).not.toBeInTheDocument();
        expect(onSaveDose).not.toHaveBeenCalled();
    });
});
