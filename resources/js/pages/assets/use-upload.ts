import { useCallback, useRef, useState } from 'react';
import type { AssetUploadResult, UploadStatus } from '@/types';
import { buildEndpoint, extractErrorMessage } from '@/api';

export interface UseUploadReturn {
    folder: string;
    setFolder: (value: string) => void;
    files: File[];
    isDragging: boolean;
    progress: number;
    status: UploadStatus;
    error: string;
    results: AssetUploadResult[];
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    hasToken: boolean;
    handleFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
    handleDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
    handleDrop: (event: React.DragEvent<HTMLDivElement>) => void;
    startUpload: () => Promise<void>;
    removeFile: (file: File) => void;
}

export function useUpload(): UseUploadReturn {
    const [folder, setFolder] = useState<string>('');
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [error, setError] = useState<string>('');
    const [results, setResults] = useState<AssetUploadResult[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const TOKEN = localStorage.getItem('tokenAssetsme') ?? '';

    const hasToken = TOKEN !== '';

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

    const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        onFilesSelected(event.target.files);
        event.target.value = '';
    }, [onFilesSelected]);

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isDragging) {
            setIsDragging(true);
        }
    }, [isDragging]);

    const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (isDragging) {
            setIsDragging(false);
        }
    }, [isDragging]);

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        onFilesSelected(event.dataTransfer.files);
    }, [onFilesSelected]);

    const startUpload = useCallback(async () => {
        if (!hasToken) {
            setError('O token de acesso não está configurado.');
            return;
        }

        if (!files.length) {
            setError('Selecione ao menos um arquivo.');
            return;
        }

        setStatus('uploading');
        setError('');
        setProgress(0);

        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files[]', file);
        });

        const endpoint = buildEndpoint('/api/assets/upload', {
            folder: folder.trim(),
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
                        setResults(payload.data ?? []);
                        setFiles([]);
                        setStatus('done');
                        setProgress(100);
                    } else {
                        const message = extractErrorMessage(payload, 'Falha ao enviar arquivos.');
                        setError(message);
                        setStatus('idle');
                    }
                } catch {
                    setError('Erro ao processar a resposta do servidor.');
                    setStatus('idle');
                }
                resolve(undefined);
            };

            xhr.onerror = () => {
                setError('Erro de rede durante o upload.');
                setStatus('idle');
                resolve(undefined);
            };

            xhr.send(formData);
        });
    }, [files, folder, hasToken, TOKEN]);

    const removeFile = useCallback((file: File) => {
        setFiles((current) => current.filter((item) => item !== file));
    }, []);

    return {
        folder,
        setFolder,
        files,
        isDragging,
        progress,
        status,
        error,
        results,
        fileInputRef,
        hasToken,
        handleFileInputChange,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        startUpload,
        removeFile,
    };
}
