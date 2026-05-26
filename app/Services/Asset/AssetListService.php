<?php

namespace App\Services\Asset;

use App\Models\Asset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\Paginator;

class AssetListService
{
    public function __construct(
        private readonly AssetService $assetService,
    ) {
    }

    public function handle(Request $request, ?string $folder, int $page, int $perPage): JsonResponse
    {
        $folder = $this->assetService->normalizeFolder($folder);

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
        $disk = $this->assetService->disk();

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
}
