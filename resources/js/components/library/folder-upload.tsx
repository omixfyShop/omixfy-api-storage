import { CloudUpload, Loader2, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { buildEndpoint, extractErrorMessage } from '@/api';
import { useToast } from '@/hooks/use-toast';

interface FolderUploadProps {
    folderId: number;
    onUploadComplete?: () => void;
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

export function FolderUpload({ folderId, onUploadComplete }: FolderUploadProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const TOKEN = localStorage.getItem('tokenAssetsme') ?? '';

    const onFilesSelected = useCallback((fileList: FileList | null) => {
        const items = Array.from(fileList ?? []);
        if (!items.length) {
            return;
        }
        setFiles((current) => {
            const merged = [...current, ...items];
            const map = new Map<string, File>();
            merged.forEach((item) => {
                map.set(`${item.name}-${item.size}-${item.lastModified}`, item);
            });
            return Array.from(map.values());
        });
    }, []);

    const handleFileInputChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            onFilesSelected(event.target.files);
            event.target.value = '';
        },
        [onFilesSelected],
    );

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

    const startUpload = useCallback(async () => {
        if (!TOKEN) {
            toast({
                title: 'Token não configurado',
                description: 'Configure um token de acesso para enviar arquivos.',
                variant: 'destructive',
            });
            return;
        }

        if (!files.length) {
            toast({
                title: 'Nenhum arquivo selecionado',
                description: 'Selecione ao menos um arquivo para enviar.',
                variant: 'destructive',
            });
            return;
        }

        setIsUploading(true);
        setProgress(0);

        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files[]', file);
        });

        // Buscar o path da pasta via API
        try {
            const folderResponse = await fetch(buildEndpoint(`/api/v1/folders/${folderId}`), {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${TOKEN}`,
                },
            });

            if (!folderResponse.ok) {
                throw new Error('Não foi possível obter informações da pasta');
            }

            const folderData = await folderResponse.json();
            const folderPath = folderData.data?.full_path || '';

            const endpoint = buildEndpoint('/api/assets/upload', {
                folder: folderPath,
            });

            await new Promise((resolve) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', endpoint);
                xhr.setRequestHeader('Authorization', `Bearer ${TOKEN}`);

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        setProgress(Math.round((event.loaded / event.total) * 100));
                    }
                };

                xhr.onload = () => {
                    try {
                        const payload = JSON.parse(xhr.responseText || '{}');
                        if (xhr.status >= 200 && xhr.status < 300) {
                            toast({
                                title: 'Upload concluído',
                                description: `${files.length} arquivo(s) enviado(s) com sucesso.`,
                                variant: 'success',
                            });
                            setFiles([]);
                            setProgress(100);
                            onUploadComplete?.();
                        } else {
                            const message = extractErrorMessage(payload, 'Falha ao enviar arquivos.');
                            toast({
                                title: 'Erro no upload',
                                description: message,
                                variant: 'destructive',
                            });
                        }
                    } catch {
                        toast({
                            title: 'Erro',
                            description: 'Erro ao processar a resposta do servidor.',
                            variant: 'destructive',
                        });
                    }
                    setIsUploading(false);
                    resolve(undefined);
                };

                xhr.onerror = () => {
                    toast({
                        title: 'Erro de rede',
                        description: 'Erro de rede durante o upload.',
                        variant: 'destructive',
                    });
                    setIsUploading(false);
                    resolve(undefined);
                };

                xhr.send(formData);
            });
        } catch (error) {
            toast({
                title: 'Erro',
                description: error instanceof Error ? error.message : 'Erro ao fazer upload',
                variant: 'destructive',
            });
            setIsUploading(false);
        }
    }, [files, folderId, toast, onUploadComplete, TOKEN]);

    const removeFile = useCallback((file: File) => {
        setFiles((current) => current.filter((item) => item !== file));
    }, []);

    return (
        <div className="space-y-4">
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
                    disabled={isUploading}
                >
                    Selecionar arquivos
                </Button>
            </div>

            {files.length > 0 && (
                <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                        {files.length} arquivo(s) selecionado(s)
                    </p>
                    <div className="max-h-48 space-y-1 overflow-y-auto">
                        {files.map((file, idx) => (
                            <div
                                key={`${file.name}-${idx}`}
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
                                    onClick={() => removeFile(file)}
                                    disabled={isUploading}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    {isUploading && (
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
                    )}

                    <Button
                        type="button"
                        className="mt-3 w-full"
                        onClick={startUpload}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            'Enviar arquivos'
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}

