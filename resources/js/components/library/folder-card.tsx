import { fetchFolderPreview } from '@/api/library';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useInView } from '@/hooks/use-in-view';
import { useToast } from '@/hooks/use-toast';
import { useClipboard } from '@/hooks/use-clipboard';
import type { LibraryFolder } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { Folder, ImageDown, MoreHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CreateFolderDialog } from './create-folder-dialog';
import { DeleteRestoreDialog } from './delete-restore-dialog';
import { MoveFolderDialog } from './move-folder-dialog';
import { RenameFolderDialog } from './rename-folder-dialog';

interface FolderCardProps {
    folder: LibraryFolder;
    onClick: () => void;
}

const assetsBase = (import.meta.env.VITE_ASSETS_BASE_URL as string | undefined) ?? '/storage/';
const normalizedBase = assetsBase.endsWith('/') ? assetsBase : `${assetsBase}/`;

export function FolderCard({ folder, onClick }: FolderCardProps) {
    const { ref, isInView } = useInView<HTMLDivElement>({ rootMargin: '150px' });
    const [renameOpen, setRenameOpen] = useState(false);
    const [moveOpen, setMoveOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [restoreOpen, setRestoreOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [, copy] = useClipboard();
    const { toast } = useToast();

    const previewQuery = useQuery({
        queryKey: ['library', 'folder-preview', folder.id],
        queryFn: () => fetchFolderPreview(folder.id),
        enabled: isInView,
        staleTime: 1000 * 60,
    });

    const previewAssets = useMemo(() => previewQuery.data?.data ?? [], [previewQuery.data?.data]);

    const handleCopy = (value: string, label: string) => {
        copy(value).then((copied) => {
            if (copied) {
                toast({ title: `${label} copiado`, variant: 'success' });
            }
        });
    };

    const previewContent = previewAssets.length ? (
        <div className="grid h-32 grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-md bg-muted">
            {previewAssets.slice(0, 4).map((asset) => {
                const thumb = (asset.preview_thumb as { path?: string } | undefined)?.path ?? asset.path;
                const url = `${normalizedBase}${thumb}`;
                return <img key={asset.id} src={url} alt="Prévia da pasta" className="h-full w-full object-cover" loading="lazy" />;
            })}
        </div>
    ) : (
        <div className="flex h-32 items-center justify-center rounded-md bg-muted">
            <ImageDown className="h-8 w-8 text-muted-foreground" />
        </div>
    );

    return (
        <>
            <Card
                ref={ref}
                className="group cursor-pointer transition hover:border-primary"
                onClick={onClick}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onClick();
                    }
                }}
                role="button"
                tabIndex={0}
            >
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <CardTitle className="line-clamp-1 text-base font-semibold">{folder.name}</CardTitle>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 transition group-hover:opacity-100">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={onClick}>Abrir</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setCreateOpen(true)}>Criar subpasta</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRenameOpen(true)}>Renomear</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setMoveOpen(true)}>Mover</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleCopy(String(folder.id), 'ID')}>Copiar ID</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopy(folder.slug, 'Slug')}>Copiar slug</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {folder.deleted_at ? (
                                <DropdownMenuItem onClick={() => setRestoreOpen(true)} className="text-green-600">
                                    Restaurar
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-red-600">
                                    Excluir
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-3">
                    {previewQuery.isLoading ? (
                        <div className="flex h-32 items-center justify-center rounded-md bg-muted/50">
                            <Folder className="h-8 w-8 animate-pulse text-muted-foreground" />
                        </div>
                    ) : (
                        previewContent
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary">{folder.folders_count} pastas</Badge>
                        <Badge variant="secondary">{folder.files_count} arquivos</Badge>
                    </div>
                </CardContent>
            </Card>

            <RenameFolderDialog folder={folder} open={renameOpen} onOpenChange={setRenameOpen} />
            <MoveFolderDialog folder={folder} open={moveOpen} onOpenChange={setMoveOpen} />
            <DeleteRestoreDialog folder={folder} mode="delete" open={deleteOpen} onOpenChange={setDeleteOpen} />
            <DeleteRestoreDialog folder={folder} mode="restore" open={restoreOpen} onOpenChange={setRestoreOpen} />
            <CreateFolderDialog open={createOpen} onOpenChange={setCreateOpen} parentId={folder.id} />
        </>
    );
}
