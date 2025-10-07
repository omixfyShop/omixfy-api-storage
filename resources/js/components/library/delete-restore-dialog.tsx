import { deleteFolder, restoreFolder } from '@/api/library';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { LibraryFolder } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DeleteRestoreDialogProps {
    folder: LibraryFolder;
    mode: 'delete' | 'restore';
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteRestoreDialog({ folder, mode, open, onOpenChange }: DeleteRestoreDialogProps) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const mutation = useMutation({
        mutationFn: async () => {
            if (mode === 'delete') {
                await deleteFolder(folder.id);
            } else {
                await restoreFolder(folder.id);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['library'] }).catch(() => null);
            toast({
                title: mode === 'delete' ? 'Pasta enviada para a lixeira' : 'Pasta restaurada',
                variant: 'success',
            });
            onOpenChange(false);
        },
        onError: () => {
            toast({ title: 'Ação não concluída', variant: 'destructive' });
        },
    });

    const title = mode === 'delete' ? 'Excluir pasta' : 'Restaurar pasta';
    const description =
        mode === 'delete'
            ? 'A pasta será removida (com possibilidade de restauração). Deseja continuar?'
            : 'A pasta voltará a ficar visível na biblioteca.';
    const actionLabel = mode === 'delete' ? 'Excluir' : 'Restaurar';

    return (
        <Dialog open={open} onOpenChange={(state) => !mutation.isPending && onOpenChange(state)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
                        Cancelar
                    </Button>
                    <Button
                        variant={mode === 'delete' ? 'destructive' : 'default'}
                        onClick={() => mutation.mutate()}
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? 'Processando…' : actionLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
