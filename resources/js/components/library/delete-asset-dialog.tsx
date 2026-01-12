import { deleteAsset } from '@/api/library';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { LibraryAsset } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DeleteAssetDialogProps {
    asset: LibraryAsset;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteAssetDialog({ asset, open, onOpenChange }: DeleteAssetDialogProps) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const fileName = asset.path.split('/').pop();

    const mutation = useMutation({
        mutationFn: async () => {
            return await deleteAsset({ path: asset.path });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['library'] }).catch(() => null);
            toast({
                title: 'Arquivo excluído',
                description: fileName ? `"${fileName}" foi removido.` : 'O arquivo foi removido.',
                variant: 'success',
            });
            onOpenChange(false);
        },
        onError: () => {
            toast({ title: 'Não foi possível excluir o arquivo', variant: 'destructive' });
        },
    });

    return (
        <Dialog open={open} onOpenChange={(state) => !mutation.isPending && onOpenChange(state)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Excluir arquivo</DialogTitle>
                    <DialogDescription>
                        {fileName
                            ? `Deseja excluir definitivamente "${fileName}"? Esta ação não pode ser desfeita.`
                            : 'Deseja excluir definitivamente este arquivo? Esta ação não pode ser desfeita.'}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
                        Cancelar
                    </Button>
                    <Button variant="destructive" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                        {mutation.isPending ? 'Excluindo…' : 'Excluir'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
