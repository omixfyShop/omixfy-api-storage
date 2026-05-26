import type { UploadStatus } from '@/types';
import { CloudUpload, FolderInput, Loader2 } from 'lucide-react';

interface UploadSidebarProps {
    folder: string;
    onFolderChange: (value: string) => void;
    status: UploadStatus;
    progress: number;
    error: string;
    fileCount: number;
    onStartUpload: () => void;
}

export function UploadSidebar({
    folder,
    onFolderChange,
    status,
    progress,
    error,
    fileCount,
    onStartUpload,
}: UploadSidebarProps): React.ReactElement {
    return (
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
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => onFolderChange(event.target.value)}
                    placeholder="Ex.: produtos/2025"
                    className="flex-1 bg-transparent text-sm outline-none"
                />
            </div>
            <p className="text-xs text-muted-foreground">
                Utilize apenas letras, números, barras, hífens e underlines. Deixe vazio para salvar na raiz.
            </p>

            <button
                type="button"
                onClick={onStartUpload}
                disabled={status === 'uploading' || !fileCount}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow transition enabled:hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted"
            >
                {status === 'uploading' ? (
                    <>
                        <Loader2 className="size-4 animate-spin" /> Enviando...
                    </>
                ) : (
                    <>
                        <CloudUpload className="size-4" /> Enviar {fileCount ? `(${fileCount})` : ''}
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
    );
}
