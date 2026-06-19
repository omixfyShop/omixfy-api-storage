<?php

declare(strict_types=1);

namespace App\Features\Convert;

final readonly class VariantSize
{
    public function __construct(
        public int $width,
        public int $height,
    ) {
    }
}
