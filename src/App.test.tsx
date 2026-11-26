import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { clearToken, setToken } from './services/authToken';

const ADMIN = { id: 'u1', name: 'Jan', login: 'jan', isAdmin: true, mustChangePassword: false };

/** fetch: /auth/me zwraca podanego użytkownika (albo 401), wszystko inne - pustą listę. */
function mockApi(me: object | 401) {
    global.fetch = jest.fn((url: string) => {
        if (url.endsWith('/auth/me')) {
            return Promise.resolve(me === 401
                ? { ok: false, status: 401, json: () => Promise.resolve({}) }
                : { ok: true, status: 200, json: () => Promise.resolve(me) });
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    }) as unknown as typeof fetch;
}

afterEach(() => {
    clearToken();
    jest.resetAllMocks();
});

test('shows the login screen without a session', async () => {
    mockApi(401);
    render(<App />);
    expect(await screen.findByRole('button', { name: 'Zaloguj' })).toBeInTheDocument();
    expect(screen.getByText(/WEBTABSY/)).toBeInTheDocument();
});

test('shows the login screen when the stored session is rejected', async () => {
    setToken('old');
    mockApi(401);
    render(<App />);
    expect(await screen.findByRole('button', { name: 'Zaloguj' })).toBeInTheDocument();
});

test('forces a password change after a reset', async () => {
    setToken('t');
    mockApi({ ...ADMIN, mustChangePassword: true });
    render(<App />);
    expect(await screen.findByRole('button', { name: 'Zapisz hasło' })).toBeInTheDocument();
});

test('opens the app with the user name, logout and the admin tab', async () => {
    setToken('t');
    mockApi(ADMIN);
    render(<App />);
    expect(await screen.findByRole('button', { name: 'Wyloguj' })).toBeInTheDocument();
    expect(screen.getByText(/Jan/)).toBeInTheDocument();
    expect(screen.getByText('Użytkownicy')).toBeInTheDocument();
});

test('hides the admin tab from other users', async () => {
    setToken('t');
    mockApi({ ...ADMIN, isAdmin: false });
    render(<App />);
    expect(await screen.findByRole('button', { name: 'Wyloguj' })).toBeInTheDocument();
    expect(screen.queryByText('Użytkownicy')).not.toBeInTheDocument();
});

test('lets the user change their own name from the header', async () => {
    setToken('t');
    mockApi(ADMIN);
    const fetchMock = global.fetch as jest.Mock;
    const defaultImpl = fetchMock.getMockImplementation() as (url: string, init?: RequestInit) => Promise<unknown>;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
        if (url.endsWith('/auth/me') && init?.method === 'PUT') {
            const body = JSON.parse(init.body as string);
            return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ...ADMIN, name: body.name }) });
        }
        return defaultImpl(url, init);
    });
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Jan' }));
    fireEvent.change(screen.getByLabelText('Nazwa'), { target: { value: '  Jan Kowalski ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    expect(await screen.findByRole('button', { name: 'Jan Kowalski' })).toBeInTheDocument();
    const putCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT');
    expect(JSON.parse(putCall[1].body)).toEqual({ name: 'Jan Kowalski', showCurrentPackage: true });
});

test('a new user without any medicines gets the app, not an endless "Synchronizacja danych..."', async () => {
    setToken('t');
    mockApi({ ...ADMIN, isAdmin: false });
    render(<App />);
    expect(await screen.findByRole('button', { name: 'Wyloguj' })).toBeInTheDocument();

    await waitFor(() => expect(screen.queryByText('Synchronizacja danych...')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Dodaj lek' })).toBeInTheDocument();
    // Status, Lista leków i Grafik mówią, że nie ma leków; Status i Grafik podpowiadają, gdzie je dodać.
    expect(screen.getAllByText('Brak leków')).toHaveLength(3);
    expect(screen.getAllByText('Dodaj lek w zakładce „Lista leków”')).toHaveLength(2);
});

test('clicking a medicine on Status opens its expanded card on the medicine list', async () => {
    setToken('t');
    const due = new Date(2020, 0, 1, 9, 0);
    const medicine = {
        id: 'm1', name: 'Euthyrox', meal: '', description: '', count: 40, isVisible: true, hideWhenEmpty: false,
        doses: [{ id: 'd1', time: '09:00', amount: 1, numberOfDays: 1, nextDoseDate: due.toISOString(), endDate: null }],
        purchases: [],
    };
    const overdue = [{ date: due.toISOString(), doses: [{ id: 'd1', amount: 1, numberOfDays: 1, nextDoseDate: due.toISOString(), endDate: null, medicineName: 'Euthyrox', meal: '', time: '09:00' }] }];
    global.fetch = jest.fn((url: string) => {
        const body = url.endsWith('/auth/me') ? ADMIN
            : url.endsWith('/medicine') ? [medicine]
            : url.includes('/overdueDoses/') ? overdue
            : [];
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
    }) as unknown as typeof fetch;
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: /Euthyrox$/ }));

    await waitFor(() => expect(screen.getByRole('tab', { name: /Lista leków/ })).toHaveClass('active'));
    // Rozwinięta karta leku pokazuje sekcję ustawień.
    expect(screen.getByText('Ustawienia')).toBeInTheDocument();
});
