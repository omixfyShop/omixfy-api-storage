<?php

namespace App\Services\Asset;

use App\Features\Convert\CachedImageDerivative;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

abstract class AssetDerivativeService
{
    public function __construct(
        protected readonly AssetService $assetService,
    ) {
    }

    abstract protected function converter(FilesystemAdapter $disk): CachedImageDerivative;

    abstract protected function failureMessage(): string;

    abstract protected function logFailure(string $path, string $error): void;

    /**
     * @return array<string, mixed>
     */
    abstract protected function successPayload(string $sourcePath, string $resultPath): array;

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
            $resultPath = $this->converter($disk)->ensure($path);
        } catch (\Throwable $exception) {
            $this->logFailure($path, $exception->getMessage());

            return new JsonResponse(['message' => $this->failureMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return new JsonResponse([
            'data' => $this->successPayload($path, $resultPath),
        ], Response::HTTP_OK);
    }
}
