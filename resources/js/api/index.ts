const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

/**
 * Constrói uma URL completa para um endpoint da API com parâmetros de query string
 */
export function buildEndpoint(path: string, params: Record<string, string | number | undefined | null> = {}): string {
    const base = API_BASE_URL || window.location.origin;
    const url = new URL(path, base.endsWith('/') ? base : `${base}/`);

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, String(value));
        }
    });

    return url.toString();
}

// Re-exporta utilidades do módulo http para facilitar o acesso
export { extractErrorMessage, HttpError, request } from './http';

