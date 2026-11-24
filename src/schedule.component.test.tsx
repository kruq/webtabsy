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
        render(<Schedule medicines={[medicine]} onSaveDose={onSaveDose} onSaveTime={jest.fn()} />);
        expect(screen.queryByText('Edycja dawki')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: '1 tab. Euthyrox' }));
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
        render(<Schedule medicines={[medicine]} onSaveDose={onSaveDose} onSaveTime={jest.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: '1 tab. Euthyrox' }));
        fireEvent.click(screen.getByRole('button', { name: 'Anuluj' }));

        expect(screen.queryByText('Edycja dawki')).not.toBeInTheDocument();
        expect(onSaveDose).not.toHaveBeenCalled();
    });
});

describe('Schedule time', () => {
    it('changes the time of every dose at that hour', async () => {
        const onSaveTime = jest.fn(async () => undefined);
        const other: IMedicine = { ...medicine, id: 'm2', name: 'Apap', doses: [{ ...dose, id: 'd2' }] };
        render(<Schedule medicines={[medicine, other]} onSaveDose={jest.fn()} onSaveTime={onSaveTime} />);

        fireEvent.click(screen.getByRole('button', { name: '09:00' }));
        const input = screen.getByDisplayValue('09:00');
        fireEvent.change(input, { target: { value: '25:00' } });
        expect(screen.getByRole('button', { name: 'Zapisz', hidden: true })).toBeDisabled();
        fireEvent.change(input, { target: { value: '730' } });
        fireEvent.click(screen.getByRole('button', { name: 'Zapisz', hidden: true }));

        await waitFor(() => expect(onSaveTime).toHaveBeenCalledWith(
            expect.arrayContaining([{ medicineId: 'm1', doseId: 'd1' }, { medicineId: 'm2', doseId: 'd2' }]),
            '07:30',
        ));
    });
});

describe('Schedule time dialog label', () => {
    it('declines the number of doses', () => {
        const meds: IMedicine[] = ['a', 'b', 'c', 'd', 'e'].map(id => ({ ...medicine, id, name: id, doses: [{ ...dose, id: `${id}-d` }] }));
        render(<Schedule medicines={meds} onSaveDose={jest.fn()} onSaveTime={jest.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: '09:00' }));

        expect(screen.getByText('Nowa godzina (5 dawek):')).toBeInTheDocument();
    });
});
