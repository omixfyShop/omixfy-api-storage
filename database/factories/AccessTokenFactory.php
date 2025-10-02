<?php

namespace Database\Factories;

use App\Models\AccessToken;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<AccessToken>
 */
class AccessTokenFactory extends Factory
{
    protected $model = AccessToken::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => null,
            'token_hash' => hash('sha256', Str::random(64)),
            'last_used_at' => null,
        ];
    }
}
