<?php

declare(strict_types=1);

namespace App\Features\Convert;

use Illuminate\Filesystem\FilesystemAdapter;
use Intervention\Image\ImageManagerStatic as Image;

final class JpgConverter
{
    private const DERIVED_SUFFIX = 'jpg';

    private readonly int $quality;

    private readonly string $background;

    public function __construct(private readonly FilesystemAdapter $disk)
    {
        $this->quality = (int) config('assetsme.jpg_quality', 90);
        $this->background = (string) config('assetsme.jpg_background', '#ffffff');
    }

    /**
     * Source already usable as-is by marketplaces that reject WebP/AVIF.
     */
    public function isPassthrough(string $sourcePath): bool
    {
        $extension = strtolower(pathinfo($sourcePath, PATHINFO_EXTENSION));

        return in_array($extension, ['jpg', 'jpeg'], true);
    }

    /**
     * Deterministic cache path for the JPEG derivative of the given source.
     */
    public function derivedPath(string $sourcePath): string
    {
        $directory = trim((string) pathinfo($sourcePath, PATHINFO_DIRNAME), '.');
        $name = pathinfo($sourcePath, PATHINFO_FILENAME);
        $derivedName = sprintf('%s--%s.jpg', $name, self::DERIVED_SUFFIX);

        $prefix = ($directory !== '' && $directory !== '/') ? $directory.'/' : '';

        return ltrim($prefix.$derivedName, '/');
    }

    /**
     * Ensure a cached JPEG derivative of the source exists, flattening any
     * transparency over a solid background so the result is marketplace-safe.
     * Keeps the original asset untouched and returns the path to use as JPEG
     * (the source itself when it is already a JPEG).
     */
    public function ensure(string $sourcePath): string
    {
        if ($this->isPassthrough($sourcePath)) {
            return $sourcePath;
        }

        $derivedPath = $this->derivedPath($sourcePath);

        if ($this->disk->exists($derivedPath)) {
            return $derivedPath;
        }

        $image = Image::make($this->disk->get($sourcePath));

        try {
            $canvas = Image::canvas($image->width(), $image->height(), $this->background);
            $canvas->insert($image, 'top-left', 0, 0);

            try {
                $encoded = (string) $canvas->encode('jpg', $this->quality);
            } finally {
                $canvas->destroy();
            }
        } finally {
            $image->destroy();
        }

        $this->disk->put($derivedPath, $encoded);

        return $derivedPath;
    }
}
