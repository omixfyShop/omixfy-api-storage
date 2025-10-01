<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TokenAuthMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $expectedToken = (string) config('assetsme.token');
        $providedToken = (string) $request->bearerToken();

        if ($expectedToken === '') {
            return new JsonResponse([
                'message' => 'Asset token not configured.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if ($providedToken === '' || !hash_equals($expectedToken, $providedToken)) {
            return new JsonResponse([
                'message' => 'Unauthorized.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        return $next($request);
    }
}
