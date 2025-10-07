<?php

namespace App\Jobs;

use App\Models\Folder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class UpdateFolderCounters implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly ?int $folderId)
    {
    }

    public function handle(): void
    {
        if ($this->folderId === null) {
            return;
        }

        $folder = Folder::with(['children', 'assets'])->find($this->folderId);

        if (!$folder) {
            return;
        }

        $folder->files_count = $folder->assets()->count();
        $folder->folders_count = $folder->children()->count();
        $folder->saveQuietly();

        if ($folder->parent_id) {
            static::dispatch($folder->parent_id);
        }

        Log::info('library:counters-updated', [
            'folder_id' => $folder->id,
            'files_count' => $folder->files_count,
            'folders_count' => $folder->folders_count,
        ]);
    }
}
