export function formatDateTime(value?: string | null): string {
    if (!value) {
        return '—';
    }

    try {
        return new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short',
        }).format(new Date(value));
    } catch (error) {
        console.error(error);
        return value;
    }
}

export function tokenPreview(preview?: string | null): string {
    if (!preview) {
        return '••••';
    }

    return `••••${preview}`;
}
