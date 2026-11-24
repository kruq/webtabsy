import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AddMedicineDialog from './AddMedicineDialog';

describe('AddMedicineDialog', () => {
    it('passes the name and whether quantity control is ignored', async () => {
        const onSubmit = jest.fn();
        render(<AddMedicineDialog visible medicines={[]} onSubmit={onSubmit} onCancel={jest.fn()} />);

        fireEvent.change(screen.getByRole('textbox'), { target: { value: ' Aerozol do nosa ' } });
        fireEvent.click(screen.getByLabelText('Ignoruj kontrolę ilości'));
        fireEvent.click(screen.getByRole('button', { name: 'Dodaj' }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('Aerozol do nosa', true));
    });

    it('counts quantity by default', async () => {
        const onSubmit = jest.fn();
        render(<AddMedicineDialog visible medicines={[]} onSubmit={onSubmit} onCancel={jest.fn()} />);

        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Apap' } });
        fireEvent.click(screen.getByRole('button', { name: 'Dodaj' }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('Apap', false));
    });
});

describe('AddMedicineDialog name check', () => {
    const existing = [{ id: '1', name: 'Test', meal: '', description: '', count: 1, isVisible: true, hideWhenEmpty: false, doses: [], purchases: [] }];

    it('blocks a name that already exists', () => {
        render(<AddMedicineDialog visible medicines={existing} onSubmit={jest.fn()} onCancel={jest.fn()} />);

        fireEvent.change(screen.getByRole('textbox'), { target: { value: ' TEST ' } });

        expect(screen.getByText('Lek o tej nazwie już istnieje')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Dodaj' })).toBeDisabled();
    });
});
