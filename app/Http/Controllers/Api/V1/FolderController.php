<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Library\MoveFolderRequest;
use App\Http\Requests\Library\StoreFolderRequest;
use App\Http\Requests\Library\UpdateFolderRequest;
use App\Http\Resources\AssetResource;
use App\Http\Resources\FolderResource;
use App\Jobs\GenerateFolderPreview;
use App\Jobs\UpdateFolderCounters;
use App\Models\Asset;
use App\Models\Folder;
use App\Models\FolderToken;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FolderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $perPage = min((int) $request->integer('per_page', 30), 100);
        $orderBy = $request->get('orderBy', 'name');
        $order = $request->get('order', 'asc');
        $allowedOrder = ['name', 'created_at', 'updated_at'];

        if (!in_array($orderBy, $allowedOrder, true)) {
            $orderBy = 'name';
        }

        $hasParent = $request->filled('parent_id');
        $hasSearch = $request->filled('q');

        $query = Folder::query()
            ->ownedBy($user->id)
            ->when($hasParent, fn (Builder $builder) => $builder->where('parent_id', $request->integer('parent_id')))
            ->when(!$hasParent && !$hasSearch, fn (Builder $builder) => $builder->whereNull('parent_id'))
            ->when($hasSearch, fn (Builder $builder) => $builder->where('name', 'like', '%'.$request->get('q').'%'))
            ->orderBy($orderBy, $order);

        $folders = $query->paginate($perPage);

        return FolderResource::collection($folders)->response();
    }

    public function store(StoreFolderRequest $request): JsonResponse
    {
        $user = $request->user();
        $this->authorize('create', Folder::class);

        $parentId = $request->integer('parent_id');
        $parent = null;

        if ($parentId) {
            $parent = Folder::ownedBy($user->id)->findOrFail($parentId);
        }

        $name = trim($request->input('name'));

        $folder = Folder::create([
            'name' => $name,
            'parent_id' => $parent?->id,
            'owner_id' => $user->id,
            'access_level' => 'private',
        ]);

        Log::info('library:folder-create', [
            'user_id' => $user->id,
            'folder_id' => $folder->id,
            'depth' => $folder->depth,
        ]);

        return (new FolderResource($folder))->response()->setStatusCode(201);
    }

    public function show(Request $request, Folder $folder): JsonResponse
    {
        $this->authorize('view', $folder);
        $folder->load('parent');

        Log::info('library:view', [
            'user_id' => $request->user()->id,
            'folder_id' => $folder->id,
            'depth' => $folder->depth,
            'count_items' => $folder->files_count + $folder->folders_count,
        ]);

        return (new FolderResource($folder))->response();
    }

    public function update(UpdateFolderRequest $request, Folder $folder): JsonResponse
    {
        $this->authorize('update', $folder);

        $name = trim($request->input('name'));

        $folder->update([
            'name' => $name,
            'slug' => Folder::generateUniqueSlug($name, $folder->parent_id, $folder->owner_id, $folder->id),
        ]);

        Log::info('library:folder-rename', [
            'user_id' => $request->user()->id,
            'folder_id' => $folder->id,
        ]);

        return (new FolderResource($folder->refresh()))->response();
    }

    public function move(MoveFolderRequest $request, Folder $folder): JsonResponse
    {
        $this->authorize('update', $folder);

        $targetParentId = $request->input('parent_id');
        $previousParentId = $folder->parent_id;

        if (!$folder->canMoveInto($targetParentId ? (int) $targetParentId : null)) {
            abort(422, 'A pasta não pode ser movida para o destino selecionado.');
        }

        $folder->parent_id = $targetParentId;
        $folder->save();
        $folder->syncDepth();

        UpdateFolderCounters::dispatch($folder->parent_id);
        UpdateFolderCounters::dispatch($previousParentId);
        GenerateFolderPreview::dispatch($folder->id);

        Log::info('library:folder-move', [
            'user_id' => $request->user()->id,
            'folder_id' => $folder->id,
            'parent_id' => $targetParentId,
        ]);

        return (new FolderResource($folder->refresh()))->response();
    }

    public function destroy(Request $request, Folder $folder): JsonResponse
    {
        $this->authorize('delete', $folder);
        $folder->delete();
        UpdateFolderCounters::dispatch($folder->parent_id);

        Log::info('library:folder-delete', [
            'user_id' => $request->user()->id,
            'folder_id' => $folder->id,
        ]);

        return response()->json(['status' => 'deleted']);
    }

    public function restore(Request $request, int $folderId): JsonResponse
    {
        $folder = Folder::withTrashed()->findOrFail($folderId);
        $this->authorize('restore', $folder);

        $folder->restore();
        $folder->slug = Folder::generateUniqueSlug($folder->name, $folder->parent_id, $folder->owner_id, $folder->id);
        $folder->save();
        UpdateFolderCounters::dispatch($folder->parent_id);
        GenerateFolderPreview::dispatch($folder->id);

        Log::info('library:folder-restore', [
            'user_id' => $request->user()->id,
            'folder_id' => $folder->id,
        ]);

        return (new FolderResource($folder->refresh()))->response();
    }

    public function children(Request $request, Folder $folder): JsonResponse
    {
        $this->authorize('view', $folder);
        $user = $request->user();

        $perPage = min((int) $request->integer('per_page', 30), 100);
        $orderBy = $request->get('orderBy', 'name');
        $order = $request->get('order', 'asc');
        $allowedOrder = ['name', 'created_at', 'updated_at'];

        if (!in_array($orderBy, $allowedOrder, true)) {
            $orderBy = 'name';
        }

        $folders = Folder::query()
            ->ownedBy($user->id)
            ->where('parent_id', $folder->id)
            ->orderBy($orderBy, $order)
            ->paginate($perPage, ['*'], 'folders_page');

        $assets = Asset::query()
            ->where('folder_id', $folder->id)
            ->where('owner_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'assets_page');

        return response()->json([
            'folders' => FolderResource::collection($folders)->response()->getData(true),
            'assets' => AssetResource::collection($assets)->response()->getData(true),
        ]);
    }

    public function preview(Request $request, Folder $folder): JsonResponse
    {
        $this->authorize('view', $folder);

        $ids = $folder->preview_asset_ids ?? [];

        if (empty($ids)) {
            return response()->json(['data' => []]);
        }

        $assets = Asset::query()
            ->whereIn('id', $ids)
            ->get()
            ->sortBy(fn (Asset $asset) => array_search($asset->id, $ids, true))
            ->values();

        return AssetResource::collection($assets)->response();
    }

    public function createToken(Request $request, Folder $folder): JsonResponse
    {
        $this->authorize('update', $folder);

        $token = FolderToken::create([
            'folder_id' => $folder->id,
            'can_create_subfolders' => true,
            'can_upload' => true,
        ]);

        Log::info('library:folder-token-create', [
            'user_id' => $request->user()->id,
            'folder_id' => $folder->id,
            'token_id' => $token->id,
        ]);

        return response()->json([
            'data' => [
                'id' => $token->id,
                'token' => $token->token,
                'can_create_subfolders' => $token->can_create_subfolders,
                'can_upload' => $token->can_upload,
                'expires_at' => $token->expires_at?->toIso8601String(),
            ],
        ], 201);
    }
}
