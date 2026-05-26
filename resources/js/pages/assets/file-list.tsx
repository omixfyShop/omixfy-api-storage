import { formatBytes } from './format-bytes';
import { X } from 'lucide-react';

interface FileListProps {
    files: File[];
    onRemove: (file: File) => void;
}

export function FileList({ files, onRemove }: FileListProps): React.ReactElement {
    return (
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
                            onClick={() => onRemove(file)}
                        >
                            <X className="mr-1 inline size-3" /> Remover
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}
