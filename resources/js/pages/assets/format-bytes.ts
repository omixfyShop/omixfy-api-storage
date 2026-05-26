const SIZES = ['B', 'KB', 'MB', 'GB'];

export function formatBytes(bytes: number | undefined | null): string {
    if (!bytes && bytes !== 0) {
        return '—';
    }

    if (bytes === 0) {
        return '0 B';
    }

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${SIZES[i]}`;
}
