<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use App\Models\User;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Arr;

class EnsureRegistrationOpen
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): RedirectResponse|Response|JsonResponse
    {
        if (User::query()->count() > 0) {
            $settings = Setting::get('registration_enabled', ['on' => false]);
            $on = Arr::get((array) $settings, 'on', false);

            if (! $on && ! (bool) env('REGISTRATION_DEV_ALWAYS_OPEN', false)) {
                return redirect()->route('login')->with('status', __('Cadastro desabilitado'));
            }
        }

        return $next($request);
    }
}
