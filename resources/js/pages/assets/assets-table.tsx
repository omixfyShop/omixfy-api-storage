import { Copy, Loader2, Trash2 } from 'lucide-react';
import type { Asset, PaginationMeta } from '@/types';
import { useClipboard } from '@/hooks/use-clipboard';
import { formatBytes } from './format-bytes';

interface Props {
    assets: Asset[];
    loading: boolean;
    meta: PaginationMeta;
    canGoPrevious: boolean;
    canGoNext: boolean;
    onDelete: (asset: Asset) => void;
    onPreviousPage: () => void;
    onNextPage: () => void;
}

function AssetRow({ asset, onCopy, onDelete }: { asset: Asset; onCopy: (url: string) => void; onDelete: (asset: Asset) => void }): React.ReactElement {
    return (
        <tr className="border-t border-border/40">
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
                        onClick={() => onCopy(asset.url)}
                    >
                        <Copy className="size-3" /> Copiar URL
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-3 py-1 text-xs font-medium text-destructive transition hover:bg-destructive/10"
                        onClick={() => onDelete(asset)}
                    >
                        <Trash2 className="size-3" /> Excluir
                    </button>
                </div>
            </td>
        </tr>
    );
}

export function AssetsTable({ assets, loading, meta, canGoPrevious, canGoNext, onDelete, onPreviousPage, onNextPage }: Props): React.ReactElement {
    const [, copy] = useClipboard();

    return (
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
                                <AssetRow key={asset.path} asset={asset} onCopy={copy} onDelete={onDelete} />
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
                        onClick={onPreviousPage}
                        disabled={!canGoPrevious || loading}
                    >
                        Anterior
                    </button>
                    <button
                        type="button"
                        className="rounded-md border border-border/60 px-3 py-1 font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={onNextPage}
                        disabled={!canGoNext || loading}
                    >
                        Próxima
                    </button>
                </div>
            </footer>
        </section>
    );
}
