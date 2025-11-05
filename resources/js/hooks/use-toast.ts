import { useToastContext } from '@/contexts/toast-context';

interface ToastOptions {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive' | 'success';
}

export function useToast() {
    const { toast } = useToastContext();
    return { toast } as const;
}
