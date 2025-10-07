import type { LibraryAsset } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Image, Paperclip } from 'lucide-react';
import { useState } from 'react';

const assetsBase = (import.meta.env.VITE_API_URL as string | undefined) ?? '/assets/';

interface AssetsListProps {
    assets: LibraryAsset[];
}

function formatBytes(bytes: number | null): string {
    if (!bytes) {
        return '—';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, power);

    return `${value.toFixed(power === 0 ? 0 : 1)} ${units[power]}`;
}

function ImagePreview({ asset }: { asset: LibraryAsset }) {
    const [imageError, setImageError] = useState(false);
    
    if (imageError || !asset.mime.startsWith('image')) {
        return (
            <div className="flex h-[200px] w-[200px] items-center justify-center rounded-lg bg-muted">
                <Image className="h-8 w-8 text-muted-foreground" />
            </div>
        );
    }

    return (
        <img
            src={`${assetsBase}${asset.path}`}
            alt={asset.path.split('/').pop()}
            className="h-[200px] w-[200px] rounded-lg object-cover"
            onError={() => setImageError(true)}
        />
    );
}

export function AssetsList({ assets }: AssetsListProps) {
    if (!assets.length) {
        return null;
    }

    return (
        <div className="mt-6 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Arquivos</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {assets.map((asset) => (
                    <Card key={asset.id} className="border border-dashed border-border/70 bg-background/50">
                        <div className="p-4">
                            <ImagePreview asset={asset} />
                        </div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="line-clamp-1 text-sm font-medium" title={asset.path}>
                                {asset.path.split('/').pop()}
                            </CardTitle>
                            <Badge variant="outline">{asset.mime.split('/')[0]}</Badge>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                {asset.mime.startsWith('image') ? (
                                    <Image className="h-4 w-4" />
                                ) : (
                                    <Paperclip className="h-4 w-4" />
                                )}
                                <span>{asset.path}</span>
                            </div>
                            <span>{formatBytes(asset.size_bytes)}</span>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
