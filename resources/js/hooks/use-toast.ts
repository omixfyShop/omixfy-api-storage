interface ToastOptions {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive' | 'success';
}

export function useToast() {
    function toast({ title, description, variant = 'default' }: ToastOptions) {
        const prefix = variant === 'destructive' ? 'Erro' : variant === 'success' ? 'Sucesso' : 'Info';
        // eslint-disable-next-line no-alert
        window.setTimeout(() => window.alert(`${prefix}: ${title}${description ? `\n${description}` : ''}`), 0);
    }

    return { toast } as const;
}
