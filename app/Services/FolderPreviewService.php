<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\Folder;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class FolderPreviewService
{
    public function __construct(
        private readonly ?Filesystem $disk = null,
    ) {
    }

    public function ensurePreviewAssets(Folder $folder, int $limit): Collection
    {
        $assets = $this->collectPreviewCandidates($folder, $limit);

        $size = (int) config('library.preview_thumb_size', 512);
        $quality = (int) config('library.preview_thumb_quality', 80);

        return $assets->map(function (Asset $asset) use ($size, $quality) {
            $thumbKey = sprintf('webp_%dx%d', $size, $size);
            $thumbs = collect($asset->generated_thumbs ?? []);

            if (!$thumbs->has($thumbKey)) {
                try {
                    $thumbPath = $this->generateThumbnail($asset, $size, $quality);
                    $thumbs->put($thumbKey, [
                        'path' => $thumbPath,
                        'width' => $size,
                        'height' => $size,
                        'quality' => $quality,
                        'format' => 'webp',
                    ]);
                    $asset->generated_thumbs = $thumbs->toArray();
                    $asset->saveQuietly();
                } catch (\Throwable $exception) {
                    Log::warning('Failed to generate folder preview thumbnail', [
                        'asset_id' => $asset->id,
                        'error' => $exception->getMessage(),
                    ]);
                }
            }
            $asset->setRelation('preview_thumb', $thumbs->get($thumbKey));

            return $asset;
        });
    }

    protected function collectPreviewCandidates(Folder $folder, int $limit): Collection
    {
        $query = $folder->assets()
            ->where('mime', 'like', 'image/%')
            ->latest();

        $primary = $query->take($limit)->get();

        if ($primary->count() >= $limit) {
            return $primary->take($limit);
        }

        $remaining = $limit - $primary->count();

        $fallbackAssets = Asset::query()
            ->whereIn('folder_id', $folder->children()->pluck('id'))
            ->where('mime', 'like', 'image/%')
            ->latest()
            ->take($remaining)
            ->get();

        return $primary->concat($fallbackAssets)->take($limit);
    }

    protected function generateThumbnail(Asset $asset, int $size, int $quality): string
    {
        $disk = $this->disk ?? Storage::disk(config('filesystems.default'));
        $sourcePath = $asset->path;

        if (!$disk->exists($sourcePath)) {
            throw new \RuntimeException('Asset source not found for thumbnail generation.');
        }

        $thumbDirectory = 'thumbnails/'.ltrim(dirname($sourcePath), '.');
        $thumbFilename = pathinfo($sourcePath, PATHINFO_FILENAME)."_{$size}.webp";
        $thumbPath = trim($thumbDirectory.'/'.$thumbFilename, '/');

        $disk->put($thumbPath, $disk->get($sourcePath));

        return $thumbPath;
    }
}
