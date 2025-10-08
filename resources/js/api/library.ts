import { request } from './http';
import type {
    FolderChildrenResponse,
    LibraryAsset,
    LibraryFolder,
    PaginatedResponse,
} from '@/types';

type FolderOrderBy = 'name' | 'created_at' | 'updated_at';
type OrderDirection = 'asc' | 'desc';

interface ListFoldersParams {
    parent_id?: number | null;
    q?: string;
    orderBy?: FolderOrderBy;
    order?: OrderDirection;
    page?: number;
    per_page?: number;
}

interface CreateFolderPayload {
    name: string;
    parent_id?: number | null;
}

interface MoveFolderPayload {
    parent_id: number | null;
}

interface RenameFolderPayload {
    name: string;
}

export async function listFolders(params: ListFoldersParams = {}): Promise<PaginatedResponse<LibraryFolder>> {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query.set(key, String(value));
        }
    });

    const suffix = query.toString() ? `?${query.toString()}` : '';

    return request<PaginatedResponse<LibraryFolder>>(`/api/v1/folders${suffix}`);
}

export async function fetchFolder(folderId: number): Promise<{ data: LibraryFolder }> {
    return request<{ data: LibraryFolder }>(`/api/v1/folders/${folderId}`);
}

export async function fetchFolderChildren(folderId: number, params: ListFoldersParams = {}): Promise<FolderChildrenResponse> {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
            return;
        }

        if (key === 'page') {
            query.set('folders_page', String(value));
        } else {
            query.set(key, String(value));
        }
    });

    const suffix = query.toString() ? `?${query.toString()}` : '';

    return request<FolderChildrenResponse>(`/api/v1/folders/${folderId}/children${suffix}`);
}

export async function fetchFolderPreview(folderId: number): Promise<{ data: LibraryAsset[] }> {
    return request<{ data: LibraryAsset[] }>(`/api/v1/folders/${folderId}/preview`);
}

export async function createFolder(payload: CreateFolderPayload): Promise<{ data: LibraryFolder }> {
    return request<{ data: LibraryFolder }>(`/api/v1/folders`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function renameFolder(folderId: number, payload: RenameFolderPayload): Promise<{ data: LibraryFolder }> {
    return request<{ data: LibraryFolder }>(`/api/v1/folders/${folderId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
}

export async function moveFolder(folderId: number, payload: MoveFolderPayload): Promise<{ data: LibraryFolder }> {
    return request<{ data: LibraryFolder }>(`/api/v1/folders/${folderId}/move`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function deleteFolder(folderId: number): Promise<void> {
    await request(`/api/v1/folders/${folderId}`, {
        method: 'DELETE',
    });
}

export async function restoreFolder(folderId: number): Promise<{ data: LibraryFolder }> {
    return request<{ data: LibraryFolder }>(`/api/v1/folders/${folderId}/restore`, {
        method: 'POST',
    });
}

export interface FolderTokenResponse {
    data: {
        id: number;
        token: string;
        can_create_subfolders: boolean;
        can_upload: boolean;
        expires_at: string | null;
    };
}

export async function createFolderToken(folderId: number): Promise<FolderTokenResponse> {
    return request<FolderTokenResponse>(`/api/v1/folders/${folderId}/tokens`, {
        method: 'POST',
    });
}

export async function toggleAssetPreview(folderId: number, assetId: number): Promise<{ data: { preview_asset_ids: number[] } }> {
    return request<{ data: { preview_asset_ids: number[] } }>(`/api/v1/folders/${folderId}/assets/${assetId}/toggle-preview`, {
        method: 'POST',
    });
}
