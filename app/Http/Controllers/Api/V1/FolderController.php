<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesUserId;
use App\Http\Controllers\Controller;
use App\Http\Requests\Library\StoreFolderRequest;
use App\Http\Requests\Library\UpdateFolderRequest;
use App\Http\Resources\FolderResource;
use App\Jobs\GenerateFolderPreview;
use App\Jobs\UpdateFolderCounters;
use App\Models\Folder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use OpenApi\Attributes as OA;

class FolderController extends Controller
{
    use ResolvesUserId;

    #[OA\Get(
        path: "/api/v1/folders",
        summary: "Listar pastas",
        description: "Lista as pastas do usuário autenticado",
        tags: ["Folders"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "parent_id", in: "query", required: false, schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "q", in: "query", required: false, schema: new OA\Schema(type: "string"), description: "Busca por nome"),
            new OA\Parameter(name: "per_page", in: "query", required: false, schema: new OA\Schema(type: "integer", minimum: 1, maximum: 100)),
            new OA\Parameter(name: "orderBy", in: "query", required: false, schema: new OA\Schema(type: "string", enum: ["name", "created_at", "updated_at"])),
            new OA\Parameter(name: "order", in: "query", required: false, schema: new OA\Schema(type: "string", enum: ["asc", "desc"])),
        ],
        responses: [
            new OA\Response(response: 200, description: "Lista de pastas"),
            new OA\Response(response: 401, description: "Não autorizado"),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $userId = $this->getUserId($request);

        if (!$userId) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

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
            ->when($hasParent, fn (Builder $builder) => $builder->where('parent_id', $request->integer('parent_id')))
            ->when(!$hasParent && !$hasSearch, fn (Builder $builder) => $builder->whereNull('parent_id'))
            ->when($hasSearch, fn (Builder $builder) => $builder->where('name', 'like', '%'.$request->get('q').'%'))
            ->orderBy($orderBy, $order);

        $folders = $query->paginate($perPage);

        return FolderResource::collection($folders)->response();
    }

    #[OA\Post(
        path: "/api/v1/folders",
        summary: "Criar pasta",
        description: "Cria uma nova pasta",
        tags: ["Folders"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["name"],
                properties: [
                    new OA\Property(property: "name", type: "string", description: "Nome da pasta"),
                    new OA\Property(property: "parent_id", type: "integer", nullable: true, description: "ID da pasta pai"),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Pasta criada com sucesso"),
            new OA\Response(response: 401, description: "Não autorizado"),
            new OA\Response(response: 403, description: "Sem permissão"),
        ]
    )]
    public function store(StoreFolderRequest $request): JsonResponse
    {
        $userId = $this->getUserId($request);

        if (!$userId) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $this->authorize('create', Folder::class);

        $parentId = $request->integer('parent_id');
        $parent = null;

        if ($parentId) {
            $parent = Folder::findOrFail($parentId);
        }

        $name = trim($request->input('name'));

        $folder = Folder::create([
            'name' => $name,
            'parent_id' => $parent?->id,
            'owner_id' => $userId,
            'access_level' => 'private',
        ]);

        Log::info('library:folder-create', [
            'user_id' => $userId,
            'folder_id' => $folder->id,
            'depth' => $folder->depth,
        ]);

        return (new FolderResource($folder))->response()->setStatusCode(201);
    }

    #[OA\Get(
        path: "/api/v1/folders/{folder}",
        summary: "Obter pasta",
        description: "Retorna os detalhes de uma pasta específica",
        tags: ["Folders"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "folder", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "ID da pasta"),
        ],
        responses: [
            new OA\Response(response: 200, description: "Detalhes da pasta"),
            new OA\Response(response: 401, description: "Não autorizado"),
            new OA\Response(response: 403, description: "Sem permissão"),
            new OA\Response(response: 404, description: "Pasta não encontrada"),
        ]
    )]
    public function show(Request $request, Folder $folder): JsonResponse
    {
        $this->authorize('view', $folder);
        $folder->load('parent');

        Log::info('library:view', [
            'user_id' => $this->getUserId($request),
            'folder_id' => $folder->id,
            'depth' => $folder->depth,
            'count_items' => $folder->files_count + $folder->folders_count,
        ]);

        return (new FolderResource($folder))->response();
    }

    #[OA\Patch(
        path: "/api/v1/folders/{folder}",
        summary: "Atualizar pasta",
        description: "Atualiza o nome de uma pasta",
        tags: ["Folders"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "folder", in: "path", required: true, schema: new OA\Schema(type: "integer")),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["name"],
                properties: [
                    new OA\Property(property: "name", type: "string", description: "Novo nome da pasta"),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Pasta atualizada"),
            new OA\Response(response: 401, description: "Não autorizado"),
            new OA\Response(response: 403, description: "Sem permissão"),
            new OA\Response(response: 404, description: "Pasta não encontrada"),
        ]
    )]
    public function update(UpdateFolderRequest $request, Folder $folder): JsonResponse
    {
        $this->authorize('update', $folder);

        $name = trim($request->input('name'));

        $folder->update([
            'name' => $name,
            'slug' => Folder::generateUniqueSlug($name, $folder->parent_id, $folder->owner_id, $folder->id),
        ]);

        Log::info('library:folder-rename', [
            'user_id' => $this->getUserId($request),
            'folder_id' => $folder->id,
        ]);

        return (new FolderResource($folder->refresh()))->response();
    }

    #[OA\Delete(
        path: "/api/v1/folders/{folder}",
        summary: "Deletar pasta",
        description: "Remove uma pasta (soft delete)",
        tags: ["Folders"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "folder", in: "path", required: true, schema: new OA\Schema(type: "integer")),
        ],
        responses: [
            new OA\Response(response: 200, description: "Pasta deletada"),
            new OA\Response(response: 401, description: "Não autorizado"),
            new OA\Response(response: 403, description: "Sem permissão"),
            new OA\Response(response: 404, description: "Pasta não encontrada"),
        ]
    )]
    public function destroy(Request $request, Folder $folder): JsonResponse
    {
        $this->authorize('delete', $folder);
        $folder->delete();
        UpdateFolderCounters::dispatch($folder->parent_id);

        Log::info('library:folder-delete', [
            'user_id' => $this->getUserId($request),
            'folder_id' => $folder->id,
        ]);

        return response()->json(['status' => 'deleted']);
    }

    #[OA\Post(
        path: "/api/v1/folders/{folder}/restore",
        summary: "Restaurar pasta",
        description: "Restaura uma pasta deletada",
        tags: ["Folders"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "folder", in: "path", required: true, schema: new OA\Schema(type: "integer")),
        ],
        responses: [
            new OA\Response(response: 200, description: "Pasta restaurada"),
            new OA\Response(response: 401, description: "Não autorizado"),
            new OA\Response(response: 403, description: "Sem permissão"),
            new OA\Response(response: 404, description: "Pasta não encontrada"),
        ]
    )]
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
            'user_id' => $this->getUserId($request),
            'folder_id' => $folder->id,
        ]);

        return (new FolderResource($folder->refresh()))->response();
    }
}
