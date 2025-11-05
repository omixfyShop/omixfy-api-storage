import { fetchFolder, fetchFolderChildren, listFolders } from '@/api/library';
import { LibraryLayout } from '@/components/library/library-layout';
import { FolderGrid } from '@/components/library/folder-grid';
import { AssetsList } from '@/components/library/assets-list';
import { CreateFolderDialog } from '@/components/library/create-folder-dialog';
import { UploadDialog } from '@/components/library/upload-dialog';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, FolderChildrenResponse, LibraryFolder, LibraryFolderBreadcrumb } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { HttpError } from '@/api/http';
import { useToast } from '@/hooks/use-toast';

type LibraryPageProps = {
    initialFolderId: number | null;
    initialBreadcrumbs: LibraryFolderBreadcrumb[];
};

const baseBreadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Biblioteca', href: '/library' },
];

const PER_PAGE = 30;

type OrderField = 'name' | 'created_at' | 'updated_at';

type OrderDirection = 'asc' | 'desc';

export default function LibraryIndex() {
    const { initialFolderId, initialBreadcrumbs } = usePage<LibraryPageProps>().props;
    const [currentFolderId, setCurrentFolderId] = useState<number | null>(initialFolderId);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [orderBy, setOrderBy] = useState<OrderField>('name');
    const [order, setOrder] = useState<OrderDirection>('asc');
    const [page, setPage] = useState(1);
    const [createOpen, setCreateOpen] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    useEffect(() => {
        setCurrentFolderId(initialFolderId);
        setPage(1);
    }, [initialFolderId]);

    useEffect(() => {
        const timeout = window.setTimeout(() => setDebouncedSearch(search), 300);
        return () => window.clearTimeout(timeout);
    }, [search]);

    const isRoot = currentFolderId === null;

    const rootQuery = useQuery({
        queryKey: ['library', 'folders', { parentId: 'root', orderBy, order, search: debouncedSearch, page }],
        queryFn: () =>
            listFolders({
                parent_id: debouncedSearch ? undefined : null,
                orderBy,
                order,
                q: debouncedSearch || undefined,
                page,
                per_page: PER_PAGE,
            }),
        enabled: isRoot,
    });

    const folderChildrenQuery = useQuery({
        queryKey: ['library', 'folder-children', { folderId: currentFolderId, orderBy, order, search: debouncedSearch, page }],
        queryFn: () =>
            fetchFolderChildren(currentFolderId ?? 0, {
                orderBy,
                order,
                q: debouncedSearch || undefined,
                page,
                per_page: PER_PAGE,
            }),
        enabled: !isRoot && currentFolderId !== null,
    });

    const folderDetailQuery = useQuery({
        queryKey: ['library', 'folder-detail', currentFolderId],
        queryFn: () => fetchFolder(currentFolderId ?? 0),
        enabled: !isRoot && currentFolderId !== null,
    });

    useEffect(() => {
        if (rootQuery.error && rootQuery.error instanceof HttpError && rootQuery.error.response.status === 401) {
            toast({
                title: 'Não autorizado',
                description: 'Adicione o token de acesso na barra lateral',
                variant: 'destructive',
            });
        }
    }, [rootQuery.error, toast]);

    useEffect(() => {
        if (folderChildrenQuery.error && folderChildrenQuery.error instanceof HttpError && folderChildrenQuery.error.response.status === 401) {
            toast({
                title: 'Não autorizado',
                description: 'Adicione o token de acesso na barra lateral',
                variant: 'destructive',
            });
        }
    }, [folderChildrenQuery.error, toast]);

    useEffect(() => {
        if (folderDetailQuery.error && folderDetailQuery.error instanceof HttpError && folderDetailQuery.error.response.status === 401) {
            toast({
                title: 'Não autorizado',
                description: 'Adicione o token de acesso na barra lateral',
                variant: 'destructive',
            });
        }
    }, [folderDetailQuery.error, toast]);

    const folders: LibraryFolder[] = useMemo(() => {
        if (isRoot) {
            return rootQuery.data?.data ?? [];
        }

        const result: FolderChildrenResponse | undefined = folderChildrenQuery.data;
        return result?.folders.data ?? [];
    }, [isRoot, rootQuery.data, folderChildrenQuery.data]);

    const assets = useMemo(() => {
        if (isRoot) {
            return [];
        }

        return folderChildrenQuery.data?.assets.data ?? [];
    }, [isRoot, folderChildrenQuery.data]);

    const foldersMeta = useMemo(() => {
        if (isRoot) {
            return rootQuery.data?.meta;
        }

        return folderChildrenQuery.data?.folders.meta;
    }, [isRoot, rootQuery.data, folderChildrenQuery.data]);

    const breadcrumbs = useMemo(() => {
        if (isRoot) {
            return baseBreadcrumbs;
        }

        const data = folderDetailQuery.data?.data?.breadcrumbs ?? initialBreadcrumbs;
        return [
            ...baseBreadcrumbs,
            ...data.map((crumb) => ({
                title: crumb.name,
                href: `/library/${crumb.id}`,
            })),
        ];
    }, [isRoot, folderDetailQuery.data, initialBreadcrumbs]);

    const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.title ?? 'Biblioteca';

    const isLoading = isRoot ? rootQuery.isLoading : folderChildrenQuery.isLoading;

    const handleNavigate = (folder: LibraryFolder) => {
        router.visit(`/library/${folder.id}`);
    };

    const hasPrev = (foldersMeta?.current_page ?? 1) > 1;
    const hasNext = (foldersMeta?.last_page ?? 1) > (foldersMeta?.current_page ?? 1);

    const currentFolder = folderDetailQuery.data?.data;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />
            <div className="flex flex-col gap-6 p-6">
            <LibraryLayout
                breadcrumbs={[]}
                title={pageTitle}
                onCreateFolder={() => setCreateOpen(true)}
                search={search}
                onSearchChange={(value) => {
                    setSearch(value);
                    setPage(1);
                }}
                orderBy={orderBy}
                order={order}
                onOrderByChange={(value) => {
                    setOrderBy(value);
                    setPage(1);
                }}
                onOrderChange={(value) => {
                    setOrder(value);
                    setPage(1);
                }}
                actionSlot={
                    !isRoot && currentFolderId ? (
                        <Button onClick={() => setUploadOpen(true)} variant="outline" className="gap-2">
                            <Upload className="h-4 w-4" /> Enviar arquivo
                        </Button>
                    ) : null
                }
            >
                <FolderGrid
                    folders={folders}
                    isLoading={isLoading}
                    onSelect={handleNavigate}
                    emptyTitle={isRoot ? 'Nenhuma pasta cadastrada' : 'Sem subpastas aqui'}
                    emptyDescription={
                        isRoot
                            ? 'Crie uma pasta para começar a organizar os seus arquivos.'
                            : 'Use o menu de ações para criar subpastas ou mover itens.'
                    }
                />

                <AssetsList 
                    assets={assets} 
                    folderId={currentFolderId}
                    previewAssetIds={currentFolder?.preview_asset_ids ?? []}
                />

                {foldersMeta ? (
                    <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            Página {foldersMeta.current_page} de {foldersMeta.last_page ?? foldersMeta.current_page}
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="rounded-md border border-input px-3 py-1 disabled:opacity-50"
                                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                disabled={!hasPrev}
                            >
                                Anterior
                            </button>
                            <button
                                type="button"
                                className="rounded-md border border-input px-3 py-1 disabled:opacity-50"
                                onClick={() => setPage((prev) => prev + 1)}
                                disabled={!hasNext}
                            >
                                Próxima
                            </button>
                        </div>
                    </div>
                ) : null}
            </LibraryLayout>
            </div>

            <CreateFolderDialog open={createOpen} onOpenChange={setCreateOpen} parentId={currentFolderId} />
            
            {!isRoot && currentFolderId && currentFolder && (
                <UploadDialog 
                    open={uploadOpen} 
                    onOpenChange={setUploadOpen} 
                    folderId={currentFolderId}
                    folderName={currentFolder.name}
                />
            )}
        </AppLayout>
    );
}
