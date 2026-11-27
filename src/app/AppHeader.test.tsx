import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { AuthUser } from '../services/auth.service';
import { resetForTests } from '../swUpdate';
import AppHeader from './AppHeader';

const PLAIN_USER: AuthUser = { id: 'u', name: 'Darek', login: 'darek', isAdmin: false, mustChangePassword: false };

function renderHeader(user: AuthUser = PLAIN_USER, viewedId = user.id, onSwitchUser = jest.fn()) {
    const viewed = user.managedUsers?.find(m => m.id === viewedId) ?? { id: user.id, name: user.name, showCurrentPackage: true };
    render(
        <AppHeader
            syncTimestamp={60}
            errorMessage=""
            showPermissionAlert={false}
            onDismissPermissionAlert={jest.fn()}
            user={user}
            viewed={viewed}
            onLogout={jest.fn()}
            onUserChanged={jest.fn()}
            onSwitchUser={onSwitchUser}
        />,
    );
}

beforeEach(() => {
    resetForTests();
    jest.useFakeTimers();
});

afterEach(() => {
    jest.useRealTimers();
});

describe('AppHeader after an automatic update', () => {
    it('shows the new version for 10 seconds, once', () => {
        sessionStorage.setItem('webtabsyJustUpdated', 'true');

        renderHeader();
        expect(screen.getByText(/Aplikacja zaktualizowana do v/)).toBeInTheDocument();
        // Pokazane raz: kolejne otwarcie (np. odświeżenie strony) już go nie pokaże.
        expect(sessionStorage.getItem('webtabsyJustUpdated')).toBeNull();

        act(() => {
            jest.advanceTimersByTime(9_900);
        });
        expect(screen.getByText(/Aplikacja zaktualizowana do v/)).toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(200);
        });
        expect(screen.queryByText(/Aplikacja zaktualizowana do v/)).not.toBeInTheDocument();
    });

    it('shows nothing without an update', () => {
        renderHeader();
        expect(screen.queryByText(/Aplikacja zaktualizowana/)).not.toBeInTheDocument();
    });
});

describe('AppHeader user switcher', () => {
    const admin: AuthUser = {
        id: 'a', name: 'Darek', login: 'darek', isAdmin: true, mustChangePassword: false,
        managedUsers: [{ id: 'anna', name: 'Anna', showCurrentPackage: true }],
    };

    it('shows a plain profile link without connected users', () => {
        renderHeader();
        expect(screen.getByRole('button', { name: 'Darek' })).toHaveAttribute('title', 'Profil');
        expect(screen.queryByText(/Dane użytkownika/)).not.toBeInTheDocument();
    });

    it('lists own and connected users and switches to the chosen one', () => {
        const onSwitchUser = jest.fn();
        renderHeader(admin, admin.id, onSwitchUser);
        fireEvent.click(screen.getByRole('button', { name: 'Darek' }));
        fireEvent.click(screen.getByRole('button', { name: 'Anna' }));
        expect(onSwitchUser).toHaveBeenCalledWith('anna');
    });

    it('marks someone else\'s data with a bar', () => {
        renderHeader(admin, 'anna');
        expect(screen.getByText('Dane użytkownika: Anna')).toBeInTheDocument();
    });
});
