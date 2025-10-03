<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('manage-users');

        $users = User::query()
            ->select(['id', 'name', 'email', 'is_master', 'created_at'])
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 10));

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('manage-users');

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['nullable', 'string', Password::defaults()],
            'generate_password' => ['sometimes', 'boolean'],
        ]);

        $validator->after(function ($validator) use ($request): void {
            $shouldGenerate = $request->boolean('generate_password');

            if (! $shouldGenerate && blank($request->input('password'))) {
                $validator->errors()->add('password', __('Informe uma senha ou escolha gerar automaticamente.'));
            }
        });

        $data = $validator->validate();

        $temporaryPassword = null;

        if ($request->boolean('generate_password')) {
            $temporaryPassword = Str::random(24);
        }

        $password = $temporaryPassword ?? $data['password'];

        if (! $password) {
            throw ValidationException::withMessages([
                'password' => __('Não foi possível determinar a senha do usuário.'),
            ]);
        }

        $user = new User([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($password),
        ]);

        $user->forceFill([
            'email_verified_at' => now(),
            'is_master' => false,
        ]);

        $user->save();

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_master' => $user->is_master,
                'created_at' => $user->created_at,
            ],
            'temporary_password' => $temporaryPassword,
        ], 201);
    }

    public function destroy(User $user): JsonResponse
    {
        Gate::authorize('manage-users');

        if ($user->is_master) {
            return response()->json([
                'message' => __('Não é possível remover o usuário master.'),
            ], 422);
        }

        $user->delete();

        return response()->json(status: 204);
    }
}
