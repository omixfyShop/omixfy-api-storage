<?php

use App\Models\AccessToken;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;
use function Pest\Laravel\artisan;

it('generates an access token for the provided user', function () {
    Str::createRandomStringsUsing(fn () => str_repeat('A', 64));

    try {
        $user = User::factory()->create(['email' => 'cli@example.com']);

        artisan('assetsme:token', ['user' => $user->email, '--name' => 'CLI Token'])
            ->expectsOutputToContain('Token criado para cli@example.com')
            ->expectsOutputToContain(str_repeat('A', 64))
            ->assertExitCode(Command::SUCCESS);

        $token = AccessToken::query()->where('user_id', $user->id)->first();

        expect($token)->not()->toBeNull();
        expect($token?->name)->toBe('CLI Token');
        expect($token?->token_hash)->toBe(hash('sha256', str_repeat('A', 64)));
    } finally {
        Str::createRandomStringsNormally();
    }
});

it('returns an error when the user cannot be found', function () {
    artisan('assetsme:token', ['user' => 'missing@example.com'])
        ->expectsOutputToContain('Usuário não encontrado')
        ->assertExitCode(Command::FAILURE);
});
