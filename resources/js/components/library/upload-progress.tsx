interface UploadProgressProps {
    progress: number;
}

export function UploadProgress({ progress }: UploadProgressProps) {
    return (
        <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
