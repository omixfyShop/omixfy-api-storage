<?php

namespace App\Services\Asset;

use App\Models\Asset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class AssetDeleteService
{
    public function __construct(
        private readonly AssetService $assetService,
    ) {
    }

    public function handle(Request $request, string $validatedPath): JsonResponse
    {
        $path = $this->assetService->normalizePath($validatedPath);

        if ($path === null) {
            return $this->assetService->validationErrorResponse(['path' => ['The path provided is invalid.']]);
        }

        $userId = $this->assetService->getUserId($request);
        if (! $userId) {
            return response()->json(['message' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $asset = Asset::query()->where('path', $path)->first();

        if (! $asset) {
            return new JsonResponse(['message' => 'Asset not found.'], Response::HTTP_NOT_FOUND);
        }

        if ($asset->owner_id !== $userId) {
            return new JsonResponse(['message' => 'Forbidden.'], Response::HTTP_FORBIDDEN);
        }

        $disk = $this->assetService->disk();

        try {
            $pathsToDelete = $this->collectDeletablePaths($asset);

            foreach ($pathsToDelete as $pathToDelete) {
                if ($disk->exists($pathToDelete)) {
                    $disk->delete($pathToDelete);
                }
            }

            $asset->delete();

            return new JsonResponse(['deleted' => true]);
        } catch (\Throwable $exception) {
            Log::error('Failed to delete asset', [
                'path' => $path,
                'asset_id' => $asset->id ?? null,
                'error' => $exception->getMessage(),
                'trace' => $exception->getTraceAsString(),
            ]);

            return new JsonResponse([
                'message' => 'Failed to delete asset.',
                'error' => config('app.debug') ? $exception->getMessage() : 'Server Error',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * @return string[]
     */
    private function collectDeletablePaths(Asset $asset): array
    {
        $paths = [$asset->path];
        $generatedThumbs = $asset->generated_thumbs ?? [];

        if (is_array($generatedThumbs)) {
            foreach ($generatedThumbs as $thumb) {
                if (is_array($thumb) && isset($thumb['path'])) {
                    $paths[] = $thumb['path'];
                }
            }
        }

        return array_values(array_filter(array_unique($paths), fn ($p) => $p !== null && $p !== ''));
    }
}
