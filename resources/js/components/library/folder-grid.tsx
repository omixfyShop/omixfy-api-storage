import { Skeleton } from '@/components/ui/skeleton';
import type { LibraryFolder } from '@/types';
import { EmptyState } from './empty-state';
import { FolderCard } from './folder-card';

interface FolderGridProps {
    folders: LibraryFolder[];
    isLoading?: boolean;
    onSelect: (folder: LibraryFolder) => void;
    emptyTitle: string;
    emptyDescription: string;
}

export function FolderGrid({ folders, isLoading = false, onSelect, emptyDescription, emptyTitle }: FolderGridProps) {
    if (isLoading) {
        return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-40 rounded-lg" />
                ))}
            </div>
        );
    }

    if (!folders.length) {
        return <EmptyState title={emptyTitle} description={emptyDescription} />;
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {folders.map((folder) => (
                <FolderCard key={folder.id} folder={folder} onClick={() => onSelect(folder)} />
            ))}
        </div>
    );
}
