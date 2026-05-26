import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormEvent } from 'react';

type CreateTokenDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    name: string;
    onNameChange: (value: string) => void;
    processing: boolean;
    error?: string;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function CreateTokenDialog({
    open,
    onOpenChange,
    name,
    onNameChange,
    processing,
    error,
    onSubmit,
}: CreateTokenDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Novo token</DialogTitle>
                    <DialogDescription>
                        Defina um nome para identificar o token
                        (opcional).
                    </DialogDescription>
                </DialogHeader>

                <form
                    className="space-y-4"
                    onSubmit={onSubmit}
                >
                    <div className="space-y-2">
                        <Label htmlFor="token-name">
                            Nome do token
                        </Label>
                        <Input
                            id="token-name"
                            name="name"
                            maxLength={50}
                            value={name}
                            onChange={(event) =>
                                onNameChange(event.currentTarget.value)
                            }
                            placeholder="Ex.: Deploy pipeline"
                        />
                        {error && (
                            <p className="text-sm text-destructive">
                                {error}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Criar token
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
