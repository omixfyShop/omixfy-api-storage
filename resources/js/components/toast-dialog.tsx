import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircleIcon, CheckCircle2Icon, InfoIcon } from 'lucide-react';
import { useToastContext } from '@/contexts/toast-context';
import { cn } from '@/lib/utils';

export function ToastDialog() {
    const { currentToast, closeToast } = useToastContext();

    if (!currentToast) {
        return null;
    }

    const getIcon = () => {
        switch (currentToast.variant) {
            case 'destructive':
                return <AlertCircleIcon className="h-5 w-5 text-destructive" />;
            case 'success':
                return <CheckCircle2Icon className="h-5 w-5 text-green-600 dark:text-green-400" />;
            default:
                return <InfoIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
        }
    };

    const getVariantStyles = () => {
        switch (currentToast.variant) {
            case 'destructive':
                return 'border-destructive';
            case 'success':
                return 'border-green-600 dark:border-green-400';
            default:
                return '';
        }
    };

    return (
        <Dialog open={!!currentToast} onOpenChange={closeToast}>
            <DialogContent className={cn('sm:max-w-md', getVariantStyles())}>
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        {getIcon()}
                        <DialogTitle>{currentToast.title}</DialogTitle>
                    </div>
                    {currentToast.description && (
                        <DialogDescription className="pt-2">
                            {currentToast.description}
                        </DialogDescription>
                    )}
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}
