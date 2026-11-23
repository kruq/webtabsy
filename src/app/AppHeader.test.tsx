import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { resetForTests } from '../swUpdate';
import AppHeader from './AppHeader';

function renderHeader() {
    render(
        <AppHeader
            syncTimestamp={60}
            errorMessage=""
            showPermissionAlert={false}
            onDismissPermissionAlert={jest.fn()}
            userName="Darek"
            onLogout={jest.fn()}
            onUserChanged={jest.fn()}
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
