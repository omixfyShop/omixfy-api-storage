import { listFolders, moveFolder } from '@/api/library';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { LibraryFolder } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

interface MoveFolderDialogProps {
    folder: LibraryFolder;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function MoveFolderDialog({ folder, open, onOpenChange }: MoveFolderDialogProps) {
    const [selected, setSelected] = useState<string>('root');
    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    const queryClient = useQueryClient();
    const { toast } = useToast();

    useEffect(() => {
        const timeout = window.setTimeout(() => setDebounced(search), 300);
        return () => window.clearTimeout(timeout);
    }, [search]);

    useEffect(() => {
        if (open) {
            setSelected('root');
            setSearch('');
            setDebounced('');
        }
    }, [open]);

    const optionsQuery = useQuery({
        queryKey: ['library', 'move-options', { search: debounced }],
        queryFn: () => listFolders({ q: debounced || undefined, per_page: 100 }),
        enabled: open,
    });

    const options = useMemo(() => {
        if (!optionsQuery.data) {
            return [];
        }

        return optionsQuery.data.data.filter((candidate) => candidate.id !== folder.id);
    }, [optionsQuery.data, folder.id]);

    const mutation = useMutation({
        mutationFn: async () => {
            const parentId = selected === 'root' ? null : Number(selected);
            const payload = await moveFolder(folder.id, { parent_id: parentId });
            return payload.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['library'] }).catch(() => null);
            toast({ title: 'Pasta movida', variant: 'success' });
            onOpenChange(false);
        },
        onError: () => {
            toast({ title: 'Não foi possível mover a pasta', variant: 'destructive' });
        },
    });

    return (
        <Dialog open={open} onOpenChange={(state) => !mutation.isPending && onOpenChange(state)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Mover pasta</DialogTitle>
                    <DialogDescription>Escolha o novo local onde “{folder.name}” ficará.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label htmlFor="search-folder">Buscar</Label>
                        <Input
                            id="search-folder"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Digite para localizar pastas"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="target-folder">Destino</Label>
                        <Select value={selected} onValueChange={setSelected}>
                            <SelectTrigger id="target-folder" className="w-full">
                                <SelectValue placeholder="Selecione a pasta" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="root">Biblioteca (raiz)</SelectItem>
                                {options.map((option) => (
                                    <SelectItem key={option.id} value={String(option.id)}>
                                        {option.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
                        Cancelar
                    </Button>
                    <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                        {mutation.isPending ? 'Movendo…' : 'Mover'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
