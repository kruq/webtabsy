export class ApiError extends Error {
    public readonly status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}

async function ensureOk(response: Response, action: string): Promise<void> {
    if (!response.ok) {
        throw new ApiError(`${action} failed (${response.status})`, response.status);
    }
}

export async function getJson<T>(url: string): Promise<T> {
    const response = await fetch(url, { mode: 'cors' });
    await ensureOk(response, `GET ${url}`);
    return response.json() as Promise<T>;
}

export async function postJson<T>(url: string, body: T): Promise<void> {
    const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    await ensureOk(response, `POST ${url}`);
}

export async function putJson<T>(url: string, body: T): Promise<void> {
    const response = await fetch(url, {
        method: 'PUT',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    await ensureOk(response, `PUT ${url}`);
}

export async function deleteResource(url: string): Promise<void> {
    const response = await fetch(url, { method: 'DELETE', mode: 'cors' });
    await ensureOk(response, `DELETE ${url}`);
}
