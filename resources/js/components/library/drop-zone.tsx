import { CloudUpload } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface DropZoneProps {
    disabled: boolean;
    onFilesSelected: (fileList: FileList | null) => void;
}

export function DropZone({ disabled, onFilesSelected }: DropZoneProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            event.stopPropagation();
            setIsDragging(false);
            onFilesSelected(event.dataTransfer.files);
        },
        [onFilesSelected],
    );

    const handleFileInputChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            onFilesSelected(event.target.files);
            event.target.value = '';
        },
        [onFilesSelected],
    );

    return (
        <div
            className={`flex min-h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition ${
                isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border/60 hover:border-primary/60'
            }`}
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
            <CloudUpload className="mb-3 size-8 text-muted-foreground" />
            <p className="text-sm font-medium">Arraste seus arquivos aqui</p>
            <p className="mt-1 text-xs text-muted-foreground">ou</p>
            <Button
                type="button"
                size="sm"
                className="mt-3"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
            >
                Selecionar arquivos
            </Button>
        </div>
    );
}
