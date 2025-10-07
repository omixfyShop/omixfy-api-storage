import { createFolder } from '@/api/library';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { LibraryFolder } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface CreateFolderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    parentId: number | null;
}

export function CreateFolderDialog({ open, onOpenChange, parentId }: CreateFolderDialogProps) {
    const [name, setName] = useState('');
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const mutation = useMutation({
        mutationFn: async () => {
            const payload = await createFolder({ name, parent_id: parentId });
            return payload.data;
        },
        onSuccess: (folder: LibraryFolder) => {
            queryClient.invalidateQueries({ queryKey: ['library'] }).catch(() => null);
            toast({ title: 'Pasta criada', description: `“${folder.name}” adicionada com sucesso.`, variant: 'success' });
            setName('');
            onOpenChange(false);
        },
        onError: (error: unknown) => {
            console.error(error);
            toast({ title: 'Não foi possível criar a pasta', variant: 'destructive' });
        },
    });

    return (
        <Dialog open={open} onOpenChange={(state) => !mutation.isPending && onOpenChange(state)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nova pasta</DialogTitle>
                    <DialogDescription>Informe o nome da pasta que será criada neste nível.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="folder-name">Nome</Label>
                    <Input
                        id="folder-name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Campanhas 2025"
                        autoFocus
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
                        Cancelar
                    </Button>
                    <Button onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending}>
                        {mutation.isPending ? 'Criando…' : 'Criar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
