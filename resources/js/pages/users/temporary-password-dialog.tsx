import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface TemporaryPasswordDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    temporaryPassword: string | null;
    passwordCopied: boolean;
    onCopy: () => void;
}

export function TemporaryPasswordDialog({
    open,
    onOpenChange,
    temporaryPassword,
    passwordCopied,
    onCopy,
}: TemporaryPasswordDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Senha gerada automaticamente</DialogTitle>
                    <DialogDescription>
                        Copie e compartilhe esta senha com o usuário. Ela não será exibida novamente.
                    </DialogDescription>
                </DialogHeader>
                <div className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 p-4 text-center">
                    <code className="text-lg font-semibold tracking-wide">{temporaryPassword}</code>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Fechar
                    </Button>
                    <Button type="button" onClick={onCopy}>
                        {passwordCopied ? 'Copiado!' : 'Copiar senha'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
