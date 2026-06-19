<?php

namespace App\Services\Asset;

use App\Features\Convert\CachedImageDerivative;
use App\Features\Convert\MlImageAdequator;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Log;

class AssetMlReadyService extends AssetDerivativeService
{
    protected function converter(FilesystemAdapter $disk): CachedImageDerivative
    {
        return new MlImageAdequator($disk);
    }

    protected function failureMessage(): string
    {
        return 'Failed to build marketplace-ready image.';
    }

    protected function logFailure(string $path, string $error): void
    {
        Log::error('Falha ao adequar imagem para o marketplace', [
            'path' => $path,
            'error' => $error,
        ]);
    }

    protected function successPayload(string $sourcePath, string $resultPath): array
    {
        Log::info('Imagem adequada para o marketplace', [
            'source_path' => $sourcePath,
            'result_path' => $resultPath,
        ]);

        return [
            'source_path' => $sourcePath,
            'path' => $resultPath,
            'url' => $this->assetService->publicUrl($resultPath),
        ];
    }
}
