<?php

namespace App\Models;

use App\Jobs\GenerateFolderPreview;
use App\Jobs\UpdateFolderCounters;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Asset extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'path',
        'folder_id',
        'folder',
        'owner_id',
        'mime',
        'width',
        'height',
        'size_bytes',
        'generated_thumbs',
        'original_name',
        'size',
        'checksum',
        'uploaded_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'width' => 'integer',
        'height' => 'integer',
        'size_bytes' => 'integer',
        'generated_thumbs' => 'array',
        'size' => 'integer',
    ];

    protected static function booted(): void
    {
        $refresh = static function (?int $folderId): void {
            if ($folderId) {
                UpdateFolderCounters::dispatch($folderId);
                GenerateFolderPreview::dispatch($folderId);
            }
        };

        static::created(function (self $asset) use ($refresh): void {
            $refresh($asset->folder_id);
        });

        static::updated(function (self $asset) use ($refresh): void {
            if ($asset->isDirty('folder_id')) {
                $refresh($asset->folder_id);
                $refresh($asset->getOriginal('folder_id'));
            }
        });

        static::deleted(function (self $asset) use ($refresh): void {
            $refresh($asset->folder_id);
        });
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(Folder::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }
}
