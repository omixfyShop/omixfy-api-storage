<?php

declare(strict_types=1);

namespace App\Features\Convert;

use Illuminate\Filesystem\FilesystemAdapter;
use Intervention\Image\Image as InterventionImage;
use Intervention\Image\ImageManagerStatic as Image;

abstract class CachedImageDerivative
{
    public function __construct(protected readonly FilesystemAdapter $disk)
    {
    }

    abstract protected function derivedSuffix(): string;

    abstract protected function outputFormat(): string;

    abstract protected function encodeQuality(): int;

    abstract protected function transform(InterventionImage $image): InterventionImage;

    /**
     * Deterministic cache path for the derivative of the given source.
     */
    public function derivedPath(string $sourcePath): string
    {
        $directory = trim((string) pathinfo($sourcePath, PATHINFO_DIRNAME), '.');
        $name = pathinfo($sourcePath, PATHINFO_FILENAME);
        $derivedName = sprintf('%s--%s.%s', $name, $this->derivedSuffix(), $this->outputFormat());

        $prefix = ($directory !== '' && $directory !== '/') ? $directory.'/' : '';

        return ltrim($prefix.$derivedName, '/');
    }

    /**
     * Ensure the cached derivative of the source exists, keeping the original
     * asset untouched, and return the path to use.
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

        $encoded = $this->buildDerivative($sourcePath);

        $this->disk->put($derivedPath, $encoded);

        return $derivedPath;
    }

    /**
     * Source already usable as-is, skipping derivative generation.
     */
    protected function isPassthrough(string $sourcePath): bool
    {
        return false;
    }

    private function buildDerivative(string $sourcePath): string
    {
        $image = Image::make($this->disk->get($sourcePath));

        try {
            $result = $this->transform($image);

            try {
                return (string) $result->encode($this->outputFormat(), $this->encodeQuality());
            } finally {
                if ($result !== $image) {
                    $result->destroy();
                }
            }
        } finally {
            $image->destroy();
        }
    }
}
