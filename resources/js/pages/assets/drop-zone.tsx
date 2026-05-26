import { CloudUpload } from 'lucide-react';

interface DropZoneProps {
    isDragging: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
    onFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function DropZone({
    isDragging,
    fileInputRef,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileInputChange,
}: DropZoneProps): React.ReactElement {
    return (
        <div
            className={`flex min-h-52 flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition ${isDragging ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/60'}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={onFileInputChange}
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
    );
}
