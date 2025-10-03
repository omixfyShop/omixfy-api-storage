<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class SettingsController extends Controller
{
    public function showRegistration(): JsonResponse
    {
        Gate::authorize('toggle-registration');

        $settings = Setting::get('registration_enabled', ['on' => false]);
        $registrationEnabled = (bool) data_get($settings, 'on', false);

        return response()->json([
            'data' => [
                'on' => $registrationEnabled,
            ],
        ]);
    }

    public function updateRegistration(Request $request): JsonResponse
    {
        Gate::authorize('toggle-registration');

        $validated = $request->validate([
            'on' => ['required', 'boolean'],
        ]);

        $enabled = (bool) $validated['on'];

        Setting::put('registration_enabled', ['on' => $enabled]);

        return response()->json([
            'data' => [
                'on' => $enabled,
            ],
        ]);
    }
}
