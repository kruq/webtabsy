const TOKEN_KEY = 'webtabsyToken';
/** Konto, którego dane ogląda administrator (połączony użytkownik); brak = własne dane. */
const ACTING_USER_KEY = 'webtabsyActingUser';
/** Nagłówek, którym API rozpoznaje, czyje dane czyta i zmienia żądanie. */
export const ACT_AS_HEADER = 'X-Webtabsy-User';

type Listener = () => void;
const unauthorizedListeners = new Set<Listener>();

/** Token sesji trzymany na urządzeniu bez końca (do wylogowania albo odrzucenia przez API). */
export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACTING_USER_KEY);
}

export function getActingUserId(): string | null {
    return localStorage.getItem(ACTING_USER_KEY);
}

/** null = powrót do własnych danych. */
export function setActingUserId(id: string | null): void {
    if (id) localStorage.setItem(ACTING_USER_KEY, id);
    else localStorage.removeItem(ACTING_USER_KEY);
}

export function authHeaders(): Record<string, string> {
    const token = getToken();
    if (!token) return {};
    const actingUserId = getActingUserId();
    return {
        Authorization: `Bearer ${token}`,
        ...(actingUserId ? { [ACT_AS_HEADER]: actingUserId } : {}),
    };
}

/** API odrzuciło token (401) - sesja jest nieważna, aplikacja ma wrócić do ekranu logowania. */
export function notifyUnauthorized(): void {
    clearToken();
    unauthorizedListeners.forEach(listener => listener());
}

export function onUnauthorized(listener: Listener): () => void {
    unauthorizedListeners.add(listener);
    return () => {
        unauthorizedListeners.delete(listener);
    };
}
