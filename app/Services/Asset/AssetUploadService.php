<?php

namespace App\Services\Asset;

use App\Features\Convert\VariantKey;
use App\Features\Convert\VariantSize;
use App\Features\Convert\VariantSizeResolver;
use App\Jobs\GenerateAssetVariants;
use App\Models\Asset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\Response;

class AssetUploadService
{
    public function __construct(
        private readonly AssetService $assetService,
    ) {
    }

    public function handle(Request $request): JsonResponse
    {
        $folder = $this->assetService->normalizeFolder($request->input('folder'));

        $userId = $this->assetService->getUserId($request);
        if (! $userId) {
            return response()->json(['message' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $folderId = $this->assetService->resolveFolderId($folder, $userId);

        $uploadedFiles = $this->collectFiles($request);

        if ($uploadedFiles === []) {
            return $this->assetService->validationErrorResponse([
                'file' => ['No file was provided.'],
            ], Response::HTTP_BAD_REQUEST);
        }

        $disk = $this->assetService->disk();

        [$variants, $variantErrors] = $this->resolveVariants($request);

        if ($variantErrors !== []) {
            return $this->assetService->validationErrorResponse($variantErrors, Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $maxFileSize = (int) config('assetsme.max_file_size', 10 * 1024 * 1024);
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $results = [];

        foreach ($uploadedFiles as $file) {
            $validationError = $this->validateFile($file, $finfo, $maxFileSize);
            if ($validationError !== null) {
                return $validationError;
            }

            $detectedMime = $finfo->file($file->getRealPath());
            $result = $this->processFile($file, $detectedMime, $folder, $folderId, $userId, $disk, $variants);

            if ($result instanceof JsonResponse) {
                return $result;
            }

            $results[] = $result;
        }

        return new JsonResponse(['data' => $results], Response::HTTP_CREATED);
    }

    /**
     * @return array{0: array<string, VariantSize>, 1: array<string, array<int, string>>}
     */
    private function resolveVariants(Request $request): array
    {
        $resolver = new VariantSizeResolver();
        $variants = [];
        $variantErrors = [];

        foreach (VariantKey::cases() as $variantKey) {
            try {
                $size = $resolver->resolve($request->query($variantKey->value), $variantKey);
                if ($size !== null) {
                    $variants[$variantKey->value] = $size;
                }
            } catch (InvalidArgumentException $exception) {
                $variantErrors[$variantKey->value] = [$exception->getMessage()];
            }
        }

        return [$variants, $variantErrors];
    }

    /**
     * @return UploadedFile[]
     */
    private function collectFiles(Request $request): array
    {
        $uploadedFiles = [];

        $singleFile = $request->file('file');
        if ($singleFile instanceof UploadedFile) {
            $uploadedFiles[] = $singleFile;
        }

        $multipleFiles = $request->file('files', []);
        if (! is_array($multipleFiles)) {
            $multipleFiles = [$multipleFiles];
        }

        foreach ($multipleFiles as $file) {
            if ($file instanceof UploadedFile) {
                $uploadedFiles[] = $file;
            }
        }

        return $uploadedFiles;
    }

    private function validateFile(UploadedFile $file, \finfo $finfo, int $maxFileSize): ?JsonResponse
    {
        if (! $file->isValid()) {
            return $this->assetService->validationErrorResponse(['files' => ['One or more files are invalid.']]);
        }

        if ($file->getSize() > $maxFileSize) {
            return $this->assetService->validationErrorResponse(['files' => ['One or more files exceed the maximum size.']]);
        }

        $detectedMime = $finfo->file($file->getRealPath());

        if ($detectedMime === false) {
            return $this->assetService->validationErrorResponse(['files' => ['Unable to detect file MIME type.']]);
        }

        if ($this->assetService->isForbiddenMime($detectedMime)) {
            return $this->assetService->validationErrorResponse(['files' => ['The provided file type is not allowed.']]);
        }

        return null;
    }

    /**
     * @param  array<string, VariantSize>  $variants
     */
    private function processFile(
        UploadedFile $file,
        string $detectedMime,
        ?string $folder,
        ?int $folderId,
        int $userId,
        \Illuminate\Filesystem\FilesystemAdapter $disk,
        array $variants,
    ): array|JsonResponse {
        $fileName = $this->assetService->buildFileName($file, $detectedMime);
        $relativePath = ltrim(($folder ? $folder . '/' : '') . $fileName, '/');

        while ($disk->exists($relativePath)) {
            usleep(1000);
            $fileName = $this->assetService->buildFileName($file, $detectedMime);
            $relativePath = ltrim(($folder ? $folder . '/' : '') . $fileName, '/');
        }

        $storedPath = $disk->putFileAs($folder ?? '', $file, $fileName);

        if ($storedPath === false) {
            return new JsonResponse([
                'message' => 'Failed to store uploaded file.',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $asset = Asset::create([
            'path' => $relativePath,
            'folder_id' => $folderId,
            'folder' => $folder,
            'owner_id' => $userId,
            'original_name' => $file->getClientOriginalName(),
            'mime' => $detectedMime,
            'size' => $file->getSize(),
            'checksum' => hash_file('sha256', $file->getRealPath()),
            'uploaded_by' => $userId,
        ]);

        if ($variants !== []) {
            GenerateAssetVariants::dispatch($asset->id, $variants);
        }

        $result = [
            'id' => $asset->id,
            'url' => $disk->url($relativePath),
            'path' => $asset->path,
            'folder_id' => $asset->folder_id,
            'folder' => $asset->folder,
            'mime' => $asset->mime,
            'size' => $asset->size,
            'original_name' => $asset->original_name,
            'checksum' => $asset->checksum,
            'created_at' => $asset->created_at,
        ];

        if ($variants !== []) {
            $result['variants_status'] = 'processing';
        }

        return $result;
    }
}
