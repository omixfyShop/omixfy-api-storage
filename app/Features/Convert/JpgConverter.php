<?php

declare(strict_types=1);

namespace App\Features\Convert;

use Illuminate\Filesystem\FilesystemAdapter;
use Intervention\Image\Image as InterventionImage;
use Intervention\Image\ImageManagerStatic as Image;

final class JpgConverter extends CachedImageDerivative
{
    private const DERIVED_SUFFIX = 'jpg';

    private readonly int $quality;

    private readonly string $background;

    public function __construct(FilesystemAdapter $disk)
    {
        parent::__construct($disk);

        $this->quality = (int) config('assetsme.jpg_quality', 90);
        $this->background = (string) config('assetsme.jpg_background', '#ffffff');
    }

    protected function derivedSuffix(): string
    {
        return self::DERIVED_SUFFIX;
    }

    protected function encodeQuality(): int
    {
        return $this->quality;
    }

    /**
     * Source already usable as-is by marketplaces that reject WebP/AVIF.
     */
    protected function isPassthrough(string $sourcePath): bool
    {
        $extension = strtolower(pathinfo($sourcePath, PATHINFO_EXTENSION));

        return in_array($extension, ['jpg', 'jpeg'], true);
    }

    /**
     * Flatten any transparency over a solid background so the JPEG result is
     * marketplace-safe.
     */
    protected function transform(InterventionImage $image): InterventionImage
    {
        $canvas = Image::canvas($image->width(), $image->height(), $this->background);
        $canvas->insert($image, 'top-left', 0, 0);

        return $canvas;
    }
}
