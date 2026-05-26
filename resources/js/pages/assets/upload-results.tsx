import { useClipboard } from '@/hooks/use-clipboard';
import type { AssetUploadResult } from '@/types';
import { Copy } from 'lucide-react';
import { formatBytes } from './format-bytes';

interface UploadResultsProps {
    results: AssetUploadResult[];
}

export function UploadResults({ results }: UploadResultsProps): React.ReactElement {
    const [, copy] = useClipboard();

    return (
        <section className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 shadow-sm">
            <header className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-600">
                    Upload concluído
                </h3>
                <span className="text-xs text-emerald-700">{results.length} arquivo(s)</span>
            </header>
            <ul className="space-y-2 text-sm">
                {results.map((item) => (
                    <li key={item.path} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-emerald-500/40 bg-background/80 px-3 py-2">
                        <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate font-medium text-foreground" title={item.original_name}>
                                {item.original_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {item.mime} · {formatBytes(item.size)}
                            </span>
                            <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="truncate text-xs text-primary hover:underline"
                            >
                                {item.url}
                            </a>
                        </div>
                        <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-md border border-primary/50 px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary/10"
                            onClick={() => copy(item.url)}
                        >
                            <Copy className="size-3" /> Copiar URL
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}
