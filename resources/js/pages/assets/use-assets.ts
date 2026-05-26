import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Asset, PaginationMeta } from '@/types';
import { buildEndpoint, extractErrorMessage } from '@/api';

const PER_PAGE = 25;

function emptyMeta(currentPage: number): PaginationMeta {
    return { current_page: currentPage, per_page: PER_PAGE, next_page_url: null, prev_page_url: null };
}

export interface UseAssetsReturn {
    folder: string;
    setFolder: React.Dispatch<React.SetStateAction<string>>;
    assets: Asset[];
    loading: boolean;
    error: string;
    meta: PaginationMeta;
    hasToken: boolean;
    canGoPrevious: boolean;
    canGoNext: boolean;
    fetchAssets: () => Promise<void>;
    handleFilterSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    handleDelete: (asset: Asset) => Promise<void>;
    resetFilters: () => void;
    goToPreviousPage: () => void;
    goToNextPage: () => void;
}

export function useAssets(): UseAssetsReturn {
    const [folder, setFolder] = useState<string>('');
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [page, setPage] = useState<number>(1);
    const [appliedFolder, setAppliedFolder] = useState<string>('');
    const [meta, setMeta] = useState<PaginationMeta>(emptyMeta(1));

    const TOKEN = localStorage.getItem('tokenAssetsme') ?? '';
    const hasToken = TOKEN !== '';

    const fetchAssets = useCallback(
        async (targetPage: number = page, targetFolder: string = appliedFolder) => {
            if (!hasToken) {
                setError('O token de acesso não está configurado.');
                return;
            }

            setLoading(true);
            setError('');

            const endpoint = buildEndpoint('/api/assets/list', {
                folder: targetFolder.trim(),
                page: targetPage,
                per_page: PER_PAGE,
            });

            try {
                const response = await fetch(endpoint, {
                    headers: { Authorization: `Bearer ${TOKEN}` },
                });

                const payload = await response.json().catch(() => ({}));

                if (!response.ok) {
                    setError(extractErrorMessage(payload, 'Não foi possível carregar os assets.'));
                    setAssets([]);
                    setMeta(emptyMeta(targetPage));
                    return;
                }

                setAssets(Array.isArray(payload.data) ? payload.data : []);
                setMeta({
                    current_page: payload.meta?.current_page ?? targetPage,
                    per_page: payload.meta?.per_page ?? PER_PAGE,
                    next_page_url: payload.meta?.next_page_url ?? null,
                    prev_page_url: payload.meta?.prev_page_url ?? null,
                });
            } catch (requestError) {
                console.error(requestError);
                setError('Erro de rede ao consultar a API.');
                setAssets([]);
                setMeta(emptyMeta(targetPage));
            } finally {
                setLoading(false);
            }
        },
        [appliedFolder, hasToken, page, PER_PAGE, TOKEN],
    );

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    const handleFilterSubmit = useCallback(
        (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            setAppliedFolder(folder.trim());
            setPage(1);
        },
        [folder],
    );

    const handleDelete = useCallback(
        async (asset: Asset) => {
            if (!asset?.path) {
                return;
            }

            const confirmed = window.confirm(`Remover ${asset.original_name}?`);
            if (!confirmed) {
                return;
            }

            const endpoint = buildEndpoint('/api/assets/file', { path: asset.path });

            try {
                const response = await fetch(endpoint, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${TOKEN}` },
                });

                const payload = await response.json().catch(() => ({}));

                if (!response.ok) {
                    setError(extractErrorMessage(payload, 'Não foi possível remover o arquivo.'));
                    return;
                }

                setAssets((current) => current.filter((item) => item.path !== asset.path));
            } catch (deleteError) {
                console.error(deleteError);
                setError('Erro de rede ao remover o arquivo.');
            }
        },
        [TOKEN],
    );

    const resetFilters = useCallback(() => {
        setFolder('');
        setAppliedFolder('');
        setPage(1);
    }, []);

    const canGoPrevious = useMemo(() => meta.prev_page_url !== null, [meta.prev_page_url]);
    const canGoNext = useMemo(() => meta.next_page_url !== null, [meta.next_page_url]);

    const goToPreviousPage = useCallback(() => {
        if (canGoPrevious) {
            setPage((current) => Math.max(1, current - 1));
        }
    }, [canGoPrevious]);

    const goToNextPage = useCallback(() => {
        if (canGoNext) {
            setPage((current) => current + 1);
        }
    }, [canGoNext]);

    return {
        folder,
        setFolder,
        assets,
        loading,
        error,
        meta,
        hasToken,
        canGoPrevious,
        canGoNext,
        fetchAssets,
        handleFilterSubmit,
        handleDelete,
        resetFilters,
        goToPreviousPage,
        goToNextPage,
    };
}
