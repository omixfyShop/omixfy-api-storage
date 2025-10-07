import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Copy, Loader2, RefreshCcw, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Asset, PaginationMeta } from '@/types';
import { buildEndpoint, extractErrorMessage } from '@/api';

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Assets', href: '/assets/list' },
];

function formatBytes(bytes: number | undefined | null): string {
    if (!bytes && bytes !== 0) {
        return '—';
    }

    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) {
        return '0 B';
    }

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
}

export default function List() {
    const [folder, setFolder] = useState<string>('');
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [page, setPage] = useState<number>(1);
    const [appliedFolder, setAppliedFolder] = useState<string>('');
    const [meta, setMeta] = useState<PaginationMeta>({ current_page: 1, per_page: 25, next_page_url: null, prev_page_url: null });
    const TOKEN = localStorage.getItem('tokenAssetsme') ?? '';
    const hasToken = TOKEN && TOKEN !== '';
    const perPage = 25;

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
                per_page: perPage,
            });

            try {
                const response = await fetch(endpoint, {
                    headers: {
                        Authorization: `Bearer ${TOKEN}`,
                    },
                });

                const payload = await response.json().catch(() => ({}));

                if (!response.ok) {
                    setError(extractErrorMessage(payload, 'Não foi possível carregar os assets.'));
                    setAssets([]);
                    setMeta({ current_page: targetPage, per_page: perPage, next_page_url: null, prev_page_url: null });
                    return;
                }

                setAssets(Array.isArray(payload.data) ? payload.data : []);
                setMeta({
                    current_page: payload.meta?.current_page ?? targetPage,
                    per_page: payload.meta?.per_page ?? perPage,
                    next_page_url: payload.meta?.next_page_url ?? null,
                    prev_page_url: payload.meta?.prev_page_url ?? null,
                });
            } catch (requestError) {
                console.error(requestError);
                setError('Erro de rede ao consultar a API.');
                setAssets([]);
                setMeta({ current_page: targetPage, per_page: perPage, next_page_url: null, prev_page_url: null });
            } finally {
                setLoading(false);
            }
        },
        [appliedFolder, hasToken, page, perPage, TOKEN],
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

    const copyToClipboard = useCallback(async (value: string) => {
        if (!value) {
            return;
        }

        try {
            await navigator.clipboard.writeText(value);
        } catch (copyError) {
            console.error(copyError);
        }
    }, []);

    const handleDelete = useCallback(
        async (asset: Asset) => {
            if (!asset?.path) {
                return;
            }

            const confirmed = window.confirm(`Remover ${asset.original_name}?`);
            if (!confirmed) {
                return;
            }

            const endpoint = buildEndpoint('/api/assets/file', {
                path: asset.path,
            });

            try {
                const response = await fetch(endpoint, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${TOKEN}`,
                    },
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Assets" />
            <div className="flex flex-col gap-6 p-6">
                <section className="rounded-xl border border-sidebar-border/70 bg-card/40 p-6 shadow-sm backdrop-blur dark:border-sidebar-border dark:bg-card/20">
                    <header className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Listagem de assets</h2>
                            <p className="text-sm text-muted-foreground">
                                Busque arquivos por pasta e gerencie as URLs públicas.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted"
                            onClick={() => fetchAssets()}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />} Atualizar
                        </button>
                    </header>

                    {!hasToken && (
                        <div className="mb-4 rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                            Configure um token no menu lateral para enviar requisições autenticadas.
                        </div>
                    )}

                    <form onSubmit={handleFilterSubmit} className="flex flex-col gap-4 rounded-lg border border-border/50 bg-background/50 p-4 md:flex-row md:items-end">
                        <div className="flex-1">
                            <label className="text-sm font-medium" htmlFor="folder-filter">
                                Pasta
                            </label>
                            <div className="mt-1 flex items-center gap-2 rounded-md border border-border/60 bg-background/60 px-3 py-2">
                                <Search className="size-4 text-muted-foreground" />
                                <input
                                    id="folder-filter"
                                    type="text"
                                    value={folder}
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setFolder(event.target.value)}
                                    placeholder="Ex.: produtos/2025"
                                    className="flex-1 bg-transparent text-sm outline-none"
                                />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Use somente letras, números, barras, hífens e underlines. Deixe vazio para listar a raiz.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="size-4 animate-spin" /> : 'Filtrar'}
                            </button>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex items-center gap-2 rounded-md border border-border/60 px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted"
                                disabled={loading}
                            >
                                Limpar
                            </button>
                        </div>
                    </form>

                    {error && (
                        <p className="mt-4 text-sm text-destructive">{error}</p>
                    )}
                </section>

                <section className="rounded-xl border border-border/60 bg-card/40 p-4 shadow-sm dark:border-sidebar-border">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border/60 text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className="px-3 py-2">Arquivo</th>
                                    <th className="px-3 py-2">Pasta</th>
                                    <th className="px-3 py-2">MIME</th>
                                    <th className="px-3 py-2">Tamanho</th>
                                    <th className="px-3 py-2">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                                            <Loader2 className="mr-2 inline size-4 animate-spin" /> Carregando assets...
                                        </td>
                                    </tr>
                                )}

                                {!loading && assets.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                                            Nenhum asset encontrado para o filtro informado.
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    assets.map((asset) => (
                                        <tr key={asset.path} className="border-t border-border/40">
                                            <td className="max-w-[220px] px-3 py-3">
                                                <div className="flex flex-col">
                                                    <span className="truncate font-medium text-foreground" title={asset.original_name}>
                                                        {asset.original_name}
                                                    </span>
                                                    <a
                                                        href={asset.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="truncate text-xs text-primary hover:underline"
                                                    >
                                                        {asset.url}
                                                    </a>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-xs text-muted-foreground">
                                                {asset.folder || '—'}
                                            </td>
                                            <td className="px-3 py-3 text-xs text-muted-foreground">{asset.mime}</td>
                                            <td className="px-3 py-3 text-xs text-muted-foreground">{formatBytes(asset.size)}</td>
                                            <td className="px-3 py-3">
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center gap-1 rounded-md border border-primary/50 px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary/10"
                                                        onClick={() => copyToClipboard(asset.url)}
                                                    >
                                                        <Copy className="size-3" /> Copiar URL
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-3 py-1 text-xs font-medium text-destructive transition hover:bg-destructive/10"
                                                        onClick={() => handleDelete(asset)}
                                                    >
                                                        <Trash2 className="size-3" /> Excluir
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>

                    <footer className="mt-4 flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground md:flex-row">
                        <span>
                            Página {meta.current_page} · {assets.length} item(s)
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="rounded-md border border-border/60 px-3 py-1 font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() => {
                                    if (canGoPrevious) {
                                        setPage((current) => Math.max(1, current - 1));
                                    }
                                }}
                                disabled={!canGoPrevious || loading}
                            >
                                Anterior
                            </button>
                            <button
                                type="button"
                                className="rounded-md border border-border/60 px-3 py-1 font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() => {
                                    if (canGoNext) {
                                        setPage((current) => current + 1);
                                    }
                                }}
                                disabled={!canGoNext || loading}
                            >
                                Próxima
                            </button>
                        </div>
                    </footer>
                </section>
            </div>
        </AppLayout>
    );
}
