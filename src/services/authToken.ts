const TOKEN_KEY = 'webtabsyToken';

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
}

export function authHeaders(): Record<string, string> {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
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
