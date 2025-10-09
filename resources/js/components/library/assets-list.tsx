import type { LibraryAsset } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Image, Star, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { toggleAssetPreview } from '@/api/library';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const root = (import.meta.env.VITE_API_URL as string | undefined) ?? window.location.origin;
const assetsBase = `${root}/assets/`;

interface AssetsListProps {
    assets: LibraryAsset[];
    folderId?: number | null;
    previewAssetIds?: number[];
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
            className="h-[200px] w-full rounded-lg object-contain mx-auto"
            onError={() => setImageError(true)}
        />
    );
}

export function AssetsList({ assets, folderId, previewAssetIds = [] }: AssetsListProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const togglePreviewMutation = useMutation({
        mutationFn: async ({ assetId }: { assetId: number }) => {
            if (!folderId) {
                throw new Error('Folder ID is required');
            }
            return toggleAssetPreview(folderId, assetId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['library'] });
            toast({
                title: 'Preview atualizado',
                description: 'O preview da pasta foi atualizado com sucesso.',
                variant: 'success',
            });
        },
        onError: () => {
            toast({
                title: 'Erro',
                description: 'Não foi possível atualizar o preview.',
                variant: 'destructive',
            });
        },
    });

    if (!assets.length) {
        return null;
    }

    const handleTogglePreview = (assetId: number) => {
        togglePreviewMutation.mutate({ assetId });
    };

    return (
        <div className="mt-6 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Arquivos</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {assets.map((asset) => {
                    const isPreview = previewAssetIds.includes(asset.id);
                    const isImage = asset.mime.startsWith('image');
                    
                    return (
                        <Card key={asset.id} className={`border border-dashed border-border/70 bg-background/50 ${isPreview ? 'ring-2 ring-primary/50' : ''}`}>
                            <div className="p-4 relative">
                                <ImagePreview asset={asset} />
                                {folderId && isImage && (
                                    <button
                                        onClick={() => handleTogglePreview(asset.id)}
                                        disabled={togglePreviewMutation.isPending}
                                        className={`absolute top-6 right-6 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
                                            isPreview 
                                                ? 'bg-primary text-primary-foreground shadow-md' 
                                                : 'bg-muted/80 text-muted-foreground hover:bg-muted'
                                        }`}
                                        title={isPreview ? 'Remover do preview' : 'Usar como preview'}
                                    >
                                        <Star className={`h-3 w-3 ${isPreview ? 'fill-current' : ''}`} />
                                        {isPreview && 'Preview'}
                                    </button>
                                )}
                            </div>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="line-clamp-1 text-sm font-medium" title={asset.path}>
                                    {asset.path.split('/').pop()}
                                </CardTitle>
                                <Badge variant="outline">{asset.mime.split('/')[0]}</Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <ExternalLink className="h-4 w-4" />
                                        <a href={`${assetsBase}${asset.path}`} target="_blank" rel="noreferrer">
                                            <span>{asset.path}</span>
                                        </a>
                                    </div>
                                    <span>{formatBytes(asset.size_bytes)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
