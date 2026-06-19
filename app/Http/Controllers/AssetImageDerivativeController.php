<?php

namespace App\Http\Controllers;

use App\Services\Asset\AssetJpgService;
use App\Services\Asset\AssetMlReadyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class AssetImageDerivativeController extends Controller
{
    public function __construct(
        private readonly AssetJpgService $jpgService,
        private readonly AssetMlReadyService $mlReadyService,
    ) {
    }

    #[OA\Get(
        path: "/api/assets/jpg",
        summary: "Garante derivada JPEG de um asset",
        description: "Mantém o asset original (ex.: WebP) e devolve a URL de uma versão JPEG cacheada, gerando-a na primeira chamada com fundo sólido para imagens com transparência. Útil para marketplaces que rejeitam WebP.",
        tags: ["Assets"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "path",
                in: "query",
                required: true,
                description: "Caminho relativo do asset de origem",
                schema: new OA\Schema(type: "string")
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: "URL JPEG disponível"),
            new OA\Response(response: 400, description: "Path inválido"),
            new OA\Response(response: 401, description: "Não autorizado"),
            new OA\Response(response: 404, description: "Asset não encontrado"),
            new OA\Response(response: 500, description: "Falha ao converter para JPEG"),
        ]
    )]
    public function ensureJpg(Request $request): JsonResponse
    {
        return $this->jpgService->handle($request);
    }

    #[OA\Get(
        path: "/api/assets/ml-ready",
        summary: "Gera versão adequada ao marketplace (quadrada, produto centralizado)",
        description: "Mantém o asset original e devolve a URL de uma versão JPEG cacheada, quadrada (1200x1200 por padrão), com as bordas brancas recortadas e o produto centralizado preenchendo o quadro — atende aos requisitos de tamanho mínimo, proporção e posição do Mercado Livre.",
        tags: ["Assets"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "path",
                in: "query",
                required: true,
                description: "Caminho relativo do asset de origem",
                schema: new OA\Schema(type: "string")
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: "URL da imagem adequada"),
            new OA\Response(response: 400, description: "Path inválido"),
            new OA\Response(response: 401, description: "Não autorizado"),
            new OA\Response(response: 404, description: "Asset não encontrado"),
            new OA\Response(response: 500, description: "Falha ao adequar imagem"),
        ]
    )]
    public function ensureMlReady(Request $request): JsonResponse
    {
        return $this->mlReadyService->handle($request);
    }
}
