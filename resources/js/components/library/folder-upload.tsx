import { Loader2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { buildEndpoint, extractErrorMessage } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { DropZone } from './drop-zone';
import { FileListItem } from './file-list-item';
import { UploadProgress } from './upload-progress';

interface FolderUploadProps {
    folderId: number;
    onUploadComplete?: () => void;
}

export function FolderUpload({ folderId, onUploadComplete }: FolderUploadProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
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
            <DropZone disabled={isUploading} onFilesSelected={onFilesSelected} />

            {files.length > 0 && (
                <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                        {files.length} arquivo(s) selecionado(s)
                    </p>
                    <div className="max-h-48 space-y-1 overflow-y-auto">
                        {files.map((file, idx) => (
                            <FileListItem
                                key={`${file.name}-${idx}`}
                                file={file}
                                index={idx}
                                disabled={isUploading}
                                onRemove={removeFile}
                            />
                        ))}
                    </div>

                    {isUploading && <UploadProgress progress={progress} />}

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
