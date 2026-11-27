import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import IMedicine from '../models/IMedicine';
import { addDaysYmd, todayYmd } from '../utils/prescriptionStatus';
import PrescriptionDialog, { emptyPrescription } from './PrescriptionDialog';

const medicine: IMedicine = {
    id: 'm1', name: 'Asentra', meal: '', description: '', count: 10, isVisible: true, hideWhenEmpty: false, doses: [], purchases: [],
};

/** Recepta roczna wystawiona 60 dni temu: ważna, ale termin pierwszego wykupu (30 dni) już minął. */
function renderDialog(onSave = jest.fn()) {
    const initial = { ...emptyPrescription(), validity: 'annual' as const, issueDate: addDaysYmd(todayYmd(), -60) };
    render(
        <PrescriptionDialog
            initial={initial}
            medicines={[medicine]}
            specializations={[]}
            doctors={[]}
            onSave={onSave}
            onDelete={jest.fn()}
            onAddSpecialization={jest.fn()}
            onAddDoctor={jest.fn()}
            onClose={jest.fn()}
        />,
    );
}

function fillItem(purchasedBefore: string) {
    fireEvent.change(screen.getByDisplayValue('— wybierz lek —'), { target: { value: 'm1' } });
    const [packages, packageSize, purchased] = screen.getAllByRole('textbox').slice(-3);
    fireEvent.change(packages, { target: { value: '3' } });
    fireEvent.change(packageSize, { target: { value: '30' } });
    fireEvent.change(purchased, { target: { value: purchasedBefore } });
}

describe('PrescriptionDialog - packages purchased before', () => {
    it('warns that the item would expire and suggests "Wykupione wcześniej"', async () => {
        renderDialog();
        fillItem('0');
        expect(await screen.findByText(/Jeśli część opakowań była już wykupiona/)).toBeInTheDocument();

        fireEvent.change(screen.getAllByRole('textbox').slice(-1)[0], { target: { value: '1' } });
        expect(screen.queryByText(/Jeśli część opakowań była już wykupiona/)).toBeNull();
    });

    it('saves a partly purchased older prescription', async () => {
        const onSave = jest.fn().mockResolvedValue(undefined);
        renderDialog(onSave);
        fillItem('1');
        fireEvent.click(screen.getByRole('button', { name: 'Dodaj do recepty' }));

        expect(await screen.findByText('Częściowo zrealizowany')).toBeInTheDocument();
        expect(screen.getByText('2/3 op. × 30 tab.')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));
        await waitFor(() => expect(onSave).toHaveBeenCalled());
        expect(onSave.mock.calls[0][0].items[0]).toMatchObject({ packages: 3, packageSize: 30, purchasedPackages: 1 });
    });

    it('does not allow adding a new prescription that is already expired as a whole', async () => {
        renderDialog();
        fillItem('0');
        fireEvent.click(screen.getByRole('button', { name: 'Dodaj do recepty' }));

        expect(await screen.findByText('Recepta jest przeterminowana - nie można jej dodać')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Zapisz' })).toBeDisabled();
    });

    it('rejects more packages purchased before than on the prescription', async () => {
        renderDialog();
        fillItem('4');
        expect(await screen.findByText('Od 0 do liczby opakowań')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Dodaj do recepty' })).toBeDisabled();
    });
});
