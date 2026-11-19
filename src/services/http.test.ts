import { clearToken, getToken, onUnauthorized, setToken } from './authToken';
import { ApiError, getJson } from './http';

function mockFetch(status: number, body: unknown = []) {
    const fetchMock = jest.fn(async () => ({ ok: status >= 200 && status < 300, status, json: async () => body }));
    global.fetch = fetchMock as unknown as typeof fetch;
    return fetchMock;
}

afterEach(() => {
    clearToken();
    jest.resetAllMocks();
});

describe('http with session token', () => {
    it('sends the stored token as a Bearer header', async () => {
        setToken('abc');
        const fetchMock = mockFetch(200);

        await getJson('https://api/medicine');

        const init = (fetchMock.mock.calls[0] as unknown[])[1] as RequestInit;
        expect((init.headers as Record<string, string>).Authorization).toBe('Bearer abc');
    });

    it('sends no Authorization header without a token', async () => {
        const fetchMock = mockFetch(200);

        await getJson('https://api/medicine');

        const init = (fetchMock.mock.calls[0] as unknown[])[1] as RequestInit;
        expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
    });

    it('forgets the token and notifies on 401', async () => {
        setToken('expired');
        mockFetch(401);
        const listener = jest.fn();
        const unsubscribe = onUnauthorized(listener);

        await expect(getJson('https://api/medicine')).rejects.toBeInstanceOf(ApiError);

        expect(getToken()).toBeNull();
        expect(listener).toHaveBeenCalledTimes(1);
        unsubscribe();
    });

    it('keeps the token on other errors (e.g. 500)', async () => {
        setToken('abc');
        mockFetch(500);

        await expect(getJson('https://api/medicine')).rejects.toBeInstanceOf(ApiError);

        expect(getToken()).toBe('abc');
    });
});
