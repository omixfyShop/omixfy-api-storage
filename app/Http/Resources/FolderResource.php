<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Folder */
class FolderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'name' => $this->name,
            'slug' => $this->slug,
            'parent_id' => $this->parent_id,
            'owner_id' => $this->owner_id,
            'access_level' => $this->access_level,
            'depth' => $this->depth,
            'files_count' => $this->files_count,
            'folders_count' => $this->folders_count,
            'preview_asset_ids' => $this->preview_asset_ids ?? [],
            'breadcrumbs' => $this->breadcrumbs ?? [],
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'deleted_at' => $this->deleted_at?->toIso8601String(),
        ];
    }
}
