import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileListItemProps {
    file: File;
    index: number;
    disabled: boolean;
    onRemove: (file: File) => void;
}

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

export function FileListItem({ file, index, disabled, onRemove }: FileListItemProps) {
    return (
        <div
            key={`${file.name}-${index}`}
            className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-xs"
        >
            <div className="flex-1 truncate">
                <span className="font-medium">{file.name}</span>
                <span className="ml-2 text-muted-foreground">
                    ({formatBytes(file.size)})
                </span>
            </div>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onRemove(file)}
                disabled={disabled}
            >
                <X className="h-3 w-3" />
            </Button>
        </div>
    );
}
