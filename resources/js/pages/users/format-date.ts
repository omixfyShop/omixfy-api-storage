export function formatDate(date: string | null | undefined): string {
    if (!date) {
        return '—';
    }

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }

    return parsed.toLocaleString('pt-BR');
}
