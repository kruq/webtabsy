import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import UsersView from './UsersView';

const USERS = [
    { id: 'a', name: 'Admin', login: 'admin', isAdmin: true, mustChangePassword: false, isConnected: false },
    { id: 'anna', name: 'Anna', login: 'anna', isAdmin: false, mustChangePassword: false, isConnected: false },
];

function mockApi(connectStatus: number) {
    const fetchMock = jest.fn((url: string, _init?: RequestInit) => {
        if (url.endsWith('/connect')) {
            return Promise.resolve({ ok: connectStatus < 300, status: connectStatus, json: () => Promise.resolve({}) });
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(USERS) });
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    return fetchMock;
}

async function openConnectDialog() {
    // Własnego konta nie da się połączyć - jest tylko jeden przycisk „Połącz” (przy Annie).
    fireEvent.click(await screen.findByRole('button', { name: 'Połącz' }));
    fireEvent.change(screen.getByLabelText('Hasło użytkownika Anna'), { target: { value: 'tajne1' } });
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Połącz' }));
}

describe('UsersView connecting accounts', () => {
    it('shows a wrong password and does not refresh the switcher', async () => {
        mockApi(400);
        const onConnectionsChanged = jest.fn(() => Promise.resolve());
        render(<UsersView currentUserId="a" onConnectionsChanged={onConnectionsChanged} />);

        await openConnectDialog();

        expect(await screen.findByText('Nieprawidłowe hasło')).toBeInTheDocument();
        expect(onConnectionsChanged).not.toHaveBeenCalled();
    });

    it('connects with the password and refreshes the switcher', async () => {
        const fetchMock = mockApi(204);
        const onConnectionsChanged = jest.fn(() => Promise.resolve());
        render(<UsersView currentUserId="a" onConnectionsChanged={onConnectionsChanged} />);

        await openConnectDialog();

        await waitFor(() => expect(onConnectionsChanged).toHaveBeenCalled());
        const connectCall = fetchMock.mock.calls.find(([url]) => url.endsWith('/users/anna/connect'));
        expect(JSON.parse(String(connectCall?.[1]?.body))).toEqual({ password: 'tajne1' });
    });
});
