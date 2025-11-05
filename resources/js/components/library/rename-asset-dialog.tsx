import { renameAsset } from '@/api/library';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { LibraryAsset } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface RenameAssetDialogProps {
    asset: LibraryAsset;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RenameAssetDialog({ asset, open, onOpenChange }: RenameAssetDialogProps) {
    const [name, setName] = useState('');
    const queryClient = useQueryClient();
    const { toast } = useToast();

    useEffect(() => {
        if (open && asset) {
            const currentFileName = asset.path.split('/').pop() || '';
            const lastDotIndex = currentFileName.lastIndexOf('.');
            const fileNameWithoutExt = lastDotIndex > 0 
                ? currentFileName.substring(0, lastDotIndex) 
                : currentFileName;
            setName(fileNameWithoutExt);
        }
    }, [open, asset]);

    const mutation = useMutation({
        mutationFn: async () => {
            return await renameAsset({ path: asset.path, name });
        },
        onSuccess: (updated) => {
            queryClient.invalidateQueries({ queryKey: ['library'] });
            toast({ 
                title: 'Arquivo renomeado', 
                description: `Novo nome: "${updated.path.split('/').pop()}".`, 
                variant: 'success' 
            });
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
                    <DialogTitle>Renomear arquivo</DialogTitle>
                    <DialogDescription>Defina um novo nome para este arquivo.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="rename-asset">Nome</Label>
                    <Input
                        id="rename-asset"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        autoFocus
                        placeholder="nome-do-arquivo"
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
