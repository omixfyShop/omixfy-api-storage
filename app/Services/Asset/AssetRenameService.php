<?php

namespace App\Services\Asset;

use App\Models\Asset;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AssetRenameService
{
    public function __construct(
        private readonly AssetService $assetService,
    ) {
    }

    public function handle(Request $request, string $validatedPath, string $newName): JsonResponse
    {
        $path = $this->assetService->normalizePath($validatedPath);

        if ($path === null) {
            return $this->assetService->validationErrorResponse(['path' => ['The path provided is invalid.']]);
        }

        $asset = Asset::query()->where('path', $path)->first();

        if (! $asset) {
            return new JsonResponse(['message' => 'Asset not found.'], Response::HTTP_NOT_FOUND);
        }

        $disk = $this->assetService->disk();
        $oldPath = $asset->path;
        $oldDir = dirname($oldPath);
        $oldBaseName = pathinfo(basename($oldPath), PATHINFO_FILENAME);
        $extension = pathinfo(basename($oldPath), PATHINFO_EXTENSION);

        $newName = trim($newName);
        $newFileName = $extension ? "{$newName}.{$extension}" : $newName;
        $newPath = $oldDir !== '.' ? "{$oldDir}/{$newFileName}" : $newFileName;

        if ($disk->exists($newPath) && $newPath !== $oldPath) {
            $datetime = now()->format('YmdHis');
            $newFileName = $extension ? "{$newName}-{$datetime}.{$extension}" : "{$newName}-{$datetime}";
            $newPath = $oldDir !== '.' ? "{$oldDir}/{$newFileName}" : $newFileName;
        }

        try {
            $disk->move($oldPath, $newPath);

            $updatedThumbs = $this->renameThumbnails($asset, $oldBaseName, $newName, $disk);

            $asset->path = $newPath;
            if (! empty($updatedThumbs)) {
                $asset->generated_thumbs = $updatedThumbs;
            }
            $asset->save();

            return new JsonResponse([
                'id' => $asset->id,
                'path' => $asset->path,
                'url' => $disk->url($asset->path),
                'generated_thumbs' => $asset->generated_thumbs ?? [],
            ], Response::HTTP_OK);
        } catch (\Throwable $exception) {
            return new JsonResponse([
                'message' => 'Failed to rename asset.',
                'error' => $exception->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    private function renameThumbnails(Asset $asset, string $oldBaseName, string $newName, FilesystemAdapter $disk): array
    {
        $updatedThumbs = [];

        if (! $asset->generated_thumbs || ! is_array($asset->generated_thumbs)) {
            return $updatedThumbs;
        }

        foreach ($asset->generated_thumbs as $thumbKey => $thumbData) {
            if (! isset($thumbData['path'])) {
                $updatedThumbs[$thumbKey] = $thumbData;
                continue;
            }

            $oldThumbPath = $thumbData['path'];
            $thumbDir = dirname($oldThumbPath);
            $oldThumbBaseName = pathinfo(basename($oldThumbPath), PATHINFO_FILENAME);
            $thumbExtension = pathinfo(basename($oldThumbPath), PATHINFO_EXTENSION);

            $newThumbBaseName = $this->resolveThumbBaseName($oldThumbBaseName, $oldBaseName, $newName);

            $newThumbFileName = $thumbExtension ? "{$newThumbBaseName}.{$thumbExtension}" : $newThumbBaseName;
            $newThumbPath = $thumbDir !== '.' ? "{$thumbDir}/{$newThumbFileName}" : $newThumbFileName;

            if ($disk->exists($oldThumbPath)) {
                $disk->move($oldThumbPath, $newThumbPath);
            }

            $updatedThumbs[$thumbKey] = array_merge($thumbData, [
                'path' => $newThumbPath,
                'url' => $disk->url($newThumbPath),
            ]);
        }

        return $updatedThumbs;
    }

    private function resolveThumbBaseName(string $oldThumbBaseName, string $oldBaseName, string $newName): string
    {
        if (str_contains($oldThumbBaseName, '--')) {
            $parts = explode('--', $oldThumbBaseName, 2);
            $variantSuffix = $parts[1] ?? '';

            return "{$newName}--{$variantSuffix}";
        }

        if (preg_match('/^' . preg_quote($oldBaseName, '/') . '_(\d+)$/', $oldThumbBaseName, $matches)) {
            return "{$newName}_{$matches[1]}";
        }

        if (str_starts_with($oldThumbBaseName, $oldBaseName)) {
            $suffix = substr($oldThumbBaseName, strlen($oldBaseName));

            return "{$newName}{$suffix}";
        }

        return $newName;
    }
}
