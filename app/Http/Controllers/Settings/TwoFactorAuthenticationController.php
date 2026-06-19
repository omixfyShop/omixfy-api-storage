<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\TwoFactorAuthenticationRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class TwoFactorAuthenticationController extends Controller
{

    /**
     * Show the user's two-factor authentication settings page.
     */
    public function show(TwoFactorAuthenticationRequest $request): Response|RedirectResponse
    {
        $request->ensureStateIsValid();

        if ($this->requiresPasswordConfirmation($request)) {
            return redirect()->route('password.confirm');
        }

        return Inertia::render('settings/two-factor', [
            'twoFactorEnabled' => $request->user()->hasEnabledTwoFactorAuthentication(),
            'requiresConfirmation' => Features::optionEnabled(Features::twoFactorAuthentication(), 'confirm'),
        ]);
    }

    private function requiresPasswordConfirmation(TwoFactorAuthenticationRequest $request): bool
    {
        if (! Features::optionEnabled(Features::twoFactorAuthentication(), 'confirmPassword')) {
            return false;
        }

        $confirmedAt = $request->session()->get('auth.password_confirmed_at');
        $timeout = (int) config('auth.password_timeout', 10800);

        return $confirmedAt === null || (time() - (int) $confirmedAt) > $timeout;
    }
}
