import API_HOST from './api.constants';
import { clearToken, getToken, setToken } from './authToken';
import { ApiError, getJson, postEmpty, postJsonForResult, putJsonForResult } from './http';

export interface AuthUser {
    id: string;
    name: string;
    login: string;
    isAdmin: boolean;
    mustChangePassword: boolean;
}

export const DEFAULT_PASSWORD = 'WerbelISonia';
export const MIN_PASSWORD_LENGTH = 6;

/** Te same zasady co w API (Passwords.Validate); undefined = hasło poprawne. */
export function passwordProblem(password: string): string | undefined {
    if (password.length < MIN_PASSWORD_LENGTH) return `Hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków`;
    if (password === DEFAULT_PASSWORD) return 'Hasło nie może być hasłem domyślnym';
    return undefined;
}

export class InvalidCredentialsError extends Error {}

/**
 * Logowanie idzie bezpośrednio przez fetch: 401 oznacza tu zły login lub hasło,
 * a nie wygasłą sesję (nie może wywołać globalnego wylogowania).
 */
export async function login(loginName: string, password: string): Promise<AuthUser> {
    const response = await fetch(`${API_HOST}/auth/login`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: loginName, password }),
    });
    if (response.status === 401) throw new InvalidCredentialsError();
    if (!response.ok) throw new ApiError(`POST /auth/login failed (${response.status})`, response.status);
    const data = (await response.json()) as { token: string; user: AuthUser };
    setToken(data.token);
    return data.user;
}

/** Zalogowany użytkownik albo undefined, gdy na urządzeniu nie ma sesji. */
export async function fetchCurrentUser(): Promise<AuthUser | undefined> {
    if (!getToken()) return undefined;
    return getJson<AuthUser>(`${API_HOST}/auth/me`);
}

export async function logout(): Promise<void> {
    try {
        await postEmpty(`${API_HOST}/auth/logout`);
    } finally {
        // Nawet gdy API nie odpowie, urządzenie ma zapomnieć sesję.
        clearToken();
    }
}

export async function changePassword(newPassword: string): Promise<AuthUser> {
    return postJsonForResult<{ newPassword: string }, AuthUser>(`${API_HOST}/auth/change-password`, { newPassword });
}

/** Zmiana własnej nazwy wyświetlanej (login się nie zmienia). */
export async function renameMe(name: string): Promise<AuthUser> {
    return putJsonForResult<{ name: string }, AuthUser>(`${API_HOST}/auth/me`, { name });
}

export async function fetchUsers(): Promise<AuthUser[]> {
    return getJson<AuthUser[]>(`${API_HOST}/users`);
}

export async function createUser(user: { name: string; login: string; password: string }): Promise<AuthUser> {
    return postJsonForResult<typeof user, AuthUser>(`${API_HOST}/users`, user);
}

export async function resetUserPassword(id: string): Promise<void> {
    await postEmpty(`${API_HOST}/users/${encodeURIComponent(id)}/reset-password`);
}
