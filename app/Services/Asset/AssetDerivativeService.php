<?php

namespace App\Services\Asset;

use App\Features\Convert\ImageDerivative;
use App\Features\Convert\ImageDerivativeSpecResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\Response;

class AssetDerivativeService
{
    public function __construct(
        private readonly AssetService $assetService,
        private readonly ImageDerivativeSpecResolver $specResolver,
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

        try {
            $spec = $this->specResolver->resolve([
                'format' => $request->query('format'),
                'size' => $request->query('size'),
                'fill' => $request->query('fill'),
                'bg' => $request->query('bg'),
                'square' => $request->query('square'),
            ]);
        } catch (InvalidArgumentException $exception) {
            return $this->assetService->validationErrorResponse([
                'derivative' => [$exception->getMessage()],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $disk = $this->assetService->disk();

        if (! $disk->exists($path)) {
            return new JsonResponse(['message' => 'Source asset not found.'], Response::HTTP_NOT_FOUND);
        }

        try {
            $resultPath = (new ImageDerivative($disk, $spec))->ensure($path);
        } catch (\Throwable $exception) {
            Log::error('Falha ao gerar derivada de imagem', [
                'path' => $path,
                'error' => $exception->getMessage(),
            ]);

            return new JsonResponse(['message' => 'Failed to build image derivative.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        Log::info('Derivada de imagem resolvida', [
            'source_path' => $path,
            'result_path' => $resultPath,
        ]);

        return new JsonResponse([
            'data' => [
                'source_path' => $path,
                'path' => $resultPath,
                'url' => $this->assetService->publicUrl($resultPath),
            ],
        ], Response::HTTP_OK);
    }
}
