<?php

declare(strict_types=1);

namespace App\Features\Convert;

use InvalidArgumentException;

final class ImageDerivativeSpecResolver
{
    private const SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];

    private readonly string $defaultFormat;

    private readonly int $defaultQuality;

    private readonly string $defaultBackground;

    private readonly float $defaultFill;

    private readonly int $trimTolerance;

    private readonly int $maxSize;

    public function __construct()
    {
        $this->defaultFormat = (string) config('assetsme.derivative_default_format', 'jpg');
        $this->defaultQuality = (int) config('assetsme.derivative_default_quality', 90);
        $this->defaultBackground = (string) config('assetsme.derivative_default_background', 'ffffff');
        $this->defaultFill = (float) config('assetsme.derivative_default_fill', 0.92);
        $this->trimTolerance = (int) config('assetsme.derivative_trim_tolerance', 18);
        $this->maxSize = (int) config('assetsme.derivative_max_size', 4000);
    }

    /**
     * @param  array<string, mixed>  $params
     */
    public function resolve(array $params): ImageDerivativeSpec
    {
        $format = $this->resolveFormat($params['format'] ?? null);

        return new ImageDerivativeSpec(
            format: $format,
            size: $this->resolveSize($params['size'] ?? null),
            fill: $this->resolveFill($params['fill'] ?? null),
            background: $this->resolveBackground($params['bg'] ?? null),
            square: $this->resolveSquare($params['square'] ?? null),
            quality: $this->defaultQuality,
            trimTolerance: $this->trimTolerance,
        );
    }

    private function resolveFormat(mixed $value): string
    {
        $format = strtolower(trim((string) ($value ?? '')));

        if ($format === '') {
            $format = strtolower($this->defaultFormat);
        }

        if (! in_array($format, self::SUPPORTED_FORMATS, true)) {
            throw new InvalidArgumentException(sprintf('The format must be one of: %s.', implode(', ', self::SUPPORTED_FORMATS)));
        }

        return $format;
    }

    private function resolveSize(mixed $value): int
    {
        if ($value === null || trim((string) $value) === '') {
            return 0;
        }

        if (! preg_match('/^\d+$/', (string) $value)) {
            throw new InvalidArgumentException('The size must be a non-negative integer.');
        }

        $size = (int) $value;

        if ($size > $this->maxSize) {
            throw new InvalidArgumentException(sprintf('The size exceeds the maximum of %d.', $this->maxSize));
        }

        return $size;
    }

    private function resolveFill(mixed $value): float
    {
        if ($value === null || trim((string) $value) === '') {
            return $this->defaultFill;
        }

        if (! is_numeric($value)) {
            throw new InvalidArgumentException('The fill must be a number between 0 and 1.');
        }

        $fill = (float) $value;

        if ($fill <= 0.0) {
            return $this->defaultFill;
        }

        if ($fill > 1.0) {
            throw new InvalidArgumentException('The fill must be at most 1.');
        }

        return $fill;
    }

    private function resolveBackground(mixed $value): string
    {
        $background = ltrim(trim((string) ($value ?? '')), '#');

        if ($background === '') {
            return ltrim($this->defaultBackground, '#');
        }

        if (! preg_match('/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/', $background)) {
            throw new InvalidArgumentException('The bg must be a 3 or 6 digit hex color without "#".');
        }

        return strtolower($background);
    }

    private function resolveSquare(mixed $value): bool
    {
        if ($value === null || trim((string) $value) === '') {
            return true;
        }

        $normalized = strtolower(trim((string) $value));

        if (in_array($normalized, ['1', 'true', 'on'], true)) {
            return true;
        }

        if (in_array($normalized, ['0', 'false', 'off'], true)) {
            return false;
        }

        throw new InvalidArgumentException('The square must be 1 or 0.');
    }
}
