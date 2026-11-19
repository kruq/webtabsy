import { useCallback, useEffect, useState } from 'react';
import { AuthUser, fetchCurrentUser, login as apiLogin, logout as apiLogout } from '../services/auth.service';
import { onUnauthorized } from '../services/authToken';
import { ApiError } from '../services/http';

export type AuthState =
    | { status: 'loading' }
    | { status: 'offline' }
    | { status: 'loggedOut' }
    | { status: 'mustChangePassword'; user: AuthUser }
    | { status: 'ready'; user: AuthUser };

function stateFor(user: AuthUser | undefined): AuthState {
    if (!user) return { status: 'loggedOut' };
    return user.mustChangePassword ? { status: 'mustChangePassword', user } : { status: 'ready', user };
}

export interface UseAuthResult {
    state: AuthState;
    login: (login: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    /** Po wymuszonej zmianie hasła API zwraca zaktualizowanego użytkownika. */
    setUser: (user: AuthUser) => void;
    retry: () => void;
}

export function useAuth(): UseAuthResult {
    const [state, setState] = useState<AuthState>({ status: 'loading' });

    const [attempt, setAttempt] = useState(0);

    useEffect(() => onUnauthorized(() => setState({ status: 'loggedOut' })), []);

    useEffect(() => {
        let active = true;
        setState({ status: 'loading' });
        fetchCurrentUser()
            .then(user => active && setState(stateFor(user)))
            .catch(e => {
                console.error(e);
                if (!active) return;
                // 401 wyczyściło token i przełączyło na logowanie; inny błąd (np. brak sieci) nie kończy sesji.
                if (e instanceof ApiError && e.status === 401) setState({ status: 'loggedOut' });
                else setState({ status: 'offline' });
            });
        return () => {
            active = false;
        };
    }, [attempt]);

    const retry = useCallback(() => setAttempt(a => a + 1), []);

    const login = useCallback(async (loginName: string, password: string) => {
        setState(stateFor(await apiLogin(loginName, password)));
    }, []);

    const logout = useCallback(async () => {
        try {
            await apiLogout();
        } catch (e) {
            console.error(e);
        }
        setState({ status: 'loggedOut' });
    }, []);

    const setUser = useCallback((user: AuthUser) => setState(stateFor(user)), []);

    return { state, login, logout, setUser, retry };
}
