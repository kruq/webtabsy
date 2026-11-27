import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Prescription from '../models/Prescription';
import DoctorsDialog from './DoctorsDialog';

const prescription: Prescription = {
    id: 'p', issueDate: '2026-01-10', validity: '30days', code: '', doctor: 'Jan Kowalski', specialization: '', note: '', items: [],
};

const doctors = [
    { id: 'd1', name: 'Jan Kowalski', specialization: 'kardiolog' },
    { id: 'd2', name: 'Anna Nowak' },
];

describe('DoctorsDialog', () => {
    it('disables "Usuń" with a hint for a doctor with prescriptions and deletes one without them', async () => {
        const onDelete = jest.fn().mockResolvedValue(undefined);
        jest.spyOn(window, 'confirm').mockReturnValue(true);
        render(<DoctorsDialog show doctors={doctors} specializations={[]} prescriptions={[prescription]} onAdd={jest.fn()} onAddSpecialization={jest.fn()} onDelete={onDelete} onClose={jest.fn()} />);

        const withPrescriptions = await screen.findByRole('button', { name: 'Usuń - Lekarz ma recepty (1)' });
        expect(withPrescriptions).toBeDisabled();
        expect(screen.getByTitle('Lekarz ma recepty (1)')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Usuń lekarza Anna Nowak' }));
        await waitFor(() => expect(onDelete).toHaveBeenCalledWith('d2'));
    });

    it('adds a doctor with a specialization and blocks a name that already exists', async () => {
        const onAdd = jest.fn().mockResolvedValue({ id: 'd3', name: 'Ewa Zając', specialization: 'okulista' });
        render(
            <DoctorsDialog
                show
                doctors={doctors}
                specializations={[{ id: 's1', name: 'okulista' }]}
                prescriptions={[]}
                onAdd={onAdd}
                onAddSpecialization={jest.fn()}
                onDelete={jest.fn()}
                onClose={jest.fn()}
            />,
        );

        fireEvent.click(await screen.findByRole('button', { name: 'Dodaj lekarza' }));
        const nameInput = screen.getByPlaceholderText('Imię i nazwisko');
        fireEvent.change(nameInput, { target: { value: ' anna nowak ' } });
        expect(screen.getByText('Lekarz o tej nazwie już istnieje')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Dodaj' })).toBeDisabled();

        fireEvent.change(nameInput, { target: { value: 'Ewa Zając' } });
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'okulista' } });
        fireEvent.click(screen.getByRole('button', { name: 'Dodaj' }));
        await waitFor(() => expect(onAdd).toHaveBeenCalledWith({ name: 'Ewa Zając', specialization: 'okulista' }));
        expect(await screen.findByRole('button', { name: 'Dodaj lekarza' })).toBeInTheDocument();
    });

    it('adds a new specialization while adding a doctor and selects it', async () => {
        const onAddSpecialization = jest.fn().mockResolvedValue({ id: 's2', name: 'neurolog' });
        render(
            <DoctorsDialog
                show
                doctors={[]}
                specializations={[]}
                prescriptions={[]}
                onAdd={jest.fn()}
                onAddSpecialization={onAddSpecialization}
                onDelete={jest.fn()}
                onClose={jest.fn()}
            />,
        );

        fireEvent.click(await screen.findByRole('button', { name: 'Dodaj lekarza' }));
        fireEvent.change(screen.getByRole('combobox'), { target: { value: '__new__' } });
        fireEvent.change(screen.getByPlaceholderText('Nazwa specjalizacji'), { target: { value: 'neurolog' } });
        fireEvent.click(screen.getAllByRole('button', { name: 'Dodaj' })[0]);

        expect(await screen.findByRole('combobox')).toHaveValue('neurolog');
        expect(onAddSpecialization).toHaveBeenCalledWith('neurolog');
    });
});
