import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Loader2, RefreshCcw } from 'lucide-react';
import { useAssets } from './use-assets';
import { AssetsFilterForm } from './assets-filter-form';
import { AssetsTable } from './assets-table';

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Assets', href: '/assets/list' },
];

export default function List() {
    const {
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
    } = useAssets();

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

                    <AssetsFilterForm
                        folder={folder}
                        loading={loading}
                        onFolderChange={setFolder}
                        onSubmit={handleFilterSubmit}
                        onReset={resetFilters}
                    />

                    {error && (
                        <p className="mt-4 text-sm text-destructive">{error}</p>
                    )}
                </section>

                <AssetsTable
                    assets={assets}
                    loading={loading}
                    meta={meta}
                    canGoPrevious={canGoPrevious}
                    canGoNext={canGoNext}
                    onDelete={handleDelete}
                    onPreviousPage={goToPreviousPage}
                    onNextPage={goToNextPage}
                />
            </div>
        </AppLayout>
    );
}
