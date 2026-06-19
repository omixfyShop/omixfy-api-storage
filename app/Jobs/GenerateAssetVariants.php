<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Features\Convert\GeneratedVariant;
use App\Features\Convert\ImageResize;
use App\Features\Convert\VariantSize;
use App\Models\Asset;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

final class GenerateAssetVariants implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  array<string, VariantSize>  $variants
     */
    public function __construct(
        public readonly int $assetId,
        public readonly array $variants,
    ) {
    }

    public function handle(): void
    {
        $asset = Asset::find($this->assetId);

        if ($asset === null) {
            Log::warning('assets:variants-asset-missing', ['asset_id' => $this->assetId]);

            return;
        }

        $disk = Storage::disk(config('assetsme.disk', 'assets'));
        $resize = new ImageResize($disk);
        $fileName = basename($asset->path);

        try {
            $generated = $resize->generateVariants($asset->path, $asset->folder, $fileName, $this->variants);

            if ($generated !== []) {
                $asset->generated_thumbs = array_map(
                    static fn (GeneratedVariant $variant): array => $variant->toArray(),
                    $generated,
                );
                $asset->save();
            }

            Log::info('assets:variants-generated', [
                'asset_id' => $asset->id,
                'count' => count($generated),
            ]);
        } catch (Throwable $exception) {
            Log::error('assets:variants-failed', [
                'asset_id' => $asset->id,
                'error' => $exception->getMessage(),
            ]);

            throw $exception;
        }
    }
}
