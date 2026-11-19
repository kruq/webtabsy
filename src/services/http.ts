import { authHeaders, notifyUnauthorized } from './authToken';

export class ApiError extends Error {
    public readonly status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}

async function ensureOk(response: Response, action: string): Promise<void> {
    if (response.status === 401) notifyUnauthorized();
    if (!response.ok) {
        throw new ApiError(`${action} failed (${response.status})`, response.status);
    }
}

function request(url: string, method: string, body?: unknown): Promise<Response> {
    return fetch(url, {
        method,
        mode: 'cors',
        headers: {
            ...authHeaders(),
            ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
}

export async function getJson<T>(url: string): Promise<T> {
    const response = await request(url, 'GET');
    await ensureOk(response, `GET ${url}`);
    return response.json() as Promise<T>;
}

export async function postJson<T>(url: string, body: T): Promise<void> {
    const response = await request(url, 'POST', body);
    await ensureOk(response, `POST ${url}`);
}

/** POST, który zwraca utworzony obiekt z odpowiedzi (np. z identyfikatorem nadanym przez API). */
export async function postJsonForResult<TBody, TResult>(url: string, body: TBody): Promise<TResult> {
    const response = await request(url, 'POST', body);
    await ensureOk(response, `POST ${url}`);
    return response.json() as Promise<TResult>;
}

export async function putJson<T>(url: string, body: T): Promise<void> {
    const response = await request(url, 'PUT', body);
    await ensureOk(response, `PUT ${url}`);
}

export async function putJsonForResult<TBody, TResult>(url: string, body: TBody): Promise<TResult> {
    const response = await request(url, 'PUT', body);
    await ensureOk(response, `PUT ${url}`);
    return response.json() as Promise<TResult>;
}

export async function deleteResource(url: string): Promise<void> {
    const response = await request(url, 'DELETE');
    await ensureOk(response, `DELETE ${url}`);
}

/** POST bez treści odpowiedzi i bez treści żądania (np. wylogowanie, reset hasła). */
export async function postEmpty(url: string): Promise<void> {
    const response = await request(url, 'POST');
    await ensureOk(response, `POST ${url}`);
}
