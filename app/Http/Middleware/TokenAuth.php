<?php

namespace App\Http\Middleware;

use App\Models\AccessToken;
use App\Models\User;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class TokenAuth
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        $token = $this->extractToken($request);

        if (! $token) {
            return $this->unauthorized();
        }

        $hash = hash('sha256', $token);

        $accessToken = AccessToken::query()->where('token_hash', $hash)->first();

        if (! $accessToken || ! hash_equals($accessToken->token_hash, $hash)) {
            return $this->unauthorized();
        }

        $request->attributes->set('token_user_id', $accessToken->user_id);

        // Definir o usuário autenticado para o Laravel
        $user = User::find($accessToken->user_id);
        if ($user) {
            Auth::setUser($user);
        }

        $response = $next($request);

        $accessToken->markAsUsed();

        return $response;
    }

    private function extractToken(Request $request): ?string
    {
        $authorization = $request->bearerToken();
        if ($authorization) {
            return $authorization;
        }

        $headerToken = $request->header('X-AssetsMe-Token');
        if (is_string($headerToken) && $headerToken !== '') {
            return $headerToken;
        }

        $queryToken = $request->query('token');
        if (is_string($queryToken) && $queryToken !== '') {
            return $queryToken;
        }

        return null;
    }

    private function unauthorized(): JsonResponse
    {
        return new JsonResponse([
            'message' => 'Unauthorized',
        ], Response::HTTP_UNAUTHORIZED);
    }
}
