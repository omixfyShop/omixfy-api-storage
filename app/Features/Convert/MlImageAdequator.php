<?php

declare(strict_types=1);

namespace App\Features\Convert;

use Illuminate\Filesystem\FilesystemAdapter;
use Intervention\Image\ImageManagerStatic as Image;

final class MlImageAdequator
{
    private const DERIVED_SUFFIX = 'mlready';

    private readonly int $canvasSize;

    private readonly float $fillRatio;

    private readonly int $trimTolerance;

    private readonly int $quality;

    private readonly string $background;

    public function __construct(private readonly FilesystemAdapter $disk)
    {
        $this->canvasSize = (int) config('assetsme.ml_canvas_size', 1200);
        $this->fillRatio = (float) config('assetsme.ml_fill_ratio', 0.92);
        $this->trimTolerance = (int) config('assetsme.ml_trim_tolerance', 18);
        $this->quality = (int) config('assetsme.ml_quality', 90);
        $this->background = (string) config('assetsme.ml_background', '#ffffff');
    }

    public function derivedPath(string $sourcePath): string
    {
        $directory = trim((string) pathinfo($sourcePath, PATHINFO_DIRNAME), '.');
        $name = pathinfo($sourcePath, PATHINFO_FILENAME);
        $derivedName = sprintf('%s--%s.jpg', $name, self::DERIVED_SUFFIX);

        $prefix = ($directory !== '' && $directory !== '/') ? $directory.'/' : '';

        return ltrim($prefix.$derivedName, '/');
    }

    /**
     * Build a marketplace-ready derivative: trims the surrounding (near-white)
     * border, then centers the product on a square white canvas so it fills
     * most of the frame, satisfying Mercado Livre's minimum size, square
     * proportion and centered-position requirements. Caches the result.
     */
    public function ensure(string $sourcePath): string
    {
        $derivedPath = $this->derivedPath($sourcePath);

        if ($this->disk->exists($derivedPath)) {
            return $derivedPath;
        }

        $image = Image::make($this->disk->get($sourcePath));

        try {
            $image->trim('top-left', null, $this->trimTolerance);

            $inner = (int) round($this->canvasSize * $this->fillRatio);
            $image->resize($inner, $inner, function ($constraint) {
                $constraint->aspectRatio();
            });

            $canvas = Image::canvas($this->canvasSize, $this->canvasSize, $this->background);
            $canvas->insert($image, 'center');

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
