<?php

namespace App\Services\Asset;

use App\Models\Folder;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AssetService
{
    public function disk(): FilesystemAdapter
    {
        return Storage::disk(config('assetsme.disk', 'assets'));
    }

    public function publicUrl(string $path): string
    {
        $url = $this->disk()->url($path);

        return preg_replace('#(?<!:)//+#', '/', $url) ?? $url;
    }

    public function getUserId(Request $request): ?int
    {
        return $request->user()?->id ?? $request->attributes->get('token_user_id');
    }

    public function normalizeFolder(?string $folder): ?string
    {
        if ($folder === null) {
            return null;
        }

        $folder = trim($folder);
        $folder = trim($folder, '/');

        return $folder === '' ? null : $folder;
    }

    public function normalizePath(string $path): ?string
    {
        $normalized = trim($path);
        $normalized = ltrim($normalized, '/');

        if ($normalized === '' || str_contains($normalized, '..')) {
            return null;
        }

        return $normalized;
    }

    public function isForbiddenMime(string $mime): bool
    {
        return str_contains($mime, 'php') || str_starts_with($mime, 'text/x-php');
    }

    public function extensionFromMime(string $mime): ?string
    {
        $map = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            'image/avif' => 'avif',
            'image/svg+xml' => 'svg',
            'application/pdf' => 'pdf',
            'text/plain' => 'txt',
        ];

        return $map[$mime] ?? null;
    }

    public function buildFileName(UploadedFile $file, ?string $detectedMime = null): string
    {
        $originalName = $file->getClientOriginalName();
        $baseName = Str::slug(pathinfo($originalName, PATHINFO_FILENAME));

        if ($baseName === '') {
            $baseName = 'asset';
        }

        $extension = strtolower($file->getClientOriginalExtension() ?: '');
        $extension = preg_replace('/[^a-z0-9]/i', '', $extension);

        if ($extension === '') {
            $extension = $this->extensionFromMime($detectedMime ?? $file->getMimeType()) ?? 'bin';
        }

        $timestamp = now()->format('YmdHisv');

        return sprintf('%s-%s.%s', $baseName, $timestamp, $extension);
    }

    public function validationErrorResponse(array $errors, int $status = Response::HTTP_BAD_REQUEST): JsonResponse
    {
        return new JsonResponse([
            'message' => 'Validation failed.',
            'errors' => $errors,
        ], $status);
    }

    public function resolveFolderId(?string $folderPath, int $userId): ?int
    {
        if (! $folderPath || trim($folderPath) === '') {
            return null;
        }

        $folderPath = trim($folderPath, '/');

        if ($folderPath === '') {
            return null;
        }

        $pathParts = explode('/', $folderPath);
        $currentParentId = null;
        $currentFolder = null;

        foreach ($pathParts as $folderName) {
            if (trim($folderName) === '') {
                continue;
            }

            $existingFolder = Folder::where('name', $folderName)
                ->where('parent_id', $currentParentId)
                ->first();

            if ($existingFolder) {
                $currentFolder = $existingFolder;
                $currentParentId = $existingFolder->id;
            } else {
                $currentFolder = Folder::create([
                    'name' => $folderName,
                    'parent_id' => $currentParentId,
                    'owner_id' => $userId,
                    'access_level' => 'private',
                ]);
                $currentParentId = $currentFolder->id;
            }
        }

        return $currentFolder?->id;
    }
}
