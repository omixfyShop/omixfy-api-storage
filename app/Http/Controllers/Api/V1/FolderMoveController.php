<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesUserId;
use App\Http\Controllers\Controller;
use App\Http\Requests\Library\MoveFolderRequest;
use App\Http\Resources\FolderResource;
use App\Jobs\GenerateFolderPreview;
use App\Jobs\UpdateFolderCounters;
use App\Models\Folder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use OpenApi\Attributes as OA;

class FolderMoveController extends Controller
{
    use ResolvesUserId;

    #[OA\Post(
        path: "/api/v1/folders/{folder}/move",
        summary: "Mover pasta",
        description: "Move uma pasta para outra pasta pai",
        tags: ["Folders"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "folder", in: "path", required: true, schema: new OA\Schema(type: "integer")),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "parent_id", type: "integer", nullable: true, description: "ID da nova pasta pai (null para raiz)"),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Pasta movida com sucesso"),
            new OA\Response(response: 401, description: "Não autorizado"),
            new OA\Response(response: 403, description: "Sem permissão"),
            new OA\Response(response: 422, description: "Erro de validação"),
        ]
    )]
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
            'user_id' => $this->getUserId($request),
            'folder_id' => $folder->id,
            'parent_id' => $targetParentId,
        ]);

        return (new FolderResource($folder->refresh()))->response();
    }
}
