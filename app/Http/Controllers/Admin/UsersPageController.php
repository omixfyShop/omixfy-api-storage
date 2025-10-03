<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class UsersPageController extends Controller
{
    public function __invoke(Request $request): Response
    {
        Gate::authorize('manage-users');

        $users = User::query()
            ->select(['id', 'name', 'email', 'is_master', 'created_at'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_master' => (bool) $user->is_master,
                'created_at' => $user->created_at?->toIso8601String(),
            ]);

        $registrationEnabled = (bool) data_get(
            Setting::get('registration_enabled', ['on' => false]),
            'on',
            false
        );

        return Inertia::render('users/index', [
            'users' => $users,
            'registrationEnabled' => $registrationEnabled,
        ]);
    }
}
