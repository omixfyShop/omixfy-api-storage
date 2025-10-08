import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FolderUpload } from './folder-upload';
import { useQueryClient } from '@tanstack/react-query';

interface UploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    folderId: number;
    folderName: string;
}

export function UploadDialog({ open, onOpenChange, folderId, folderName }: UploadDialogProps) {
    const queryClient = useQueryClient();

    const handleUploadComplete = () => {
        // Invalidate queries to refresh the folder contents
        queryClient.invalidateQueries({ queryKey: ['library', 'folder-children'] });
        queryClient.invalidateQueries({ queryKey: ['library', 'folder-preview'] });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Enviar arquivos</DialogTitle>
                    <DialogDescription>
                        Envie arquivos para a pasta <strong>{folderName}</strong>
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                    <FolderUpload folderId={folderId} onUploadComplete={handleUploadComplete} />
                </div>
            </DialogContent>
        </Dialog>
    );
}

