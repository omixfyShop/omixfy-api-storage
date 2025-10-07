<?php

namespace App\Models;

use App\Jobs\GenerateFolderPreview;
use App\Jobs\UpdateFolderCounters;
use Illuminate\Database\Eloquent\Attributes\Attribute;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $uuid
 * @property string $name
 * @property string $slug
 * @property int|null $parent_id
 * @property int $owner_id
 * @property string $access_level
 * @property array<int, int>|null $preview_asset_ids
 * @property int $depth
 * @property int $files_count
 * @property int $folders_count
 */
class Folder extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    protected $fillable = [
        'uuid',
        'name',
        'slug',
        'parent_id',
        'owner_id',
        'access_level',
        'preview_asset_ids',
        'depth',
        'files_count',
        'folders_count',
    ];

    protected $casts = [
        'preview_asset_ids' => 'array',
        'depth' => 'integer',
        'files_count' => 'integer',
        'folders_count' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $folder): void {
            $folder->uuid = $folder->uuid ?: (string) Str::uuid();
            $folder->slug = $folder->slug ?: static::generateUniqueSlug($folder->name, $folder->parent_id, $folder->owner_id);
            $folder->depth = $folder->parent_id
                ? (static::withTrashed()->find($folder->parent_id)?->depth ?? 0) + 1
                : 0;
        });

        static::created(function (self $folder): void {
            UpdateFolderCounters::dispatch($folder->parent_id);
            GenerateFolderPreview::dispatch($folder->id);
        });

        static::updated(function (self $folder): void {
            if ($folder->isDirty('parent_id')) {
                $folder->syncDepth();
                UpdateFolderCounters::dispatch($folder->getOriginal('parent_id'));
                UpdateFolderCounters::dispatch($folder->parent_id);
            }
            if ($folder->isDirty(['name'])) {
                GenerateFolderPreview::dispatch($folder->id);
            }
        });

        static::deleted(function (self $folder): void {
            UpdateFolderCounters::dispatch($folder->parent_id);
            if ($folder->parent_id) {
                GenerateFolderPreview::dispatch($folder->parent_id);
            }
        });

        static::restored(function (self $folder): void {
            UpdateFolderCounters::dispatch($folder->parent_id);
            GenerateFolderPreview::dispatch($folder->id);
            if ($folder->parent_id) {
                GenerateFolderPreview::dispatch($folder->parent_id);
            }
        });
    }

    public static function generateUniqueSlug(string $name, ?int $parentId, int $ownerId, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'folder';
        $slug = $base;
        $counter = 1;

        while (static::withTrashed()
            ->where('parent_id', $parentId)
            ->where('owner_id', $ownerId)
            ->when($ignoreId, fn (Builder $builder) => $builder->where('id', '!=', $ignoreId))
            ->where('slug', $slug)
            ->exists()) {
            $counter++;
            $slug = "{$base}-{$counter}";
        }

        return $slug;
    }

    /**
     * Scope to limit folders to the current owner.
     */
    public function scopeOwnedBy(Builder $query, int $ownerId): Builder
    {
        return $query->where('owner_id', $ownerId);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class, 'folder_id');
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function tokens(): HasMany
    {
        return $this->hasMany(FolderToken::class);
    }

    /**
     * Breadcrumb accessor returning an ordered collection of ancestors.
     */
    protected function breadcrumbs(): Attribute
    {
        return Attribute::make(
            get: function (): Collection {
                $breadcrumbs = collect();
                $current = $this;

                while ($current) {
                    $breadcrumbs->prepend([
                        'id' => $current->id,
                        'uuid' => $current->uuid,
                        'name' => $current->name,
                        'slug' => $current->slug,
                    ]);
                    $current = $current->parent;
                }

                return $breadcrumbs->values();
            },
        );
    }

    public function refreshPreview(): void
    {
        GenerateFolderPreview::dispatchSync($this->id);
    }

    public function refreshCounters(): void
    {
        UpdateFolderCounters::dispatchSync($this->id);
    }

    public function syncDepth(): void
    {
        $this->depth = $this->parent_id
            ? (static::withTrashed()->find($this->parent_id)?->depth ?? 0) + 1
            : 0;
        $this->saveQuietly();

        $this->children()->withTrashed()->get()->each(function (self $child): void {
            $child->depth = $this->depth + 1;
            $child->saveQuietly();
            $child->syncDepth();
        });
    }

    public function canMoveInto(?int $targetId): bool
    {
        if ($targetId === null) {
            return true;
        }

        if ($targetId === $this->id) {
            return false;
        }

        $ancestor = static::find($targetId);
        while ($ancestor) {
            if ($ancestor->id === $this->id) {
                return false;
            }
            $ancestor = $ancestor->parent;
        }

        return true;
    }
}
