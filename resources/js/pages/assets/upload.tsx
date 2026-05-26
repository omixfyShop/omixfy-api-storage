import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { CloudUpload } from 'lucide-react';
import { DropZone } from './drop-zone';
import { FileList } from './file-list';
import { UploadResults } from './upload-results';
import { UploadSidebar } from './upload-sidebar';
import { useUpload } from './use-upload';

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Assets', href: '/assets/upload' },
];

export default function Upload() {
    const {
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
    } = useUpload();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Upload de Assets" />
            <div className="flex flex-col gap-6 p-6">
                <section className="flex flex-col gap-4 rounded-xl border border-sidebar-border/70 bg-card/40 p-6 shadow-sm backdrop-blur dark:border-sidebar-border dark:bg-card/20">
                    <header className="flex flex-col gap-1">
                        <h2 className="flex items-center gap-2 text-lg font-semibold">
                            <CloudUpload className="size-5" /> Upload de assets
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Arraste e solte arquivos ou selecione manualmente. O tamanho máximo é definido por <code>ASSETS_MAX_FILE_SIZE</code>.
                        </p>
                    </header>

                    {!hasToken && (
                        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                           Adicione um token no menu lateral para enviar requisições autenticadas.
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-[1fr_280px]">
                        <DropZone
                            isDragging={isDragging}
                            fileInputRef={fileInputRef}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onFileInputChange={handleFileInputChange}
                        />

                        <UploadSidebar
                            folder={folder}
                            onFolderChange={setFolder}
                            status={status}
                            progress={progress}
                            error={error}
                            fileCount={files.length}
                            onStartUpload={startUpload}
                        />
                    </div>
                </section>

                {files.length > 0 && (
                    <FileList files={files} onRemove={removeFile} />
                )}

                {status === 'done' && results.length > 0 && (
                    <UploadResults results={results} />
                )}
            </div>
        </AppLayout>
    );
}
