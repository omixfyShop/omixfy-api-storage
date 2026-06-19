<?php

declare(strict_types=1);

namespace App\Features\Convert;

final readonly class ImageDerivativeSpec
{
    public function __construct(
        public string $format,
        public int $size,
        public float $fill,
        public string $background,
        public bool $square,
        public int $quality,
        public int $trimTolerance,
    ) {
    }

    public function isFormatOnly(): bool
    {
        return $this->size <= 0;
    }

    /**
     * Deterministic cache suffix. Includes every parameter that changes the
     * rendered bytes so distinct specs never collide in the cache.
     */
    public function cacheSuffix(): string
    {
        if ($this->isFormatOnly()) {
            return $this->format;
        }

        $fill = (int) round($this->fill * 100);

        return sprintf(
            'd%df%dq%d%sb%s',
            $this->size,
            $fill,
            $this->quality,
            $this->square ? 's' : 'r',
            $this->background,
        );
    }
}
