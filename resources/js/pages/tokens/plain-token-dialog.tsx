import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Copy } from 'lucide-react';

type PlainTokenDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    generatedToken: string | null;
    copiedToken: string | null;
    onCopy: () => void;
};

export function PlainTokenDialog({
    open,
    onOpenChange,
    generatedToken,
    copiedToken,
    onCopy,
}: PlainTokenDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Token criado</DialogTitle>
                    <DialogDescription>
                        Guarde este token — ele não será exibido
                        novamente.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <code className="block rounded-md bg-muted px-3 py-2 text-sm break-all">
                        {generatedToken ?? '—'}
                    </code>

                    <div className="flex items-center justify-between gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCopy}
                            className="flex-1"
                        >
                            <Copy className="mr-2 size-4" />
                            Copiar
                        </Button>
                        {copiedToken &&
                            copiedToken === generatedToken && (
                                <span className="text-sm text-green-600">
                                    Copiado!
                                </span>
                            )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        onClick={() => onOpenChange(false)}
                    >
                        Fechar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
