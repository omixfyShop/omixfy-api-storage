<?php

namespace App\Actions\Fortify;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    /**
     * Validate and create a newly registered user.
     */
    public function create(array $input): User
    {
        $isFirstUser = User::query()->count() === 0;

        if (! $isFirstUser) {
            $registrationSettings = Setting::get('registration_enabled', ['on' => false]);
            $registrationEnabled = (bool) data_get($registrationSettings, 'on', false);

            if (! $registrationEnabled && ! (bool) env('REGISTRATION_DEV_ALWAYS_OPEN', false)) {
                throw ValidationException::withMessages([
                    'email' => __('Cadastro desabilitado pelo administrador.'),
                ]);
            }
        }

        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
        ])->validate();

        $attributes = [
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => Hash::make($input['password']),
        ];

        if ($isFirstUser) {
            $attributes['is_master'] = true;
        }

        $user = User::create($attributes);

        if ($isFirstUser) {
            Setting::put('registration_enabled', ['on' => false]);
        }

        return $user;
    }
}
