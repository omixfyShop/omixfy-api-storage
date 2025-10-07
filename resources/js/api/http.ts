export class HttpError<T = unknown> extends Error {
    constructor(public readonly response: Response, public readonly payload: T) {
        const message =
            payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
                ? payload.message
                : `Request failed with status ${response.status}`;

        super(message);
    }
}

function getCsrfToken(): string | null {
    const element = document.querySelector('meta[name="csrf-token"]');
    return element?.getAttribute('content');
}

export async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers ?? {});
    headers.set('Accept', 'application/json');

    const body = options.body;
    if (body && !(body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }
    
    const token = localStorage.getItem('tokenAssetsme') ?? '';
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    if (options.method && options.method.toUpperCase() !== 'GET') {
        const token = getCsrfToken();
        if (token) {
            headers.set('X-CSRF-Token', token);
        }
    }

    const response = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers,
    });

    let payload: unknown = null;
    try {
        payload = await response.json();
    } catch (error) {
        if (!(error instanceof SyntaxError)) {
            console.error(error);
        }
    }

    if (!response.ok) {
        throw new HttpError(response, payload);
    }

    return payload as T;
}

export function extractErrorMessage(payload: unknown, fallback: string): string {
    if (!payload || typeof payload !== 'object') {
        return fallback;
    }

    const data = payload as Record<string, unknown>;

    if (typeof data.message === 'string' && data.message.trim() !== '') {
        return data.message;
    }

    if (data.errors && typeof data.errors === 'object') {
        const entries = Object.entries(data.errors as Record<string, unknown>);
        for (const [, value] of entries) {
            if (Array.isArray(value) && value.length > 0) {
                const first = value.find((item) => typeof item === 'string');
                if (typeof first === 'string' && first.trim() !== '') {
                    return first;
                }
            }
        }
    }

    return fallback;
}
