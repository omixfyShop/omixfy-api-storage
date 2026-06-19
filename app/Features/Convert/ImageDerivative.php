<?php

declare(strict_types=1);

namespace App\Features\Convert;

use Illuminate\Filesystem\FilesystemAdapter;
use Intervention\Image\Image as InterventionImage;
use Intervention\Image\ImageManagerStatic as Image;

final class ImageDerivative extends CachedImageDerivative
{
    public function __construct(
        FilesystemAdapter $disk,
        private readonly ImageDerivativeSpec $spec,
    ) {
        parent::__construct($disk);
    }

    protected function derivedSuffix(): string
    {
        return $this->spec->cacheSuffix();
    }

    protected function outputFormat(): string
    {
        return $this->spec->format;
    }

    protected function encodeQuality(): int
    {
        return $this->spec->quality;
    }

    /**
     * Format-only derivatives leave a source already in the target format as-is.
     */
    protected function isPassthrough(string $sourcePath): bool
    {
        if (! $this->spec->isFormatOnly()) {
            return false;
        }

        $extension = strtolower(pathinfo($sourcePath, PATHINFO_EXTENSION));

        return $this->matchesOutputFormat($extension);
    }

    protected function transform(InterventionImage $image): InterventionImage
    {
        if ($this->spec->isFormatOnly()) {
            return $this->flatten($image);
        }

        return $this->adequate($image);
    }

    private function matchesOutputFormat(string $extension): bool
    {
        $format = strtolower($this->spec->format);

        if ($format === 'jpg' || $format === 'jpeg') {
            return in_array($extension, ['jpg', 'jpeg'], true);
        }

        return $extension === $format;
    }

    private function flatten(InterventionImage $image): InterventionImage
    {
        $canvas = Image::canvas($image->width(), $image->height(), $this->backgroundColor());
        $canvas->insert($image, 'top-left', 0, 0);

        return $canvas;
    }

    private function adequate(InterventionImage $image): InterventionImage
    {
        $image->trim('top-left', null, $this->spec->trimTolerance);

        $inner = (int) round($this->spec->size * $this->spec->fill);
        $image->resize($inner, $inner, function ($constraint) {
            $constraint->aspectRatio();
        });

        if (! $this->spec->square) {
            return $this->flatten($image);
        }

        $canvas = Image::canvas($this->spec->size, $this->spec->size, $this->backgroundColor());
        $canvas->insert($image, 'center');

        return $canvas;
    }

    private function backgroundColor(): string
    {
        return '#'.ltrim($this->spec->background, '#');
    }
}
