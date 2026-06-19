<?php

namespace App\Services\Asset;

use App\Features\Convert\CachedImageDerivative;
use App\Features\Convert\JpgConverter;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Log;

class AssetJpgService extends AssetDerivativeService
{
    protected function converter(FilesystemAdapter $disk): CachedImageDerivative
    {
        return new JpgConverter($disk);
    }

    protected function failureMessage(): string
    {
        return 'Failed to convert image to JPEG.';
    }

    protected function logFailure(string $path, string $error): void
    {
        Log::error('Falha ao gerar derivada JPEG', [
            'path' => $path,
            'error' => $error,
        ]);
    }

    protected function successPayload(string $sourcePath, string $resultPath): array
    {
        $converted = $resultPath !== $sourcePath;

        Log::info('Derivada JPEG resolvida', [
            'source_path' => $sourcePath,
            'result_path' => $resultPath,
            'converted' => $converted,
        ]);

        return [
            'source_path' => $sourcePath,
            'path' => $resultPath,
            'url' => $this->assetService->publicUrl($resultPath),
            'converted' => $converted,
        ];
    }
}
