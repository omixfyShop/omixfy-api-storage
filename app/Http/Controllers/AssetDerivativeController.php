<?php

namespace App\Http\Controllers;

use App\Services\Asset\AssetDerivativeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class AssetDerivativeController extends Controller
{
    public function __construct(
        private readonly AssetDerivativeService $derivativeService,
    ) {
    }

    #[OA\Get(
        path: "/api/assets/derivative",
        summary: "Gera uma derivada de imagem parametrizada e cacheada",
        description: "Mantém o asset original e devolve a URL de uma derivada cacheada. Sem 'size' (ou size=0) apenas converte o formato (achatando transparência sobre o fundo). Com 'size'>0, recorta as bordas, centraliza e preenche um quadrado size x size segundo 'fill' e 'bg'. O caminho de cache inclui os parâmetros para specs distintas não colidirem.",
        tags: ["Assets"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "path", in: "query", required: true, description: "Caminho relativo do asset de origem", schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "format", in: "query", required: false, description: "Formato de saída (jpg, jpeg, png, webp). Padrão jpg.", schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "size", in: "query", required: false, description: "Lado do quadrado de adequação em pixels. Ausente ou 0 = apenas conversão de formato.", schema: new OA\Schema(type: "integer", minimum: 0)),
            new OA\Parameter(name: "fill", in: "query", required: false, description: "Fração do quadro preenchida pelo produto (0 < fill <= 1). Padrão 0.92.", schema: new OA\Schema(type: "number")),
            new OA\Parameter(name: "bg", in: "query", required: false, description: "Cor de fundo em hex sem '#'. Padrão ffffff.", schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "square", in: "query", required: false, description: "1 para canvas quadrado (padrão), 0 para ajustar dentro do tamanho sem canvas quadrado.", schema: new OA\Schema(type: "integer")),
        ],
        responses: [
            new OA\Response(response: 200, description: "URL da derivada disponível"),
            new OA\Response(response: 400, description: "Path inválido"),
            new OA\Response(response: 401, description: "Não autorizado"),
            new OA\Response(response: 404, description: "Asset não encontrado"),
            new OA\Response(response: 422, description: "Parâmetros de derivada inválidos"),
            new OA\Response(response: 500, description: "Falha ao gerar a derivada"),
        ]
    )]
    public function derivative(Request $request): JsonResponse
    {
        return $this->derivativeService->handle($request);
    }
}
