<?php

declare(strict_types=1);

namespace App\Features\Convert;

use Illuminate\Filesystem\FilesystemAdapter;
use Intervention\Image\Image as InterventionImage;
use Intervention\Image\ImageManagerStatic as Image;

final class MlImageAdequator extends CachedImageDerivative
{
    private const DERIVED_SUFFIX = 'mlready';

    private readonly int $canvasSize;

    private readonly float $fillRatio;

    private readonly int $trimTolerance;

    private readonly int $quality;

    private readonly string $background;

    public function __construct(FilesystemAdapter $disk)
    {
        parent::__construct($disk);

        $this->canvasSize = (int) config('assetsme.ml_canvas_size', 1200);
        $this->fillRatio = (float) config('assetsme.ml_fill_ratio', 0.92);
        $this->trimTolerance = (int) config('assetsme.ml_trim_tolerance', 18);
        $this->quality = (int) config('assetsme.ml_quality', 90);
        $this->background = (string) config('assetsme.ml_background', '#ffffff');
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
     * Trim the surrounding (near-white) border, then center the product on a
     * square white canvas so it fills most of the frame, satisfying Mercado
     * Livre's minimum size, square proportion and centered-position requirements.
     */
    protected function transform(InterventionImage $image): InterventionImage
    {
        $image->trim('top-left', null, $this->trimTolerance);

        $inner = (int) round($this->canvasSize * $this->fillRatio);
        $image->resize($inner, $inner, function ($constraint) {
            $constraint->aspectRatio();
        });

        $canvas = Image::canvas($this->canvasSize, $this->canvasSize, $this->background);
        $canvas->insert($image, 'center');

        return $canvas;
    }
}
