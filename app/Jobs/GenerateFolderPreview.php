<?php

namespace App\Jobs;

use App\Models\Folder;
use App\Services\FolderPreviewService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateFolderPreview implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly int $folderId)
    {
    }

    public function handle(FolderPreviewService $previewService): void
    {
        $folder = Folder::with(['assets' => fn ($query) => $query->latest('created_at')])->find($this->folderId);

        if (!$folder) {
            return;
        }

        $maxItems = (int) config('library.preview_max_items', 4);
        $assets = $previewService->ensurePreviewAssets($folder, $maxItems);

        $folder->preview_asset_ids = $assets->pluck('id')->take($maxItems)->values()->all();
        $folder->saveQuietly();

        Log::info('library:preview-updated', [
            'folder_id' => $folder->id,
            'asset_ids' => $folder->preview_asset_ids,
            'count' => $assets->count(),
        ]);
    }
}
