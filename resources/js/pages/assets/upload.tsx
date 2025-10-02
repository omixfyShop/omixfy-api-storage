import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { CloudUpload, Copy, FolderInput, Loader2, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import type { AssetUploadResult, UploadStatus } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';
const TOKEN = import.meta.env.VITE_ASSETSME_TOKEN ?? '';

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Assets', href: '/assets/upload' },
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

function buildEndpoint(path: string, params: Record<string, string | number | undefined | null> = {}): string {
    const base = API_BASE_URL || window.location.origin;
    const url = new URL(path, base.endsWith('/') ? base : `${base}/`);

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, String(value));
        }
    });

    return url.toString();
}

function extractErrorMessage(payload: unknown, fallback: string): string {
    if (!payload || typeof payload !== 'object') {
        return fallback;
    }

    const obj = payload as Record<string, unknown>;

    if (typeof obj.message === 'string' && obj.message.trim() !== '') {
        return obj.message;
    }

    if (obj.errors && typeof obj.errors === 'object') {
        const errors = obj.errors as Record<string, unknown>;
        const [firstKey] = Object.keys(errors);
        if (firstKey) {
            const messages = errors[firstKey];
            if (Array.isArray(messages) && messages.length > 0) {
                return String(messages[0]);
            }
        }
    }

    return fallback;
}

export default function Upload() {
    const [folder, setFolder] = useState<string>('');
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [error, setError] = useState<string>('');
    const [results, setResults] = useState<AssetUploadResult[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const hasToken = TOKEN && TOKEN !== '';

    const onFilesSelected = useCallback((fileList: FileList | null) => {
        const items = Array.from(fileList ?? []);
        if (!items.length) {
            return;
        }
        setFiles((current) => {
            const merged = [...current, ...items];
            const map = new Map<string, File>();
            merged.forEach((item) => {
                map.set(`${item.name}-${item.size}-${item.lastModified}`, item);
            });
            return Array.from(map.values());
        });
    }, []);

    const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        onFilesSelected(event.target.files);
        event.target.value = '';
    }, [onFilesSelected]);

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isDragging) {
            setIsDragging(true);
        }
    }, [isDragging]);

    const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (isDragging) {
            setIsDragging(false);
        }
    }, [isDragging]);

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        onFilesSelected(event.dataTransfer.files);
    }, [onFilesSelected]);

    const startUpload = useCallback(async () => {
        if (!hasToken) {
            setError('O token de acesso não está configurado.');
            return;
        }

        if (!files.length) {
            setError('Selecione ao menos um arquivo.');
            return;
        }

        setStatus('uploading');
        setError('');
        setProgress(0);

        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files[]', file);
        });

        const endpoint = buildEndpoint('/api/assets/upload', {
            folder: folder.trim(),
        });

        await new Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', endpoint);
            xhr.setRequestHeader('Authorization', `Bearer ${TOKEN}`);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    setProgress(Math.round((event.loaded / event.total) * 100));
                }
            };

            xhr.onload = () => {
                try {
                    const payload = JSON.parse(xhr.responseText || '{}');
                    if (xhr.status >= 200 && xhr.status < 300) {
                        setResults(payload.data ?? []);
                        setFiles([]);
                        setStatus('done');
                        setProgress(100);
                    } else {
                        const message = extractErrorMessage(payload, 'Falha ao enviar arquivos.');
                        setError(message);
                        setStatus('idle');
                    }
                } catch {
                    setError('Erro ao processar a resposta do servidor.');
                    setStatus('idle');
                }
                resolve(undefined);
            };

            xhr.onerror = () => {
                setError('Erro de rede durante o upload.');
                setStatus('idle');
                resolve(undefined);
            };

            xhr.send(formData);
        });
    }, [files, folder, hasToken]);

    const removeFile = useCallback((file: File) => {
        setFiles((current) => current.filter((item) => item !== file));
    }, []);

    const copyToClipboard = useCallback(async (value: string) => {
        if (!value) {
            return;
        }

        try {
            await navigator.clipboard.writeText(value);
        } catch (copyError) {
            console.error('Clipboard error', copyError);
        }
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Upload de Assets" />
            <div className="flex flex-col gap-6 p-6">
                <section className="flex flex-col gap-4 rounded-xl border border-sidebar-border/70 bg-card/40 p-6 shadow-sm backdrop-blur dark:border-sidebar-border dark:bg-card/20">
                    <header className="flex flex-col gap-1">
                        <h2 className="flex items-center gap-2 text-lg font-semibold">
                            <CloudUpload className="size-5" /> Upload de assets
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Arraste e solte arquivos ou selecione manualmente. O tamanho máximo é definido por <code>ASSETS_MAX_FILE_SIZE</code>.
                        </p>
                    </header>

                    {!hasToken && (
                        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                            Configure <code>VITE_ASSETSME_TOKEN</code> no arquivo <code>.env</code> do frontend para enviar requisições autenticadas.
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-[1fr_280px]">
                        <div
                            className={`flex min-h-52 flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition ${isDragging ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/60'}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileInputChange}
                            />
                            <CloudUpload className="mb-3 size-10 text-muted-foreground" />
                            <p className="text-sm font-medium">Arraste seus arquivos aqui</p>
                            <p className="mt-1 text-xs text-muted-foreground">ou</p>
                            <button
                                type="button"
                                className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Selecionar arquivos
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-medium" htmlFor="folder-input">
                                Pasta de destino
                            </label>
                            <div className="flex items-center gap-2 rounded-md border border-border/60 bg-background/60 px-3 py-2">
                                <FolderInput className="size-4 text-muted-foreground" />
                                <input
                                    id="folder-input"
                                    type="text"
                                    value={folder}
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setFolder(event.target.value)}
                                    placeholder="Ex.: produtos/2025"
                                    className="flex-1 bg-transparent text-sm outline-none"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Utilize apenas letras, números, barras, hífens e underlines. Deixe vazio para salvar na raiz.
                            </p>

                            <button
                                type="button"
                                onClick={startUpload}
                                disabled={status === 'uploading' || !files.length}
                                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow transition enabled:hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted"
                            >
                                {status === 'uploading' ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" /> Enviando...
                                    </>
                                ) : (
                                    <>
                                        <CloudUpload className="size-4" /> Enviar {files.length ? `(${files.length})` : ''}
                                    </>
                                )}
                            </button>

                            {status === 'uploading' && (
                                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full bg-primary transition-all"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            )}

                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}
                        </div>
                    </div>
                </section>

                {files.length > 0 && (
                    <section className="rounded-xl border border-border/60 bg-card/40 p-4 shadow-sm dark:border-sidebar-border">
                        <header className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                Arquivos selecionados
                            </h3>
                            <span className="text-xs text-muted-foreground">{files.length} arquivo(s)</span>
                        </header>
                        <ul className="space-y-2 text-sm">
                            {files.map((file) => (
                                <li key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center justify-between gap-4 rounded-md border border-border/40 bg-background/60 px-3 py-2">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-foreground">{file.name}</span>
                                        <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="text-xs font-medium text-muted-foreground transition hover:text-destructive"
                                        onClick={() => removeFile(file)}
                                    >
                                        <X className="mr-1 inline size-3" /> Remover
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {status === 'done' && results.length > 0 && (
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
                                        onClick={() => copyToClipboard(item.url)}
                                    >
                                        <Copy className="size-3" /> Copiar URL
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
