<?php

namespace App\Services\Asset;

use App\Features\Convert\ImageResize;
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
        $imageResize = new ImageResize($disk);

        $variantDefinitions = [];
        $variantErrors = [];

        foreach (['small', 'medium', 'large'] as $variantKey) {
            try {
                $variantDefinitions[$variantKey] = $imageResize->resolveVariantSize($request->query($variantKey), $variantKey);
            } catch (InvalidArgumentException $exception) {
                $variantErrors[$variantKey] = [$exception->getMessage()];
            }
        }

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
            $result = $this->processFile($file, $detectedMime, $folder, $folderId, $userId, $disk, $imageResize, $variantDefinitions);

            if ($result instanceof JsonResponse) {
                return $result;
            }

            $results[] = $result;
        }

        return new JsonResponse(['data' => $results], Response::HTTP_CREATED);
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

    private function processFile(
        UploadedFile $file,
        string $detectedMime,
        ?string $folder,
        ?int $folderId,
        int $userId,
        \Illuminate\Filesystem\FilesystemAdapter $disk,
        ImageResize $imageResize,
        array $variantDefinitions,
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

        $sizes = [];
        $variantMetadata = [];

        try {
            $variantResult = $imageResize->generateVariantData($relativePath, $folder, $fileName, $variantDefinitions);
            $sizes = $variantResult['urls'];
            $variantMetadata = $variantResult['metadata'];
        } catch (\Throwable $exception) {
            return new JsonResponse([
                'message' => 'Failed to generate one or more image variants.',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        if ($variantMetadata !== []) {
            $asset->generated_thumbs = $variantMetadata;
            $asset->save();
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

        if ($sizes !== []) {
            $result['sizes'] = $sizes;
        }

        if ($variantMetadata !== []) {
            $result['generated_thumbs'] = $variantMetadata;
        }

        return $result;
    }
}
