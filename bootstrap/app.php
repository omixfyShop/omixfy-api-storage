<?php

use App\Http\Middleware\EnsureRegistrationOpen;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\TokenAuth;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Middleware\HandleCors;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->use([
            HandleCors::class,
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'token' => TokenAuth::class,
            'registration-open' => EnsureRegistrationOpen::class,
        ]);
    })
    ->withCommands()
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (Throwable $exception, Request $request) {
            if (! $request->is('api/*') && ! $request->expectsJson()) {
                return null;
            }

            if ($exception instanceof HttpExceptionInterface || $exception instanceof ValidationException) {
                return null;
            }

            $reference = (string) Str::uuid();

            Log::error('Unhandled API exception', [
                'reference' => $reference,
                'exception' => $exception::class,
                'exception_message' => $exception->getMessage(),
                'location' => $exception->getFile().':'.$exception->getLine(),
                'method' => $request->getMethod(),
                'route' => $request->getPathInfo(),
            ]);

            $isDebug = (bool) config('app.debug');

            $payload = [
                'message' => $isDebug
                    ? $exception->getMessage()
                    : 'An unexpected error occurred while processing your request.',
                'code' => 'internal_error',
                'reference' => $reference,
            ];

            if ($isDebug) {
                $payload['exception'] = $exception::class;
            }

            return new JsonResponse($payload, Response::HTTP_INTERNAL_SERVER_ERROR);
        });
    })->create();
