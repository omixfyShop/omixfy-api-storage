<?php

namespace App\Http\Controllers;

use App\Services\Asset\AssetDeleteService;
use App\Services\Asset\AssetListService;
use App\Services\Asset\AssetRenameService;
use App\Services\Asset\AssetService;
use App\Services\Asset\AssetUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use OpenApi\Attributes as OA;
use Symfony\Component\HttpFoundation\Response;

class AssetController extends Controller
{
    public function __construct(
        private readonly AssetService $assetService,
        private readonly AssetUploadService $uploadService,
        private readonly AssetListService $listService,
        private readonly AssetDeleteService $deleteService,
        private readonly AssetRenameService $renameService,
    ) {
    }

    #[OA\Get(
        path: "/api/health",
        summary: "Health check",
        tags: ["Health"],
        responses: [
            new OA\Response(
                response: 200,
                description: "OK",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "ok", type: "boolean")
                    ]
                )
            )
        ]
    )]
    public function health(): JsonResponse
    {
        return new JsonResponse(['ok' => true], Response::HTTP_OK);
    }

    #[OA\Post(
        path: "/api/assets/upload",
        summary: "Upload de arquivos",
        description: "Upload de um ou mais arquivos para o armazenamento de assets",
        tags: ["Assets"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "folder",
                in: "query",
                required: false,
                description: "Pasta onde o arquivo será armazenado",
                schema: new OA\Schema(type: "string", pattern: "^[a-zA-Z0-9_/\\-]+$")
            ),
            new OA\Parameter(
                name: "small",
                in: "query",
                required: false,
                description: "Tamanho da variante small (1 para padrão ou LARGURAxALTURA)",
                schema: new OA\Schema(type: "string")
            ),
            new OA\Parameter(
                name: "medium",
                in: "query",
                required: false,
                description: "Tamanho da variante medium (1 para padrão ou LARGURAxALTURA)",
                schema: new OA\Schema(type: "string")
            ),
            new OA\Parameter(
                name: "large",
                in: "query",
                required: false,
                description: "Tamanho da variante large (1 para padrão ou LARGURAxALTURA)",
                schema: new OA\Schema(type: "string")
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    properties: [
                        new OA\Property(property: "file", type: "string", format: "binary", description: "Arquivo único"),
                        new OA\Property(property: "files", type: "array", items: new OA\Items(type: "string", format: "binary"), description: "Múltiplos arquivos"),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "Arquivo(s) enviado(s) com sucesso",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "data", type: "array", items: new OA\Items(type: "object"))
                    ]
                )
            ),
            new OA\Response(response: 400, description: "Erro de validação"),
            new OA\Response(response: 401, description: "Não autorizado"),
            new OA\Response(response: 422, description: "Erro ao processar variantes"),
            new OA\Response(response: 500, description: "Erro interno do servidor"),
        ]
    )]
    public function upload(Request $request): JsonResponse
    {
        $maxFileSize = (int) config('assetsme.max_file_size', 10 * 1024 * 1024);
        $maxKilobytes = (int) max(1, (int) ceil($maxFileSize / 1024));

        $validator = Validator::make(
            $request->all(),
            [
                'folder' => ['nullable', 'string', 'regex:/^[a-zA-Z0-9_\\/\-]+$/'],
                'file' => ['nullable', 'file', 'max:' . $maxKilobytes],
                'files' => ['nullable', 'array'],
                'files.*' => ['file', 'max:' . $maxKilobytes],
            ],
            [
                'folder.regex' => 'Folder may only contain letters, numbers, slashes, dashes, and underscores.',
            ],
        );

        if ($validator->fails()) {
            return $this->assetService->validationErrorResponse($validator->errors()->toArray());
        }

        return $this->uploadService->handle($request);
    }

    #[OA\Get(
        path: "/api/assets/list",
        summary: "Listar assets",
        description: "Lista os assets de uma pasta específica ou da raiz",
        tags: ["Assets"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "folder",
                in: "query",
                required: false,
                description: "Pasta para filtrar os assets",
                schema: new OA\Schema(type: "string", pattern: "^[a-zA-Z0-9_/\\-]+$")
            ),
            new OA\Parameter(
                name: "page",
                in: "query",
                required: false,
                description: "Número da página",
                schema: new OA\Schema(type: "integer", minimum: 1)
            ),
            new OA\Parameter(
                name: "per_page",
                in: "query",
                required: false,
                description: "Itens por página (máximo 100)",
                schema: new OA\Schema(type: "integer", minimum: 1, maximum: 100)
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Lista de assets",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "data", type: "array", items: new OA\Items(type: "object")),
                        new OA\Property(property: "meta", type: "object")
                    ]
                )
            ),
            new OA\Response(response: 400, description: "Erro de validação"),
            new OA\Response(response: 401, description: "Não autorizado"),
        ]
    )]
    public function list(Request $request): JsonResponse
    {
        $validator = Validator::make(
            $request->all(),
            [
                'folder' => ['nullable', 'string', 'regex:/^[a-zA-Z0-9_\\/\-]+$/'],
                'page' => ['nullable', 'integer', 'min:1'],
                'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            ],
            [
                'folder.regex' => 'Folder may only contain letters, numbers, slashes, dashes, and underscores.',
            ],
        );

        if ($validator->fails()) {
            return $this->assetService->validationErrorResponse($validator->errors()->toArray());
        }

        $validated = $validator->validated();

        return $this->listService->handle(
            $request,
            $validated['folder'] ?? null,
            (int) ($validated['page'] ?? 1),
            (int) ($validated['per_page'] ?? 25),
        );
    }

    #[OA\Delete(
        path: "/api/assets/file",
        summary: "Deletar asset",
        description: "Remove um asset pelo caminho",
        tags: ["Assets"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "path",
                in: "query",
                required: true,
                description: "Caminho do arquivo a ser deletado",
                schema: new OA\Schema(type: "string", pattern: "^[a-zA-Z0-9_\\.\\-/]+$")
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Asset deletado com sucesso",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "deleted", type: "boolean")
                    ]
                )
            ),
            new OA\Response(response: 400, description: "Erro de validação"),
            new OA\Response(response: 401, description: "Não autorizado"),
            new OA\Response(response: 404, description: "Asset não encontrado"),
            new OA\Response(response: 500, description: "Erro ao deletar"),
        ]
    )]
    public function delete(Request $request): JsonResponse
    {
        $validator = Validator::make(
            $request->all(),
            [
                'path' => ['required', 'string', 'regex:/^[a-zA-Z0-9_.\-\/]+$/'],
            ],
            [
                'path.regex' => 'Path may only contain letters, numbers, dots, slashes, dashes, and underscores.',
            ],
        );

        if ($validator->fails()) {
            return $this->assetService->validationErrorResponse($validator->errors()->toArray());
        }

        $validated = $validator->validated();

        return $this->deleteService->handle($request, $validated['path']);
    }

    #[OA\Patch(
        path: "/api/assets/rename",
        summary: "Renomear asset",
        description: "Renomeia um asset pelo caminho",
        tags: ["Assets"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["path", "name"],
                properties: [
                    new OA\Property(property: "path", type: "string", pattern: "^[a-zA-Z0-9_\\.\\-/]+$", description: "Caminho atual do arquivo"),
                    new OA\Property(property: "name", type: "string", maxLength: 255, pattern: "^[a-zA-Z0-9_\\.\\-]+$", description: "Novo nome do arquivo (sem extensão)"),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Asset renomeado com sucesso",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "id", type: "integer"),
                        new OA\Property(property: "path", type: "string"),
                        new OA\Property(property: "url", type: "string"),
                        new OA\Property(property: "generated_thumbs", type: "array", items: new OA\Items(type: "object"))
                    ]
                )
            ),
            new OA\Response(response: 400, description: "Erro de validação"),
            new OA\Response(response: 401, description: "Não autorizado"),
            new OA\Response(response: 404, description: "Asset não encontrado"),
            new OA\Response(response: 500, description: "Erro ao renomear"),
        ]
    )]
    public function rename(Request $request): JsonResponse
    {
        $validator = Validator::make(
            $request->all(),
            [
                'path' => ['required', 'string', 'regex:/^[a-zA-Z0-9_\.\-\/]+$/'],
                'name' => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z0-9_\.\-]+$/'],
            ],
            [
                'path.regex' => 'Path may only contain letters, numbers, dots, slashes, dashes, and underscores.',
                'name.regex' => 'Name may only contain letters, numbers, dots, dashes, and underscores.',
            ],
        );

        if ($validator->fails()) {
            return $this->assetService->validationErrorResponse($validator->errors()->toArray());
        }

        $validated = $validator->validated();

        return $this->renameService->handle($request, $validated['path'], $validated['name']);
    }
}
