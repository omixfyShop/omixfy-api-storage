import { Loader2, Search } from 'lucide-react';

interface Props {
    folder: string;
    loading: boolean;
    onFolderChange: (value: string) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    onReset: () => void;
}

export function AssetsFilterForm({ folder, loading, onFolderChange, onSubmit, onReset }: Props): React.ReactElement {
    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-lg border border-border/50 bg-background/50 p-4 md:flex-row md:items-end">
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
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => onFolderChange(event.target.value)}
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
                    onClick={onReset}
                    className="inline-flex items-center gap-2 rounded-md border border-border/60 px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted"
                    disabled={loading}
                >
                    Limpar
                </button>
            </div>
        </form>
    );
}
