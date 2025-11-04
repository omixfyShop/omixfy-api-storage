<?php

namespace App\Features\Convert;

use Illuminate\Filesystem\FilesystemAdapter;
use Intervention\Image\ImageManagerStatic as Image;
use InvalidArgumentException;

class ImageResize
{
    private array $variantDefaults;

    private int $maxWidth;

    private int $maxHeight;

    public function __construct(private FilesystemAdapter $disk)
    {
        $this->variantDefaults = (array) config('assetsme.variants', []);
        $this->maxWidth = (int) config('assetsme.max_width', 4000);
        $this->maxHeight = (int) config('assetsme.max_height', 4000);
    }

    /**
     * Resolve the dimensions for a requested variant based on the query string.
     */
    public function resolveVariantSize(?string $param, string $key): ?array
    {
        if ($param === null) {
            return null;
        }

        $param = trim((string) $param);
        $normalized = strtolower($param);

        if ($param === '') {
            return null;
        }

        $defaults = $this->variantDefaults[$key] ?? null;

        if (in_array($normalized, ['0', 'false', 'off'], true)) {
            return null;
        }

        if ($normalized === '1') {
            if (! is_array($defaults) || ! isset($defaults['width'], $defaults['height'])) {
                throw new InvalidArgumentException(sprintf('The %s variant is not configured.', $key));
            }

            return [
                'width' => (int) $defaults['width'],
                'height' => (int) $defaults['height'],
            ];
        }

        if (! preg_match('/^(\d+)x(\d+)$/i', $param, $matches)) {
            throw new InvalidArgumentException(sprintf('The %s parameter must be "1" or in the format WIDTHxHEIGHT.', $key));
        }

        $width = (int) $matches[1];
        $height = (int) $matches[2];

        if ($width < 1 || $height < 1) {
            throw new InvalidArgumentException(sprintf('The %s parameter must define width and height greater than zero.', $key));
        }

        if ($width > $this->maxWidth || $height > $this->maxHeight) {
            throw new InvalidArgumentException(sprintf('The %s parameter exceeds the maximum dimensions of %dx%d.', $key, $this->maxWidth, $this->maxHeight));
        }

        return [
            'width' => $width,
            'height' => $height,
        ];
    }

    /**
     * Build the filename for a variant using the original filename and suffix.
     */
    public function buildVariantFilename(string $originalFilename, string $suffix): string
    {
        $name = pathinfo($originalFilename, PATHINFO_FILENAME);
        $extension = pathinfo($originalFilename, PATHINFO_EXTENSION);

        $variantName = sprintf('%s--%s', $name, $suffix);

        if ($extension === '') {
            return $variantName;
        }

        return $variantName.'.'.$extension;
    }

    /**
     * Generate and persist a resized variant of the original image.
     *
     * @return array{width:int,height:int,bytes:int}
     */
    public function makeVariant(string $sourcePath, string $destinationPath, int $width, int $height): array
    {
        $contents = $this->disk->get($sourcePath);
        $image = Image::make($contents)->resize($width, $height, function ($constraint) {
            $constraint->aspectRatio();
            $constraint->upsize();
        });

        $format = strtolower(pathinfo($destinationPath, PATHINFO_EXTENSION));

        $encoded = (string) $image->encode($format ?: null);

        $this->disk->put($destinationPath, $encoded);

        return [
            'width' => $image->width(),
            'height' => $image->height(),
            'bytes' => strlen($encoded),
        ];
    }

    /**
     * Generate each requested variant for the given asset and return their URLs and metadata.
     *
     * @return array{
     *     urls: array<string, string>,
     *     metadata: array<string, array{
     *         url: string,
     *         path: string,
     *         width: int,
     *         height: int,
     *         bytes: int,
     *         requested_width: int,
     *         requested_height: int,
     *     }>
     * }
     */
    public function generateVariantData(string $relativePath, ?string $folder, string $fileName, array $variantDefinitions): array
    {
        $urls = [];
        $metadata = [];

        foreach ($variantDefinitions as $variantKey => $dimensions) {
            if ($dimensions === null) {
                continue;
            }

            $variantFileName = $this->buildVariantFilename($fileName, $variantKey);
            $variantRelativePath = ltrim(($folder ? $folder.'/' : '').$variantFileName, '/');

            $variantProperties = $this->makeVariant($relativePath, $variantRelativePath, $dimensions['width'], $dimensions['height']);

            $variantUrl = $this->disk->url($variantRelativePath);

            $urls[$variantKey] = $variantUrl;
            $metadata[$variantKey] = [
                'url' => $variantUrl,
                'path' => $variantRelativePath,
                'width' => $variantProperties['width'],
                'height' => $variantProperties['height'],
                'bytes' => $variantProperties['bytes'],
                'requested_width' => $dimensions['width'],
                'requested_height' => $dimensions['height'],
            ];
        }

        return [
            'urls' => $urls,
            'metadata' => $metadata,
        ];
    }
}
