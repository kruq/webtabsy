import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AddMedicineDialog from './AddMedicineDialog';

describe('AddMedicineDialog', () => {
    it('passes the name and whether quantity control is ignored', async () => {
        const onSubmit = jest.fn();
        render(<AddMedicineDialog visible onSubmit={onSubmit} onCancel={jest.fn()} />);

        fireEvent.change(screen.getByRole('textbox'), { target: { value: ' Aerozol do nosa ' } });
        fireEvent.click(screen.getByLabelText('Ignoruj kontrolę ilości'));
        fireEvent.click(screen.getByRole('button', { name: 'Dodaj' }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('Aerozol do nosa', true));
    });

    it('counts quantity by default', async () => {
        const onSubmit = jest.fn();
        render(<AddMedicineDialog visible onSubmit={onSubmit} onCancel={jest.fn()} />);

        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Apap' } });
        fireEvent.click(screen.getByRole('button', { name: 'Dodaj' }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('Apap', false));
    });
});
