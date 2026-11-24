import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import IMedicine from '../models/IMedicine';
import AsNeededPanel from './AsNeededPanel';

function medicine(name: string, count: number): IMedicine {
    return { id: name, name, meal: '', description: '', count, isVisible: true, hideWhenEmpty: false, asNeeded: true, doses: [], purchases: [] };
}

describe('Weź lek doraźny', () => {
    it('is not shown without any as-needed medicine', () => {
        render(<AsNeededPanel medicines={[{ ...medicine('Apap', 10), asNeeded: false }]} onTake={jest.fn()} />);

        expect(screen.queryByRole('button', { name: 'Weź lek doraźny' })).toBeNull();
    });

    it('is greyed out without as-needed medicines in stock', () => {
        render(<AsNeededPanel medicines={[medicine('Apap', 0)]} onTake={jest.fn()} />);

        expect(screen.getByRole('button', { name: 'Weź lek doraźny' })).toBeDisabled();
    });

    it('opens the list, asks for the amount and takes the medicine', async () => {
        const onTake = jest.fn();
        render(<AsNeededPanel medicines={[medicine('Apap', 10), medicine('Ibuprom', 5)]} onTake={onTake} />);

        fireEvent.click(screen.getByRole('button', { name: 'Weź lek doraźny' }));
        const confirmButtons = await screen.findAllByRole('button', { name: /Potwierdź/ });
        expect(confirmButtons).toHaveLength(2);
        fireEvent.click(confirmButtons[1]);

        await waitFor(() => expect(screen.queryByText('Leki doraźne')).toBeNull());
        expect(screen.getByText('Weź lek: Ibuprom')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Weź lek', hidden: true }));
        await waitFor(() => expect(onTake).toHaveBeenCalledWith(expect.objectContaining({ id: 'Ibuprom' }), 1));
    });
});
