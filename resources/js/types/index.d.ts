import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    is_master?: boolean;
    [key: string]: unknown; // This allows for additional properties...
}

export interface Asset {
    path: string;
    original_name: string;
    url: string;
    mime: string;
    size: number;
    folder?: string;
}

export interface AssetUploadResult {
    path: string;
    original_name: string;
    url: string;
    mime: string;
    size: number;
}

export interface PaginationMeta {
    current_page: number;
    per_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

export interface ApiResponse<T> {
    data: T;
    meta?: PaginationMeta;
    message?: string;
    errors?: Record<string, string[]>;
}

export type UploadStatus = 'idle' | 'uploading' | 'done';

export interface AccessTokenItem {
    id: string;
    name: string | null;
    preview: string | null;
    created_at: string;
    last_used_at: string | null;
}

export type FolderAccessLevel = 'private' | 'token' | 'public';

export interface LibraryFolderBreadcrumb {
    id: number;
    uuid?: string;
    name: string;
    slug: string;
}

export interface LibraryFolder {
    id: number;
    uuid: string;
    name: string;
    slug: string;
    parent_id: number | null;
    owner_id: number;
    access_level: FolderAccessLevel;
    depth: number;
    files_count: number;
    folders_count: number;
    preview_asset_ids: number[];
    breadcrumbs: LibraryFolderBreadcrumb[];
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
}

export interface LibraryAssetPreviewMeta {
    path: string;
    width: number;
    height: number;
    quality: number;
    format: string;
}

export interface LibraryAsset {
    id: number;
    path: string;
    folder_id: number | null;
    owner_id: number;
    mime: string;
    width: number | null;
    height: number | null;
    size_bytes: number | null;
    generated_thumbs: Record<string, unknown> | null;
    preview_thumb?: LibraryAssetPreviewMeta | null;
    created_at: string;
    updated_at: string;
}

export interface PaginatedLinks {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
}

export interface PaginatedMetaLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    links?: PaginatedLinks;
    meta: {
        current_page: number;
        from?: number | null;
        last_page?: number;
        path?: string;
        per_page: number;
        to?: number | null;
        total?: number;
        links?: PaginatedMetaLink[];
    };
}

export interface FolderChildrenResponse {
    folders: PaginatedResponse<LibraryFolder>;
    assets: PaginatedResponse<LibraryAsset>;
}
