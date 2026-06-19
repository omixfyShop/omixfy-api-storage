<?php

namespace App\Services\Asset;

use App\Features\Convert\MlImageAdequator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class AssetMlReadyService
{
    public function __construct(
        private readonly AssetService $assetService,
    ) {
    }

    public function handle(Request $request): JsonResponse
    {
        $path = $this->assetService->normalizePath((string) $request->query('path', ''));

        if ($path === null) {
            return $this->assetService->validationErrorResponse([
                'path' => ['A valid asset path is required.'],
            ], Response::HTTP_BAD_REQUEST);
        }

        $disk = $this->assetService->disk();

        if (! $disk->exists($path)) {
            return new JsonResponse(['message' => 'Source asset not found.'], Response::HTTP_NOT_FOUND);
        }

        try {
            $resultPath = (new MlImageAdequator($disk))->ensure($path);
        } catch (\Throwable $exception) {
            Log::error('Falha ao adequar imagem para o marketplace', [
                'path' => $path,
                'error' => $exception->getMessage(),
            ]);

            return new JsonResponse(['message' => 'Failed to build marketplace-ready image.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        Log::info('Imagem adequada para o marketplace', [
            'source_path' => $path,
            'result_path' => $resultPath,
        ]);

        return new JsonResponse([
            'data' => [
                'source_path' => $path,
                'path' => $resultPath,
                'url' => $this->normalizeUrl($disk->url($resultPath)),
            ],
        ], Response::HTTP_OK);
    }

    private function normalizeUrl(string $url): string
    {
        return preg_replace('#(?<!:)//+#', '/', $url) ?? $url;
    }
}
