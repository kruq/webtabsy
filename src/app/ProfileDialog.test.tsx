import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProfileDialog from './ProfileDialog';

describe('ProfileDialog', () => {
    it('saves the name and hiding the current package together', async () => {
        const fetchMock = jest.fn((_url: string, init?: RequestInit) => Promise.resolve({
            ok: true, status: 200, json: () => Promise.resolve({ id: 'u', login: 'jan', isAdmin: false, mustChangePassword: false, ...JSON.parse(String(init?.body)) }),
        }));
        global.fetch = fetchMock as unknown as typeof fetch;
        const onSaved = jest.fn();
        render(
            <ProfileDialog
                visible
                user={{ id: 'u', name: 'Jan', login: 'jan', isAdmin: false, mustChangePassword: false }}
                onSaved={onSaved}
                onClose={jest.fn()}
            />,
        );

        const toggle = screen.getByLabelText('Pokaż ilość w aktualnym opakowaniu');
        expect(toggle).toBeChecked();
        fireEvent.click(toggle);
        fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

        await waitFor(() => expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ name: 'Jan', showCurrentPackage: false })));
        expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ name: 'Jan', showCurrentPackage: false });
    });
});
