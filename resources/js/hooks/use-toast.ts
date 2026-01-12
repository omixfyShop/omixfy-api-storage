import { useToastContext } from '@/contexts/toast-context';

export function useToast() {
    const { toast } = useToastContext();
    return { toast } as const;
}
