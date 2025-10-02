<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AssetController extends Controller
{
    /**
     * Health check endpoint.
     */
    public function health(): JsonResponse
    {
        return new JsonResponse(['ok' => true], Response::HTTP_OK);
    }

    /**
     * Upload one or more files to the assets storage.
     */
    public function upload(Request $request): JsonResponse
    {
        $maxFileSize = (int) config('assetsme.max_file_size', 10 * 1024 * 1024);
        $maxKilobytes = (int) max(1, (int) ceil($maxFileSize / 1024));

        $validator = Validator::make(
            $request->all(),
            [
                'folder' => ['nullable', 'string', 'regex:/^[a-zA-Z0-9_\\/\-]+$/'],
                'files' => ['required', 'array', 'min:1'],
                'files.*' => ['file', 'max:'.$maxKilobytes],
            ],
            [
                'folder.regex' => 'Folder may only contain letters, numbers, slashes, dashes, and underscores.',
            ],
        );

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors()->toArray());
        }

        $validated = $validator->validated();
        $folder = $this->normalizeFolder($validated['folder'] ?? null);

        $uploadedFiles = $request->file('files', []);
        if (! is_array($uploadedFiles)) {
            $uploadedFiles = [$uploadedFiles];
        }

        $uploadedFiles = array_filter($uploadedFiles, fn ($file) => $file instanceof UploadedFile);

        if ($uploadedFiles === []) {
            return $this->validationErrorResponse(['files' => ['No files were provided.']]);
        }

        $disk = $this->disk();
        $results = [];

        $finfo = new \finfo(FILEINFO_MIME_TYPE);

        $tokenUserId = $request->attributes->get('token_user_id');

        foreach ($uploadedFiles as $file) {
            if (! $file->isValid()) {
                return $this->validationErrorResponse(['files' => ['One or more files are invalid.']]);
            }

            if ($file->getSize() > $maxFileSize) {
                return $this->validationErrorResponse(['files' => ['One or more files exceed the maximum size.']]);
            }

            $detectedMime = $finfo->file($file->getRealPath());

            if ($detectedMime === false) {
                return $this->validationErrorResponse(['files' => ['Unable to detect file MIME type.']]);
            }

            if ($this->isForbiddenMime($detectedMime)) {
                return $this->validationErrorResponse(['files' => ['The provided file type is not allowed.']]);
            }

            $originalName = $file->getClientOriginalName();
            $baseName = Str::slug(pathinfo($originalName, PATHINFO_FILENAME));

            if ($baseName === '') {
                $baseName = 'asset';
            }

            $extension = strtolower($file->getClientOriginalExtension());
            $extension = preg_replace('/[^a-z0-9]/i', '', $extension ?? '') ?: $this->extensionFromMime($detectedMime) ?: 'bin';

            $fileName = $this->uniqueFilename($disk, $folder, $baseName, $extension);
            $relativePath = ltrim(($folder ? $folder.'/' : '').$fileName, '/');

            $storedPath = $disk->putFileAs($folder ?? '', $file, $fileName);

            if ($storedPath === false) {
                return new JsonResponse([
                    'message' => 'Failed to store uploaded file.',
                ], Response::HTTP_INTERNAL_SERVER_ERROR);
            }

            $asset = Asset::create([
                'path' => $relativePath,
                'folder' => $folder,
                'original_name' => $originalName,
                'mime' => $detectedMime,
                'size' => $file->getSize(),
                'checksum' => hash_file('sha256', $file->getRealPath()),
                'uploaded_by' => $request->user()?->id ?? $tokenUserId,
            ]);

            $results[] = [
                'id' => $asset->id,
                'url' => $disk->url($relativePath),
                'path' => $asset->path,
                'folder' => $asset->folder,
                'mime' => $asset->mime,
                'size' => $asset->size,
                'original_name' => $asset->original_name,
                'checksum' => $asset->checksum,
                'created_at' => $asset->created_at,
            ];
        }

        return new JsonResponse(['data' => $results], Response::HTTP_CREATED);
    }

    /**
     * List assets for the provided folder.
     */
    public function list(Request $request): JsonResponse
    {
        $validator = Validator::make(
            $request->all(),
            [
                'folder' => ['nullable', 'string', 'regex:/^[a-zA-Z0-9_\\/\-]+$/'],
                'page' => ['nullable', 'integer', 'min:1'],
                'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            ],
            [
                'folder.regex' => 'Folder may only contain letters, numbers, slashes, dashes, and underscores.',
            ],
        );

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors()->toArray());
        }

        $validated = $validator->validated();
        $folder = $this->normalizeFolder($validated['folder'] ?? null);
        $page = (int) ($validated['page'] ?? 1);
        $perPage = (int) ($validated['per_page'] ?? 25);

        Paginator::currentPageResolver(static fn () => $page);

        $query = Asset::query()->orderByDesc('created_at');

        if ($folder !== null) {
            $query->where('folder', $folder);
        } else {
            $query->where(function ($query) {
                $query->whereNull('folder')->orWhere('folder', '');
            });
        }

        $paginator = $query->simplePaginate($perPage);
        $disk = $this->disk();

        $items = collect($paginator->items())->map(function (Asset $asset) use ($disk) {
            return [
                'id' => $asset->id,
                'path' => $asset->path,
                'folder' => $asset->folder,
                'original_name' => $asset->original_name,
                'mime' => $asset->mime,
                'size' => $asset->size,
                'checksum' => $asset->checksum,
                'uploaded_by' => $asset->uploaded_by,
                'created_at' => $asset->created_at,
                'updated_at' => $asset->updated_at,
                'url' => $disk->url($asset->path),
            ];
        })->values();

        return new JsonResponse([
            'data' => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'next_page_url' => $paginator->nextPageUrl(),
                'prev_page_url' => $paginator->previousPageUrl(),
            ],
        ]);
    }

    /**
     * Delete an asset by path.
     */
    public function delete(Request $request): JsonResponse
    {
        $validator = Validator::make(
            $request->all(),
            [
                'path' => ['required', 'string', 'regex:/^[a-zA-Z0-9_\\.\-/]+$/'],
            ],
            [
                'path.regex' => 'Path may only contain letters, numbers, dots, slashes, dashes, and underscores.',
            ],
        );

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors()->toArray());
        }

        $validated = $validator->validated();
        $path = $this->normalizePath($validated['path']);

        if ($path === null) {
            return $this->validationErrorResponse(['path' => ['The path provided is invalid.']]);
        }

        $asset = Asset::query()->where('path', $path)->first();

        if (! $asset) {
            return new JsonResponse(['message' => 'Asset not found.'], Response::HTTP_NOT_FOUND);
        }

        $disk = $this->disk();
        $disk->delete($asset->path);
        $asset->delete();

        return new JsonResponse(['deleted' => true]);
    }

    /**
     * Normalize a folder string.
     */
    private function normalizeFolder(?string $folder): ?string
    {
        if ($folder === null) {
            return null;
        }

        $folder = trim($folder);
        $folder = trim($folder, '/');

        if ($folder === '') {
            return null;
        }

        return $folder;
    }

    /**
     * Normalize a path and guard against directory traversal.
     */
    private function normalizePath(string $path): ?string
    {
        $normalized = trim($path);
        $normalized = ltrim($normalized, '/');

        if ($normalized === '' || str_contains($normalized, '..')) {
            return null;
        }

        return $normalized;
    }

    /**
     * Determine if the provided MIME type is disallowed.
     */
    private function isForbiddenMime(string $mime): bool
    {
        return str_contains($mime, 'php') || str_starts_with($mime, 'text/x-php');
    }

    /**
     * Guess a file extension from the detected MIME type.
     */
    private function extensionFromMime(string $mime): ?string
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

    /**
     * Build a unique filename for the asset.
     */
    private function uniqueFilename(Filesystem|FilesystemAdapter $disk, ?string $folder, string $baseName, string $extension): string
    {
        do {
            $candidate = sprintf('%s-%s.%s', $baseName, Str::lower(Str::random(8)), $extension);
            $relativePath = ltrim(($folder ? $folder.'/' : '').$candidate, '/');
        } while ($disk->exists($relativePath));

        return $candidate;
    }

    /**
     * Provide a consistent validation error response.
     */
    private function validationErrorResponse(array $errors): JsonResponse
    {
        return new JsonResponse([
            'message' => 'Validation failed.',
            'errors' => $errors,
        ], Response::HTTP_BAD_REQUEST);
    }

    /**
     * Retrieve the configured filesystem disk for assets.
     */
    private function disk(): FilesystemAdapter
    {
        return Storage::disk(config('assetsme.disk', 'assets'));
    }
}
