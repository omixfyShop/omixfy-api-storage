import { renameFolder } from '@/api/library';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { LibraryFolder } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface RenameFolderDialogProps {
    folder: LibraryFolder;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RenameFolderDialog({ folder, open, onOpenChange }: RenameFolderDialogProps) {
    const [name, setName] = useState(folder.name);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            setName(folder.name);
        }
    }, [open, folder.name]);

    const mutation = useMutation({
        mutationFn: async () => {
            const payload = await renameFolder(folder.id, { name });
            return payload.data;
        },
        onSuccess: (updated: LibraryFolder) => {
            queryClient.invalidateQueries({ queryKey: ['library'] }).catch(() => null);
            toast({ title: 'Pasta renomeada', description: `Novo nome: “${updated.name}”.`, variant: 'success' });
            onOpenChange(false);
        },
        onError: () => {
            toast({ title: 'Não foi possível renomear', variant: 'destructive' });
        },
    });

    return (
        <Dialog open={open} onOpenChange={(state) => !mutation.isPending && onOpenChange(state)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Renomear pasta</DialogTitle>
                    <DialogDescription>Defina um novo nome para esta pasta.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="rename-folder">Nome</Label>
                    <Input
                        id="rename-folder"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        autoFocus
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
                        Cancelar
                    </Button>
                    <Button onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending}>
                        {mutation.isPending ? 'Renomeando…' : 'Salvar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
