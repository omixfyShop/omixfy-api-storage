<?php

namespace App\Services\Asset;

use App\Features\Convert\JpgConverter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class AssetJpgService
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
            $resultPath = (new JpgConverter($disk))->ensure($path);
        } catch (\Throwable $exception) {
            Log::error('Falha ao gerar derivada JPEG', [
                'path' => $path,
                'error' => $exception->getMessage(),
            ]);

            return new JsonResponse(['message' => 'Failed to convert image to JPEG.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $converted = $resultPath !== $path;

        Log::info('Derivada JPEG resolvida', [
            'source_path' => $path,
            'result_path' => $resultPath,
            'converted' => $converted,
        ]);

        return new JsonResponse([
            'data' => [
                'source_path' => $path,
                'path' => $resultPath,
                'url' => $this->normalizeUrl($disk->url($resultPath)),
                'converted' => $converted,
            ],
        ], Response::HTTP_OK);
    }

    private function normalizeUrl(string $url): string
    {
        return preg_replace('#(?<!:)//+#', '/', $url) ?? $url;
    }
}
