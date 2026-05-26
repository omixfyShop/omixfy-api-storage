<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesUserId;
use App\Http\Controllers\Controller;
use App\Models\Folder;
use App\Models\FolderToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use OpenApi\Attributes as OA;

class FolderTokenController extends Controller
{
    use ResolvesUserId;

    #[OA\Post(
        path: "/api/v1/folders/{folder}/tokens",
        summary: "Criar token da pasta",
        description: "Cria um token de acesso para a pasta",
        tags: ["Folders"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "folder", in: "path", required: true, schema: new OA\Schema(type: "integer")),
        ],
        responses: [
            new OA\Response(response: 201, description: "Token criado com sucesso"),
            new OA\Response(response: 401, description: "Não autorizado"),
            new OA\Response(response: 403, description: "Sem permissão"),
            new OA\Response(response: 404, description: "Pasta não encontrada"),
        ]
    )]
    public function createToken(Request $request, Folder $folder): JsonResponse
    {
        $this->authorize('update', $folder);

        $token = FolderToken::create([
            'folder_id' => $folder->id,
            'can_create_subfolders' => true,
            'can_upload' => true,
        ]);

        Log::info('library:folder-token-create', [
            'user_id' => $this->getUserId($request),
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
