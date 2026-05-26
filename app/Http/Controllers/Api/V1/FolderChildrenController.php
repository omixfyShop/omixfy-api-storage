<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesUserId;
use App\Http\Controllers\Controller;
use App\Http\Resources\AssetResource;
use App\Http\Resources\FolderResource;
use App\Jobs\GenerateFolderPreview;
use App\Models\Asset;
use App\Models\Folder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use OpenApi\Attributes as OA;

class FolderChildrenController extends Controller
{
    use ResolvesUserId;

    #[OA\Get(
        path: "/api/v1/folders/{folder}/children",
        summary: "Listar filhos da pasta",
        description: "Retorna as subpastas e assets de uma pasta",
        tags: ["Folders"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "folder", in: "path", required: true, schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "per_page", in: "query", required: false, schema: new OA\Schema(type: "integer", minimum: 1, maximum: 100)),
            new OA\Parameter(name: "orderBy", in: "query", required: false, schema: new OA\Schema(type: "string", enum: ["name", "created_at", "updated_at"])),
            new OA\Parameter(name: "order", in: "query", required: false, schema: new OA\Schema(type: "string", enum: ["asc", "desc"])),
        ],
        responses: [
            new OA\Response(response: 200, description: "Lista de filhos"),
            new OA\Response(response: 401, description: "Não autorizado"),
            new OA\Response(response: 403, description: "Sem permissão"),
            new OA\Response(response: 404, description: "Pasta não encontrada"),
        ]
    )]
    public function children(Request $request, Folder $folder): JsonResponse
    {
        $this->authorize('view', $folder);

        $perPage = min((int) $request->integer('per_page', 30), 100);
        $orderBy = $request->get('orderBy', 'name');
        $order = $request->get('order', 'asc');
        $allowedOrder = ['name', 'created_at', 'updated_at'];

        if (!in_array($orderBy, $allowedOrder, true)) {
            $orderBy = 'name';
        }

        $folders = Folder::query()
            ->where('parent_id', $folder->id)
            ->orderBy($orderBy, $order)
            ->paginate($perPage, ['*'], 'folders_page');

        $assets = Asset::query()
            ->where('folder_id', $folder->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'assets_page');

        return response()->json([
            'folders' => FolderResource::collection($folders)->response()->getData(true),
            'assets' => AssetResource::collection($assets)->response()->getData(true),
        ]);
    }

    #[OA\Get(
        path: "/api/v1/folders/{folder}/preview",
        summary: "Obter preview da pasta",
        description: "Retorna os assets de preview de uma pasta",
        tags: ["Folders"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "folder", in: "path", required: true, schema: new OA\Schema(type: "integer")),
        ],
        responses: [
            new OA\Response(response: 200, description: "Assets de preview"),
            new OA\Response(response: 401, description: "Não autorizado"),
            new OA\Response(response: 403, description: "Sem permissão"),
            new OA\Response(response: 404, description: "Pasta não encontrada"),
        ]
    )]
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

    #[OA\Post(
        path: "/api/v1/folders/{folder}/assets/{asset}/toggle-preview",
        summary: "Alternar preview do asset",
        description: "Define ou remove um asset como preview da pasta",
        tags: ["Folders"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "folder", in: "path", required: true, schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "asset", in: "path", required: true, schema: new OA\Schema(type: "integer")),
        ],
        responses: [
            new OA\Response(response: 200, description: "Preview atualizado"),
            new OA\Response(response: 401, description: "Não autorizado"),
            new OA\Response(response: 403, description: "Sem permissão"),
            new OA\Response(response: 404, description: "Pasta ou asset não encontrado"),
        ]
    )]
    public function togglePreview(Request $request, Folder $folder, Asset $asset): JsonResponse
    {
        $this->authorize('update', $folder);

        if ($asset->folder_id !== $folder->id) {
            return response()->json([
                'message' => 'Asset does not belong to this folder.',
            ], 404);
        }

        $previewIds = $folder->preview_asset_ids ?? [];

        if (in_array($asset->id, $previewIds, true)) {
            $previewIds = [];
        } else {
            $previewIds = [$asset->id];
        }

        $folder->preview_asset_ids = $previewIds;
        $folder->save();

        GenerateFolderPreview::dispatch($folder->id);

        Log::info('library:preview-toggle', [
            'user_id' => $this->getUserId($request),
            'folder_id' => $folder->id,
            'asset_id' => $asset->id,
            'preview_ids' => $previewIds,
            'action' => empty($previewIds) ? 'removed' : 'set',
        ]);

        return response()->json([
            'data' => [
                'preview_asset_ids' => $previewIds,
            ],
        ]);
    }
}
