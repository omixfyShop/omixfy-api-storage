import { extractErrorMessage, request } from '@/api/http';

export interface AdminUser {
    id: number;
    name: string;
    email: string;
    is_master: boolean;
    created_at: string;
}

export interface PaginatedUsers {
    data: AdminUser[];
    meta: {
        current_page: number;
        per_page: number;
        last_page: number;
        total: number;
    };
}

export interface CreateUserPayload {
    name: string;
    email: string;
    password?: string;
    generate_password?: boolean;
}

export interface CreateUserResponse {
    data: AdminUser;
    temporary_password?: string | null;
}

export async function list(): Promise<PaginatedUsers> {
    return request<PaginatedUsers>('/api/admin/users');
}

export async function create(payload: CreateUserPayload): Promise<CreateUserResponse> {
    return request<CreateUserResponse>('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function destroy(id: number): Promise<void> {
    await request<unknown>(`/api/admin/users/${id}`, {
        method: 'DELETE',
    });
}

export { extractErrorMessage };
