<?php

declare(strict_types=1);

namespace App\Features\Convert;

use Illuminate\Filesystem\FilesystemAdapter;
use Intervention\Image\Image as InterventionImage;
use Intervention\Image\ImageManagerStatic as Image;
use RuntimeException;

final class ImageResize
{
    private readonly string $variantFormat;

    private readonly int $variantQuality;

    private readonly int $maxSourcePixels;

    public function __construct(private readonly FilesystemAdapter $disk)
    {
        $this->variantFormat = (string) config('assetsme.variant_format', 'webp');
        $this->variantQuality = (int) config('assetsme.variant_quality', 82);
        $this->maxSourcePixels = (int) config('assetsme.max_source_pixels', 24000000);
    }

    /**
     * Generate every requested variant from the source image, decoding it a single time.
     *
     * @param  array<string, VariantSize>  $variants
     * @return array<string, GeneratedVariant>
     */
    public function generateVariants(string $sourcePath, ?string $folder, string $fileName, array $variants): array
    {
        if ($variants === []) {
            return [];
        }

        $this->guardSourcePixels($sourcePath);

        $image = Image::make($this->disk->get($sourcePath));
        $image->backup();

        $generated = [];

        try {
            foreach ($variants as $key => $size) {
                $variantFileName = $this->buildVariantFilename($fileName, $key);
                $variantPath = ltrim(($folder ? $folder.'/' : '').$variantFileName, '/');

                $image->reset();
                $encoded = $this->resizeAndStore($image, $variantPath, $size->width, $size->height);

                $generated[$key] = new GeneratedVariant(
                    url: $this->disk->url($variantPath),
                    path: $variantPath,
                    width: $image->width(),
                    height: $image->height(),
                    bytes: $encoded,
                    requestedWidth: $size->width,
                    requestedHeight: $size->height,
                );
            }
        } finally {
            $image->destroy();
        }

        return $generated;
    }

    /**
     * Generate and persist a single resized thumbnail encoded as the configured format.
     */
    public function makeThumbnail(string $sourcePath, string $destinationPath, int $width, int $height, ?int $quality = null): ThumbnailResult
    {
        $this->guardSourcePixels($sourcePath);

        $image = Image::make($this->disk->get($sourcePath));

        try {
            $bytes = $this->resizeAndStore($image, $destinationPath, $width, $height, $quality);

            return new ThumbnailResult(
                path: $destinationPath,
                width: $image->width(),
                height: $image->height(),
                bytes: $bytes,
            );
        } finally {
            $image->destroy();
        }
    }

    private function resizeAndStore(InterventionImage $image, string $destinationPath, int $width, int $height, ?int $quality = null): int
    {
        $image->resize($width, $height, function ($constraint) {
            $constraint->aspectRatio();
            $constraint->upsize();
        });

        $encoded = (string) $image->encode($this->variantFormat, $quality ?? $this->variantQuality);

        $this->disk->put($destinationPath, $encoded);

        return strlen($encoded);
    }

    private function buildVariantFilename(string $originalFilename, string $suffix): string
    {
        $name = pathinfo($originalFilename, PATHINFO_FILENAME);

        return sprintf('%s--%s.%s', $name, $suffix, $this->variantFormat);
    }

    private function guardSourcePixels(string $sourcePath): void
    {
        if ($this->maxSourcePixels <= 0) {
            return;
        }

        $dimensions = @getimagesize($this->disk->path($sourcePath));

        if ($dimensions === false) {
            return;
        }

        $pixels = (int) $dimensions[0] * (int) $dimensions[1];

        if ($pixels > $this->maxSourcePixels) {
            throw new RuntimeException(sprintf(
                'Source image of %dx%d pixels exceeds the processing limit of %d pixels.',
                $dimensions[0],
                $dimensions[1],
                $this->maxSourcePixels,
            ));
        }
    }
}
