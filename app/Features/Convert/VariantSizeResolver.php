<?php

declare(strict_types=1);

namespace App\Features\Convert;

use InvalidArgumentException;

final class VariantSizeResolver
{
    private readonly array $variantDefaults;

    private readonly int $maxWidth;

    private readonly int $maxHeight;

    public function __construct()
    {
        $this->variantDefaults = (array) config('assetsme.variants', []);
        $this->maxWidth = (int) config('assetsme.max_width', 4000);
        $this->maxHeight = (int) config('assetsme.max_height', 4000);
    }

    /**
     * Resolve the dimensions for a requested variant based on the query string.
     */
    public function resolve(?string $param, VariantKey $key): ?VariantSize
    {
        if ($param === null) {
            return null;
        }

        $param = trim($param);

        if ($param === '') {
            return null;
        }

        $normalized = strtolower($param);

        if (in_array($normalized, ['0', 'false', 'off'], true)) {
            return null;
        }

        if ($normalized === '1') {
            return $this->defaultSize($key);
        }

        return $this->parseExplicitSize($param, $key);
    }

    private function defaultSize(VariantKey $key): VariantSize
    {
        $defaults = $this->variantDefaults[$key->value] ?? null;

        if (! is_array($defaults) || ! isset($defaults['width'], $defaults['height'])) {
            throw new InvalidArgumentException(sprintf('The %s variant is not configured.', $key->value));
        }

        return new VariantSize((int) $defaults['width'], (int) $defaults['height']);
    }

    private function parseExplicitSize(string $param, VariantKey $key): VariantSize
    {
        if (! preg_match('/^(\d+)x(\d+)$/i', $param, $matches)) {
            throw new InvalidArgumentException(sprintf('The %s parameter must be "1" or in the format WIDTHxHEIGHT.', $key->value));
        }

        $width = (int) $matches[1];
        $height = (int) $matches[2];

        if ($width < 1 || $height < 1) {
            throw new InvalidArgumentException(sprintf('The %s parameter must define width and height greater than zero.', $key->value));
        }

        if ($width > $this->maxWidth || $height > $this->maxHeight) {
            throw new InvalidArgumentException(sprintf('The %s parameter exceeds the maximum dimensions of %dx%d.', $key->value, $this->maxWidth, $this->maxHeight));
        }

        return new VariantSize($width, $height);
    }
}
